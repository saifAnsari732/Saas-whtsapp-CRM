import { NextResponse } from 'next/server';
import { getAdminDb, cleanForFirestore } from '@/lib/firebase/admin';
import { getAccountContext } from '@/lib/firebase/auth-helper';

export const dynamic = 'force-dynamic';

export interface InteractiveButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text: string;
  url?: string;
  phone_number?: string;
}

export const DEMO_TEMPLATES = [
  {
    name: 'welcome_lead_intro',
    category: 'Marketing',
    language: 'en_US',
    header_type: 'text',
    header_content: 'Welcome to ChatFlyr Official WhatsApp',
    body_text: 'Hello {{name}}! Welcome to our official WhatsApp service. We help businesses automate leads, broadcasts, and customer support.\n\nHow can our team assist your business today?',
    footer_text: 'ChatFlyr Automation • Reply STOP to unsubscribe',
    buttons: [
      { type: 'QUICK_REPLY', text: 'Explore Features' },
      { type: 'QUICK_REPLY', text: 'Book Free Demo' },
      { type: 'URL', text: 'Visit Website', url: 'https://chatflyr.com' }
    ],
    status: 'Approved'
  },
  {
    name: 'festive_flash_sale_30',
    category: 'Marketing',
    language: 'en_US',
    header_type: 'text',
    header_content: 'Special Festive Offer 🎉',
    body_text: 'Hi {{name}}! Get an exclusive 30% discount on all our services and products this week.\n\nUse Promo Code: *FESTIVE30* at checkout.\nOffer valid for the next 48 hours only!',
    footer_text: 'Terms & conditions apply',
    buttons: [
      { type: 'QUICK_REPLY', text: 'Claim 30% OFF' },
      { type: 'URL', text: 'Shop Online', url: 'https://chatflyr.com/pricing' },
      { type: 'PHONE_NUMBER', text: 'Call Sales', phone_number: '+919511450914' }
    ],
    status: 'Approved'
  },
  {
    name: 'order_status_update',
    category: 'Utility',
    language: 'en_US',
    header_type: 'text',
    header_content: 'Order Confirmed ✅',
    body_text: 'Hello {{name}}, your order #{{order_id}} has been confirmed and is being processed for dispatch.\n\nEstimated Delivery: 2-3 business days.',
    footer_text: 'Thank you for choosing us!',
    buttons: [
      { type: 'QUICK_REPLY', text: 'Track Package' },
      { type: 'QUICK_REPLY', text: 'Modify Order' },
      { type: 'PHONE_NUMBER', text: 'Helpdesk Support', phone_number: '+919511450914' }
    ],
    status: 'Approved'
  },
  {
    name: 'appointment_confirmation',
    category: 'Utility',
    language: 'en_US',
    header_type: 'text',
    header_content: 'Upcoming Appointment Reminder 📅',
    body_text: 'Hi {{name}}, this is a quick reminder for your scheduled appointment with our team.\n\nDate: Tomorrow\nTime: 11:30 AM\nMode: WhatsApp Video / Phone Call',
    footer_text: 'Please confirm your availability',
    buttons: [
      { type: 'QUICK_REPLY', text: 'I Will Attend ✅' },
      { type: 'QUICK_REPLY', text: 'Reschedule 🔄' },
      { type: 'PHONE_NUMBER', text: 'Call Office', phone_number: '+919511450914' }
    ],
    status: 'Approved'
  },
  {
    name: 'customer_review_request',
    category: 'Utility',
    language: 'en_US',
    header_type: 'text',
    header_content: 'How was your experience? ⭐',
    body_text: 'Hi {{name}}, thank you for doing business with us! Could you take 30 seconds to rate your experience? Your feedback helps us serve you better.',
    footer_text: 'We value your feedback',
    buttons: [
      { type: 'QUICK_REPLY', text: '5 Stars ⭐⭐⭐⭐⭐' },
      { type: 'URL', text: 'Write Review', url: 'https://chatflyr.com/reviews' },
      { type: 'QUICK_REPLY', text: 'Talk to Support' }
    ],
    status: 'Approved'
  },
  {
    name: 'festive_offer_image_banner',
    category: 'Marketing',
    language: 'en_US',
    header_type: 'image',
    header_content: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80',
    header_media_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80',
    body_text: 'Dear {{name}}, celebrate this special occasion with exclusive offers! Get flat 40% OFF on all products today.\n\nReply to this message or tap below to claim your discount.',
    footer_text: 'Limited Period Offer • ChatFlyr',
    buttons: [
      { type: 'QUICK_REPLY', text: 'Claim 40% OFF 🎉' },
      { type: 'URL', text: 'View Catalog', url: 'https://chatflyr.com' }
    ],
    status: 'Approved'
  }
];

export function normalizeTemplateRecord(docId: string, data: any) {
  const header_type = data.header_type || data.headerType || data.header_format || data.headerFormat || null;
  const header_media_url = data.header_media_url || data.headerMediaUrl || null;
  const body_text = data.body_text || data.bodyText || '';
  const footer_text = data.footer_text || data.footerText || null;
  const header_content = data.header_content || data.headerContent || null;

  return {
    ...data,
    id: docId || data.id,
    name: data.name,
    category: data.category || 'Marketing',
    language: data.language || 'en_US',
    header_type: header_type ? String(header_type).toLowerCase() : null,
    headerType: header_type ? String(header_type).toLowerCase() : null,
    header_format: header_type ? String(header_type).toLowerCase() : null,
    headerFormat: header_type ? String(header_type).toLowerCase() : null,
    header_media_url,
    headerMediaUrl: header_media_url,
    body_text,
    bodyText: body_text,
    footer_text,
    footerText: footer_text,
    header_content,
    headerContent: header_content,
    buttons: data.buttons || [],
    status: (data.status || 'APPROVED').toUpperCase(),
  };
}

export async function GET(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any);
    const user = accCtx?.user;
    const accountId = accCtx?.accountId;

    if (!user || !accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    const mergedMap = new Map<string, any>();
    const db = getAdminDb();

    if (db) {
      // 1. Fetch from accounts/{accountId}/templates
      try {
        const acctSnap = await db
          .collection('accounts')
          .doc(accountId)
          .collection('templates')
          .get();

        acctSnap.forEach((doc) => {
          const norm = normalizeTemplateRecord(doc.id, doc.data());
          const key = `${norm.name}_${norm.language || 'en_US'}`.toLowerCase();
          mergedMap.set(key, norm);
        });
      } catch (acctErr) {
        console.warn('[templates GET] Account templates read warning:', acctErr);
      }

      // 2. Fetch from message_templates where account_id == accountId or accountId == accountId
      try {
        const [snap1, snap2] = await Promise.all([
          db.collection('message_templates').where('account_id', '==', accountId).get(),
          db.collection('message_templates').where('accountId', '==', accountId).get(),
        ]);

        const mergeSnapDoc = (doc: any) => {
          const norm = normalizeTemplateRecord(doc.id, doc.data());
          const key = `${norm.name}_${norm.language || 'en_US'}`.toLowerCase();
          if (!mergedMap.has(key)) {
            mergedMap.set(key, norm);
          } else {
            const existing = mergedMap.get(key);
            mergedMap.set(key, {
              ...existing,
              ...norm,
              header_media_url: norm.header_media_url || existing.header_media_url || null,
              headerMediaUrl: norm.header_media_url || existing.header_media_url || null,
              header_type: norm.header_type || existing.header_type || null,
              headerType: norm.header_type || existing.header_type || null,
            });
          }
        };

        snap1.forEach(mergeSnapDoc);
        snap2.forEach(mergeSnapDoc);
      } catch (fsErr) {
        console.warn('[templates GET] message_templates read warning:', fsErr);
      }

      // 3. Fallback: Seed DEMO_TEMPLATES into Firestore if account has no templates yet
      if (mergedMap.size === 0) {
        for (const dt of DEMO_TEMPLATES) {
          const docId = `tmpl_${dt.name}_${accountId.slice(0, 8)}`;
          const tmplData = cleanForFirestore({
            id: docId,
            ...dt,
            account_id: accountId,
            accountId: accountId,
            user_id: user.uid,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          mergedMap.set(`${dt.name}_${dt.language}`.toLowerCase(), tmplData);

          // Save asynchronously
          void Promise.allSettled([
            db.collection('message_templates').doc(docId).set(tmplData),
            db.collection('accounts').doc(accountId).collection('templates').doc(docId).set(tmplData),
          ]).catch(() => {});
        }
      }
    }

    let templates = Array.from(mergedMap.values());

    if (statusFilter && statusFilter !== 'all') {
      templates = templates.filter(
        (t) => (t.status || '').toLowerCase() === statusFilter.toLowerCase()
      );
    }

    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any);
    const user = accCtx?.user;
    const accountId = accCtx?.accountId;

    if (!user || !accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      category = 'Marketing',
      language = 'en_US',
      header_type = 'text',
      header_content = '',
      header_media_url = null,
      body_text,
      footer_text = '',
      buttons = [],
    } = body;

    if (!name || !body_text) {
      return NextResponse.json({ error: 'Template name and body text are required' }, { status: 400 });
    }

    const cleanName = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const docId = `tmpl_${cleanName}_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const resolvedHeaderMedia = header_media_url || body.header_media_url || null;
    const resolvedHeaderType = header_type || (resolvedHeaderMedia ? 'image' : (header_content ? 'text' : null));

    const record = cleanForFirestore({
      id: docId,
      name: cleanName,
      category,
      language,
      header_type: resolvedHeaderType,
      header_content: header_content || null,
      header_media_url: resolvedHeaderMedia,
      body_text,
      footer_text: footer_text || null,
      buttons: Array.isArray(buttons) ? buttons : [],
      status: 'Approved',
      account_id: accountId,
      accountId: accountId,
      user_id: user.uid,
      created_at: nowIso,
      updated_at: nowIso,
    });

    const db = getAdminDb();
    if (db) {
      await Promise.allSettled([
        db.collection('message_templates').doc(docId).set(record),
        db.collection('accounts').doc(accountId).collection('templates').doc(docId).set(record),
      ]);
    }

    return NextResponse.json({ success: true, template: record });
  } catch (error: any) {
    console.error('Failed to create template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any);
    const user = accCtx?.user;
    const accountId = accCtx?.accountId;

    if (!user || !accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, category, language, header_type, header_content, header_media_url, body_text, footer_text, buttons } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };

    if (name) updatePayload.name = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (category) updatePayload.category = category;
    if (language) updatePayload.language = language;
    if (header_type !== undefined) updatePayload.header_type = header_type;
    if (header_content !== undefined) updatePayload.header_content = header_content || null;
    if (header_media_url !== undefined || body.header_media_url !== undefined) {
      updatePayload.header_media_url = header_media_url ?? body.header_media_url ?? null;
    }
    if (body_text) updatePayload.body_text = body_text;
    if (footer_text !== undefined) updatePayload.footer_text = footer_text || null;
    if (buttons !== undefined) updatePayload.buttons = Array.isArray(buttons) ? buttons : [];

    const cleanedUpdate = cleanForFirestore(updatePayload);
    const db = getAdminDb();
    if (db) {
      await Promise.allSettled([
        db.collection('message_templates').doc(id).set(cleanedUpdate, { merge: true }),
        db.collection('accounts').doc(accountId).collection('templates').doc(id).set(cleanedUpdate, { merge: true }),
      ]);
    }

    return NextResponse.json({
      success: true,
      template: { id, ...cleanedUpdate },
    });
  } catch (error: any) {
    console.error('Failed to update template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any);
    const user = accCtx?.user;
    const accountId = accCtx?.accountId;

    if (!user || !accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const db = getAdminDb();
    if (db) {
      await Promise.allSettled([
        db.collection('message_templates').doc(id).delete(),
        db.collection('accounts').doc(accountId).collection('templates').doc(id).delete(),
      ]);
    }

    return NextResponse.json({ success: true, message: 'Template deleted' });
  } catch (error: any) {
    console.error('Failed to delete template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
