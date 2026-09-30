// ============================================================
// Firestore Collection & Document path helpers
// All data under accounts/{accountId}/... for multi-tenancy
// ============================================================

export const Collections = {
  // Top-level
  users: 'users',
  accounts: 'accounts',
  invitations: 'invitations',
  coupons: 'coupons',

  // Under accounts/{accountId}/
  contacts:           (accountId: string) => `accounts/${accountId}/contacts`,
  tags:               (accountId: string) => `accounts/${accountId}/tags`,
  conversations:      (accountId: string) => `accounts/${accountId}/conversations`,
  messages:           (accountId: string, convId: string) => `accounts/${accountId}/conversations/${convId}/messages`,
  templates:          (accountId: string) => `accounts/${accountId}/templates`,
  broadcasts:         (accountId: string) => `accounts/${accountId}/broadcasts`,
  broadcastRecipients:(accountId: string, broadcastId: string) => `accounts/${accountId}/broadcasts/${broadcastId}/recipients`,
  automations:        (accountId: string) => `accounts/${accountId}/automations`,
  flows:              (accountId: string) => `accounts/${accountId}/flows`,
  flowRuns:           (accountId: string, flowId: string) => `accounts/${accountId}/flows/${flowId}/runs`,
  keywordFlows:       (accountId: string) => `accounts/${accountId}/keyword_flows`,
  pipelines:          (accountId: string) => `accounts/${accountId}/pipelines`,
  pipelineStages:     (accountId: string, pipelineId: string) => `accounts/${accountId}/pipelines/${pipelineId}/stages`,
  deals:              (accountId: string) => `accounts/${accountId}/deals`,
  billingOrders:      (accountId: string) => `accounts/${accountId}/billing_orders`,
  walletTransactions: (accountId: string) => `accounts/${accountId}/wallet_transactions`,
  apiKeys:            (accountId: string) => `accounts/${accountId}/api_keys`,
  members:            (accountId: string) => `accounts/${accountId}/members`,
  notifications:      (accountId: string) => `accounts/${accountId}/notifications`,
  aiKnowledge:        (accountId: string) => `accounts/${accountId}/ai_knowledge`,
  quickReplies:       (accountId: string) => `accounts/${accountId}/quick_replies`,
  webhooks:           (accountId: string) => `accounts/${accountId}/webhooks`,
  contactNotes:       (accountId: string, contactId: string) => `accounts/${accountId}/contacts/${contactId}/notes`,
};

// Single document paths
export const Docs = {
  user:          (uid: string)       => `users/${uid}`,
  account:       (accountId: string) => `accounts/${accountId}`,
  whatsappConfig:(accountId: string) => `accounts/${accountId}/whatsapp_config/config`,
  aiConfig:      (accountId: string) => `accounts/${accountId}/ai_config/config`,
  chatbotConfig: (accountId: string) => `accounts/${accountId}/chatbot_config/config`,
  wallet:        (accountId: string) => `accounts/${accountId}/wallet/data`,
};
