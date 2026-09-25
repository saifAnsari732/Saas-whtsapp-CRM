export interface PlanFeatureConfig {
  id: string;
  name: string;
  price: number;
  period: 'month' | 'year' | '5-day';
  maxMessages: number; // -1 for unlimited
  maxContacts: number; // -1 for unlimited
  maxAgents: number; // -1 for unlimited
  features: {
    metaApi: boolean;
    qrCoexistence: boolean;
    sharedInbox: boolean;
    broadcasts: boolean;
    automations: boolean;
    flows: boolean;
    aiReply: boolean;
    pipelines: boolean;
    templates: boolean;
    webhooks: boolean;
    exportContacts: boolean;
    prioritySupport: boolean;
  };
  allowedRoutes: string[];
  description: string;
  badge: string;
}

export const PLAN_CONFIGS: Record<string, PlanFeatureConfig> = {
  // 5-Day Free Trial: ALL FEATURES ENABLED!
  trial: {
    id: 'trial',
    name: '5-Day Full Access Trial',
    price: 0,
    period: '5-day',
    maxMessages: 5000,
    maxContacts: 2500,
    maxAgents: 3,
    features: {
      metaApi: true,
      qrCoexistence: true,
      sharedInbox: true,
      broadcasts: true,
      automations: true,
      flows: true,
      aiReply: true,
      pipelines: true,
      templates: true,
      webhooks: true,
      exportContacts: true,
      prioritySupport: false
    },
    allowedRoutes: [
      '/dashboard',
      '/inbox',
      '/dashboard/chats',
      '/dashboard/coexistence',
      '/broadcasts',
      '/broadcasts/new',
      '/automations',
      '/flows',
      '/keyword-flows',
      '/contacts',
      '/pipelines',
      '/notifications',
      '/billing',
      '/settings',
      '/profile'
    ],
    description: 'Full unhindered access to all WhatsApp marketing & CRM features for 5 days.',
    badge: 'Free Trial'
  },

  essential: {
    id: 'essential',
    name: 'Essential Plan',
    price: 999,
    period: 'month',
    maxMessages: 15000,
    maxContacts: 15000,
    maxAgents: 5,
    features: {
      metaApi: true,
      qrCoexistence: true,
      sharedInbox: true,
      broadcasts: true,
      automations: true,
      flows: false,
      aiReply: false,
      pipelines: true,
      templates: true,
      webhooks: true,
      exportContacts: true,
      prioritySupport: false
    },
    allowedRoutes: [
      '/dashboard',
      '/inbox',
      '/dashboard/chats',
      '/dashboard/coexistence',
      '/broadcasts',
      '/broadcasts/new',
      '/automations',
      '/contacts',
      '/pipelines',
      '/notifications',
      '/billing',
      '/settings',
      '/profile'
    ],
    description: '5 Team members, 15,000 messages, QR coexistence, bulk broadcasts & automations.',
    badge: 'Essential'
  },

  growth: {
    id: 'growth',
    name: 'Growth Plan',
    price: 1999,
    period: 'month',
    maxMessages: 50000,
    maxContacts: -1, // Unlimited
    maxAgents: 15,
    features: {
      metaApi: true,
      qrCoexistence: true,
      sharedInbox: true,
      broadcasts: true,
      automations: true,
      flows: true,
      aiReply: true,
      pipelines: true,
      templates: true,
      webhooks: true,
      exportContacts: true,
      prioritySupport: true
    },
    allowedRoutes: [
      '/dashboard',
      '/inbox',
      '/dashboard/chats',
      '/dashboard/coexistence',
      '/broadcasts',
      '/broadcasts/new',
      '/automations',
      '/flows',
      '/keyword-flows',
      '/contacts',
      '/pipelines',
      '/agents',
      '/notifications',
      '/billing',
      '/settings',
      '/profile'
    ],
    description: '15 Team members, 50,000 messages, visual flow builder, AI smart replies & unlimited contacts.',
    badge: 'Growth'
  },

  allinone: {
    id: 'allinone',
    name: 'All-In-One Enterprise',
    price: 3999,
    period: 'month',
    maxMessages: -1, // Unlimited
    maxContacts: -1, // Unlimited
    maxAgents: -1,   // Unlimited
    features: {
      metaApi: true,
      qrCoexistence: true,
      sharedInbox: true,
      broadcasts: true,
      automations: true,
      flows: true,
      aiReply: true,
      pipelines: true,
      templates: true,
      webhooks: true,
      exportContacts: true,
      prioritySupport: true
    },
    allowedRoutes: [
      '/dashboard',
      '/inbox',
      '/dashboard/chats',
      '/dashboard/coexistence',
      '/broadcasts',
      '/broadcasts/new',
      '/automations',
      '/flows',
      '/keyword-flows',
      '/contacts',
      '/pipelines',
      '/agents',
      '/notifications',
      '/billing',
      '/settings',
      '/profile'
    ],
    description: 'Unlimited messaging, unlimited contacts, custom integrations & dedicated manager.',
    badge: 'Enterprise'
  },

  enterprise: {
    id: 'enterprise',
    name: 'Platform Super Admin',
    price: 0,
    period: 'month',
    maxMessages: -1,
    maxContacts: -1,
    maxAgents: -1,
    features: {
      metaApi: true,
      qrCoexistence: true,
      sharedInbox: true,
      broadcasts: true,
      automations: true,
      flows: true,
      aiReply: true,
      pipelines: true,
      templates: true,
      webhooks: true,
      exportContacts: true,
      prioritySupport: true
    },
    allowedRoutes: [
      '/dashboard',
      '/inbox',
      '/dashboard/chats',
      '/dashboard/coexistence',
      '/broadcasts',
      '/broadcasts/new',
      '/automations',
      '/flows',
      '/keyword-flows',
      '/contacts',
      '/pipelines',
      '/agents',
      '/notifications',
      '/billing',
      '/settings',
      '/admin',
      '/profile'
    ],
    description: 'Full Platform Super Admin with unrestricted master powers.',
    badge: 'Super Admin'
  }
};

export function getPlanConfig(planId: string | null | undefined, isTrial: boolean = false): PlanFeatureConfig {
  if (isTrial) return PLAN_CONFIGS.trial;
  if (!planId) return PLAN_CONFIGS.trial;
  const normalized = planId.toLowerCase().replace(/[-_]/g, '');
  if (normalized === 'allinone') return PLAN_CONFIGS.allinone;
  if (normalized === 'growth') return PLAN_CONFIGS.growth;
  if (normalized === 'essential' || normalized === 'starter') return PLAN_CONFIGS.essential;
  if (normalized === 'enterprise') return PLAN_CONFIGS.enterprise;
  return PLAN_CONFIGS.trial;
}
