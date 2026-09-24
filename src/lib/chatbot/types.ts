export type BotMode = 'hybrid' | 'ai' | 'keyword';

export type BotPersona = 'sales' | 'support' | 'lead_gen' | 'ecommerce' | 'custom';

export interface KeywordRule {
  id: string;
  keywords: string[];
  match_type: 'contains' | 'exact';
  reply_text: string;
  is_active: boolean;
}

export interface FollowUpStep {
  id: string;
  step_number: number;
  delay_value: number;
  delay_unit: 'minutes' | 'hours' | 'days';
  message_text: string;
  is_active: boolean;
}

export interface FollowUpSequence {
  id: string;
  name: string;
  is_active: boolean;
  trigger_event: 'no_reply_inbound' | 'no_reply_broadcast';
  cancel_on_reply: boolean;
  steps: FollowUpStep[];
}

export interface FollowUpQueueItem {
  id: string;
  contact_jid: string;
  contact_name: string;
  step_number: number;
  message_text: string;
  scheduled_at: string;
  status: 'pending' | 'sent' | 'cancelled';
  last_incoming_at?: string;
}

export interface ChatbotSettings {
  is_active: boolean;
  bot_mode: BotMode;
  persona: BotPersona;
  system_prompt: string;
  welcome_enabled: boolean;
  welcome_message: string;
  fallback_message: string;
  away_enabled: boolean;
  away_message: string;
  typing_delay_seconds: number;
  max_replies_per_conv: number;
  keyword_rules: KeywordRule[];
  follow_up_sequence: FollowUpSequence;
}

export const PERSONA_PROMPTS: Record<BotPersona, { title: string; desc: string; prompt: string }> = {
  sales: {
    title: 'Sales & Deal Closer',
    desc: 'Focuses on understanding client needs, highlighting ROI, answering pricing questions, and booking demos.',
    prompt: `You are an elite Sales Assistant for our company on WhatsApp.
Your goal is to warmly greet prospective clients, understand their needs, present our product/services benefits with clear value propositions, handle any hesitation or objections gracefully, and guide them to take action (e.g. booking a call, signing up, or purchasing).
Keep responses friendly, persuasive, concise (1-3 short paragraphs max), and professional. Always end with a helpful question or a clear call to action.`
  },
  support: {
    title: 'Customer Support Specialist',
    desc: 'Empathetic, clear, and focused on resolving user questions, troubleshooting, and escalating when needed.',
    prompt: `You are a polite, helpful, and empathetic Customer Support Specialist on WhatsApp.
Your goal is to assist customers with troubleshooting, answer FAQs about our services, provide clear step-by-step guidance, and ensure they have a wonderful experience.
If you cannot answer a complex technical question or account-specific issue, politely inform the customer that you are escalating to a human specialist who will connect shortly.`
  },
  lead_gen: {
    title: 'Lead Qualification Bot',
    desc: 'Asks smart discovery questions to qualify budget, timeline, and requirements before scheduling.',
    prompt: `You are a friendly Lead Qualification Assistant on WhatsApp.
Your goal is to gather key information from prospective clients:
1. What specific requirements or challenges they are looking to solve
2. Their estimated timeline / urgency
3. Their budget or scale of requirements
Ask one or two thoughtful questions at a time in a natural conversational flow. Once qualified, invite them to confirm their email or preferred time for our team to follow up.`
  },
  ecommerce: {
    title: 'E-Commerce & Orders Assistant',
    desc: 'Helps customers discover products, track orders, understand delivery times, and provides offers.',
    prompt: `You are a lively WhatsApp Shopping Assistant for our online store.
Your goal is to assist customers with product recommendations, availability, shipping/delivery timelines, return policies, and promotional discount codes.
Be enthusiastic, concise, and helpful. Format product options with clear bullet points and prices when relevant.`
  },
  custom: {
    title: 'Custom Persona',
    desc: 'Define your own custom instructions and personality for your WhatsApp chatbot.',
    prompt: `You are an intelligent WhatsApp AI Assistant for our business.
Respond to customer queries promptly, accurately, and politely. Keep messages concise and formatted nicely for WhatsApp mobile reading.`
  }
};

export const DEFAULT_KEYWORD_RULES: KeywordRule[] = [
  {
    id: 'rule-1',
    keywords: ['hi', 'hello', 'hey', 'start', 'namaste'],
    match_type: 'contains',
    reply_text: 'Hello {name}! 👋 Thank you for reaching out to us. How can we assist you today?\n\n1️⃣ Product Details\n2️⃣ Pricing & Plans\n3️⃣ Talk to Support\n\nReply with what you need and we will help you instantly!',
    is_active: true
  },
  {
    id: 'rule-2',
    keywords: ['price', 'pricing', 'cost', 'rate', 'plan'],
    match_type: 'contains',
    reply_text: 'Here are our current popular plans:\n\n✨ Starter: Essential WhatsApp marketing tools\n🚀 Growth: Full CRM, automations & coexistence\n🏢 Enterprise: Unlimited team seats & dedicated support\n\nWould you like a customized quote or a quick 5-minute demo call?',
    is_active: true
  },
  {
    id: 'rule-3',
    keywords: ['human', 'agent', 'support', 'call', 'talk'],
    match_type: 'contains',
    reply_text: 'Understood! I have notified our human support team. A representative will be with you shortly. 🕒 In the meantime, please feel free to share any details about your question.',
    is_active: true
  }
];

export const DEFAULT_FOLLOW_UP_STEPS: FollowUpStep[] = [
  {
    id: 'step-1',
    step_number: 1,
    delay_value: 30,
    delay_unit: 'minutes',
    message_text: 'Hi {name}! 👋 Just following up to see if you had any questions regarding what we discussed earlier? Happy to clarify anything!',
    is_active: true
  },
  {
    id: 'step-2',
    step_number: 2,
    delay_value: 24,
    delay_unit: 'hours',
    message_text: 'Hey {name}, wanted to share a quick update with you! We have an exclusive onboarding offer available this week. Would you like me to send you the details?',
    is_active: true
  },
  {
    id: 'step-3',
    step_number: 3,
    delay_value: 48,
    delay_unit: 'hours',
    message_text: 'Hi {name}, I know schedules get busy! I will not take more of your time, but feel free to message us back whenever you are ready. Have a wonderful day ahead! ✨',
    is_active: true
  }
];
