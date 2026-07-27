import { createClient } from '@supabase/supabase-js';
import { sendTemplateMessage } from '@/lib/whatsapp/send';

let _adminClient: any = null;
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
  conversationId,
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
  const matchedFlow = flows.find(flow =>
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

  // We are assuming the template doesn't require complex sample parameters (or we just send empty arrays if required)
  // For basic Keyword Flows, standard templates with no variables are recommended.
  const payload: any = {
    template: template.name,
    language: { code: template.language || 'en_US' },
  };

  // If the template needs header variables or body variables, we pass empty arrays if we can't fulfill them,
  // though Meta API might reject if it strictly requires them.
  // We will assume 0-variable templates for the simple Keyword Flow feature.

  try {
    await sendTemplateMessage(
      accountId,
      configOwnerUserId,
      contact.phone,
      template,
      {},
      conversationId
    );
    return { consumed: true };
  } catch (err) {
    console.error('[keyword-flow] failed to send template message:', err);
    return { consumed: false };
  }
}
