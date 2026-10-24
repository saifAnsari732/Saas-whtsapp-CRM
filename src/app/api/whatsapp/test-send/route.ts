import { NextResponse } from 'next/server';
import { getAdminDb, cleanForFirestore } from '@/lib/firebase/admin';
import { getWhatsAppConfigForAccount } from '@/lib/whatsapp/get-config';
import { sanitizePhoneForMeta } from '@/lib/whatsapp/phone-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleTestSend(request);
}

export async function POST(request: Request) {
  return handleTestSend(request);
}

async function handleTestSend(request: Request) {
  try {
    const url = new URL(request.url);
    const targetPhone = url.searchParams.get('phone') || '919511450914';
    const reqTemplateName = url.searchParams.get('template') || null;

    const accountId = '61740bf8-b21e-42dd-9ab3-9118bca90bc6';
    const config = await getWhatsAppConfigForAccount(accountId);

    if (!config || !config.phone_number_id || !config.decrypted_access_token) {
      return NextResponse.json({
        error: 'WhatsApp configuration not found for account',
        accountId,
      }, { status: 400 });
    }

    const { phone_number_id, decrypted_access_token, waba_id } = config;

    // 1. Fetch live templates from Meta Graph API
    let metaTemplates: any[] = [];
    if (waba_id) {
      const metaTmplRes = await fetch(
        `https://graph.facebook.com/v21.0/${waba_id}/message_templates?limit=100`,
        {
          headers: { Authorization: `Bearer ${decrypted_access_token}` },
        }
      );
      if (metaTmplRes.ok) {
        const data = await metaTmplRes.json();
        metaTemplates = data.data || [];
      }
    }

    // 2. Fetch the latest broadcast from Firestore to see what template was attempted
    const fDb = getAdminDb();
    let latestBroadcast: any = null;
    if (fDb) {
      const snap = await fDb
        .collection('accounts')
        .doc(accountId)
        .collection('broadcasts')
        .orderBy('created_at', 'desc')
        .limit(1)
        .get();
      if (!snap.empty) {
        latestBroadcast = snap.docs[0].data();
      }
    }

    const templateNameToUse = reqTemplateName || latestBroadcast?.template_name || (metaTemplates.find(t => t.status === 'APPROVED')?.name);

    // 3. Find the Meta template definition
    const matchedMetaTmpl = metaTemplates.find(
      (t) => t.name?.toLowerCase() === templateNameToUse?.toLowerCase()
    );

    const sanitizedPhone = sanitizePhoneForMeta(targetPhone);

    // 4. Inspect components from Meta definition
    const metaComponents = matchedMetaTmpl?.components || [];
    const headerComp = metaComponents.find((c: any) => c.type === 'HEADER');
    const bodyComp = metaComponents.find((c: any) => c.type === 'BODY');
    const buttonsComp = metaComponents.find((c: any) => c.type === 'BUTTONS');

    const headerFormat = (headerComp?.format || '').toUpperCase(); // 'IMAGE', 'VIDEO', 'DOCUMENT', 'TEXT'
    const bodyText = bodyComp?.text || '';

    // Count {{1}}, {{2}} in body
    const bodyVarMatches = bodyText.match(/\{\{(\d+)\}\}/g) || [];
    const bodyVarCount = new Set(bodyVarMatches).size;

    // Media URL from query param, broadcast, or sample
    const mediaUrl =
      url.searchParams.get('mediaUrl') ||
      latestBroadcast?.header_media_url ||
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80';

    // 5. Construct payload exactly according to Meta's registered template
    const sendComponents: any[] = [];

    // Header component
    if (headerFormat === 'IMAGE') {
      sendComponents.push({
        type: 'header',
        parameters: [
          {
            type: 'image',
            image: { link: mediaUrl },
          },
        ],
      });
    } else if (headerFormat === 'VIDEO') {
      sendComponents.push({
        type: 'header',
        parameters: [
          {
            type: 'video',
            video: { link: mediaUrl },
          },
        ],
      });
    } else if (headerFormat === 'DOCUMENT') {
      sendComponents.push({
        type: 'header',
        parameters: [
          {
            type: 'document',
            document: { link: mediaUrl },
          },
        ],
      });
    } else if (headerFormat === 'TEXT') {
      const headerVarMatches = (headerComp?.text || '').match(/\{\{(\d+)\}\}/g) || [];
      if (headerVarMatches.length > 0) {
        sendComponents.push({
          type: 'header',
          parameters: [{ type: 'text', text: 'Important Update' }],
        });
      }
    }

    // Body component — ONLY send if bodyVarCount > 0!
    if (bodyVarCount > 0) {
      const params = [];
      for (let i = 1; i <= bodyVarCount; i++) {
        params.push({ type: 'text', text: i === 1 ? 'Valued Customer' : 'Special Offer' });
      }
      sendComponents.push({
        type: 'body',
        parameters: params,
      });
    }

    const payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: sanitizedPhone,
      type: 'template',
      template: {
        name: matchedMetaTmpl?.name || templateNameToUse,
        language: { code: matchedMetaTmpl?.language || latestBroadcast?.template_language || 'en_US' },
      },
    };

    if (sendComponents.length > 0) {
      payload.template.components = sendComponents;
    }

    // 6. Send to Meta Graph API
    const metaSendRes = await fetch(
      `https://graph.facebook.com/v21.0/${phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${decrypted_access_token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const sendResult = await metaSendRes.json();

    return NextResponse.json({
      success: metaSendRes.ok,
      status: metaSendRes.status,
      targetPhone: sanitizedPhone,
      templateUsed: {
        name: matchedMetaTmpl?.name || templateNameToUse,
        headerFormat,
        bodyVarCount,
        status: matchedMetaTmpl?.status,
      },
      payloadSentToMeta: payload,
      metaResponse: sendResult,
      allAvailableApprovedTemplates: metaTemplates
        .filter((t) => t.status === 'APPROVED')
        .map((t) => ({
          name: t.name,
          language: t.language,
          components: t.components?.map((c: any) => ({ type: c.type, format: c.format })),
        })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
