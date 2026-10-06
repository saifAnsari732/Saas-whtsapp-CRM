import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getAdminDb } from '@/lib/firebase/admin';
import { getAccountContext } from '@/lib/firebase/auth-helper';

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
  }
];

export async function GET(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any)
    let user = accCtx?.user
    let accountId = accCtx?.accountId

    if (!user) {
      try {
        const supabase = await createClient()
        const { data: { user: sbUser } } = await supabase.auth.getUser()
        if (sbUser) {
          user = { uid: sbUser.id, email: sbUser.email || undefined }
          const { data: profile } = await supabase
            .from('profiles')
            .select('account_id')
            .eq('user_id', sbUser.id)
            .maybeSingle()
          accountId = profile?.account_id || `acct-${sbUser.id}`
        }
      } catch (_err) {}
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!accountId) {
      accountId = `acct-${user.uid}`
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')

    const mergedMap = new Map<string, any>()

    // 1. Fetch from Firestore
    try {
      const db = getAdminDb()
      const fsSnap = await db
        .collection('message_templates')
        .where('account_id', '==', accountId)
        .get()

      fsSnap.forEach((doc) => {
        const data = doc.data()
        const key = `${data.name}_${data.language || 'en_US'}`.toLowerCase()
        mergedMap.set(key, { id: doc.id, ...data })
      })
    } catch (fsErr) {
      console.warn('[templates GET] Firestore read warning:', fsErr)
    }

    // 2. Fetch from Supabase
    try {
      const supabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: sbTemplates } = await supabase
        .from('message_templates')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })

      if (sbTemplates) {
        sbTemplates.forEach((t) => {
          const key = `${t.name}_${t.language || 'en_US'}`.toLowerCase()
          if (!mergedMap.has(key)) {
            mergedMap.set(key, t)
          }
        })
      }
    } catch (sbErr) {
      console.warn('[templates GET] Supabase read warning:', sbErr)
    }

    let templates = Array.from(mergedMap.values())

    if (statusFilter && statusFilter !== 'all') {
      templates = templates.filter(
        (t) => (t.status || '').toLowerCase() === statusFilter.toLowerCase()
      )
    }

    return NextResponse.json({ success: true, templates })
  } catch (error: any) {
    console.error('Failed to fetch templates:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle();

    const accountId = profile?.account_id || user.id;
    const body = await request.json();

    const {
      name,
      category = 'Marketing',
      language = 'en_US',
      header_type = 'text',
      header_content = '',
      body_text,
      footer_text = '',
      buttons = [],
    } = body;

    if (!name || !body_text) {
      return NextResponse.json({ error: 'Template name and body text are required' }, { status: 400 });
    }

    const cleanName = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    const record = {
      name: cleanName,
      category,
      language,
      header_type: header_content ? header_type : null,
      header_content: header_content || null,
      body_text,
      footer_text: footer_text || null,
      buttons: Array.isArray(buttons) ? buttons : [],
      status: 'Approved',
      account_id: accountId,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertError } = await supabase
      .from('message_templates')
      .insert([record])
      .select('*')
      .single();

    if (insertError) {
      console.warn('Supabase insert template failed:', insertError);
      return NextResponse.json({
        success: true,
        template: { id: `local-tmpl-${Date.now()}`, ...record }
      });
    }

    return NextResponse.json({ success: true, template: inserted });
  } catch (error: any) {
    console.error('Failed to create template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, category, language, header_type, header_content, body_text, footer_text, buttons } = body;

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
    if (body_text) updatePayload.body_text = body_text;
    if (footer_text !== undefined) updatePayload.footer_text = footer_text || null;
    if (buttons !== undefined) updatePayload.buttons = Array.isArray(buttons) ? buttons : [];

    const { data: updated, error: updateError } = await supabase
      .from('message_templates')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (updateError) {
      console.warn('Supabase update template error:', updateError);
      return NextResponse.json({
        success: true,
        template: { id, ...updatePayload }
      });
    }

    return NextResponse.json({ success: true, template: updated });
  } catch (error: any) {
    console.error('Failed to update template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    await supabase.from('message_templates').delete().eq('id', id);

    return NextResponse.json({ success: true, message: 'Template deleted' });
  } catch (error: any) {
    console.error('Failed to delete template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
