import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { sendTemplateMessage } from '@/lib/whatsapp/meta-api';
import { decrypt } from '@/lib/whatsapp/encryption';
import { sanitizePhoneForMeta, isValidE164 } from '@/lib/whatsapp/phone-utils';

let _adminClient: SupabaseClient | null = null;
function supabaseAdmin() {
  if (!_adminClient) {
    _adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _adminClient;
}

interface DispatchKeywordFlowArgs {
  accountId: string;
  configOwnerUserId: string;
  contactId: string;
  conversationId: string;
  inboundText: string;
}

export async function dispatchKeywordFlow({
  accountId,
  configOwnerUserId,
  contactId,
  inboundText,
}: DispatchKeywordFlowArgs): Promise<{ consumed: boolean }> {
  const text = inboundText.trim().toLowerCase();
  if (!text) return { consumed: false };

  // Fetch all active keyword flows for this account (using configOwnerUserId)
  const { data: flows, error } = await supabaseAdmin()
    .from('keyword_flows')
    .select('id, keywords, template_id')
    .eq('user_id', configOwnerUserId)
    .eq('is_active', true);

  if (error || !flows || flows.length === 0) {
    return { consumed: false };
  }

  // Find the first flow whose keywords array contains an exact match (case-insensitive) for the inbound text
  const matchedFlow = flows.find((flow: { keywords: string[], template_id: string }) =>
    flow.keywords.map((k: string) => k.toLowerCase()).includes(text)
  );

  if (!matchedFlow) {
    return { consumed: false };
  }

  // Fetch the template details
  const { data: template, error: tplError } = await supabaseAdmin()
    .from('message_templates')
    .select('*')
    .eq('id', matchedFlow.template_id)
    .single();

  if (tplError || !template) {
    console.error('[keyword-flow] matched template not found', tplError);
    return { consumed: false };
  }

  // Fetch the contact phone
  const { data: contact, error: contactErr } = await supabaseAdmin()
    .from('contacts')
    .select('phone')
    .eq('id', contactId)
    .single();

  if (contactErr || !contact) {
    return { consumed: false };
  }

  const phone = sanitizePhoneForMeta(contact.phone);
  if (!isValidE164(phone)) {
    console.error('[keyword-flow] contact phone invalid:', contact.phone);
    return { consumed: false };
  }

  // Fetch whatsapp config for access token
  const { data: config, error: configErr } = await supabaseAdmin()
    .from('whatsapp_config')
    .select('*')
    .eq('account_id', accountId)
    .single();

  if (configErr || !config) {
    console.error('[keyword-flow] whatsapp config not found');
    return { consumed: false };
  }

  const accessToken = decrypt(config.access_token);

  try {
    await sendTemplateMessage({
      phoneNumberId: config.phone_number_id,
      accessToken,
      to: phone,
      templateName: template.name,
      language: template.language || 'en_US',
      template,
      messageParams: {},
    });

    // Optionally insert the outbound message to the messages table here,
    // or let the webhook's message status update handle it later.
    // For now we just return consumed.
    
    return { consumed: true };
  } catch (err) {
    console.error('[keyword-flow] failed to send template message:', err);
    return { consumed: false };
  }
}

