import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPlanConfig } from '@/lib/billing/plan-features';

const PAID_PLANS = ['starter', 'essential', 'growth', 'allinone', 'all-in-one', 'enterprise'];

export async function GET() {
  const supabase = await createClient();
  const adminDb = createAdminClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user profile to find account_id and check admin role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('account_id, account_role, role, email')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile?.account_id) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const ADMIN_EMAILS = [
    'ansarisaifuddin732@gmail.com',
    'kisandeveloper2@gmail.com',
    ...(process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : []),
    ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [])
  ];

  const isSuperAdmin = Boolean(
    profile?.role === 'admin' ||
    profile?.role === 'superadmin' ||
    (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase()))
  );

  const isOwner = profile.account_role === 'owner';

  // Platform Admins bypass plan lock & get full Enterprise capabilities
  if (isSuperAdmin) {
    const adminPlanConfig = getPlanConfig('enterprise', false);
    return NextResponse.json({
      status: 'active',
      plan: 'enterprise',
      planConfig: adminPlanConfig,
      trialEndsAt: null,
      subscriptionExpiresAt: null,
      daysRemaining: 365,
      isActive: true,
      isOwner,
      isSuperAdmin: true,
      isTrial: false,
      trialUsage: { messagesSent: 0, contactsCreated: 0, broadcastsSent: 0, templatesUsed: 0 },
      currentPlanLimits: { messages: -1, contacts: -1, users: -1 },
      planFeatures: adminPlanConfig.features,
      blockedFeatures: []
    });
  }

  // Get account subscription info from database
  const { data: account, error: accountError } = await adminDb
    .from('accounts')
    .select('id, created_at, subscription_status, subscription_plan, trial_ends_at, subscription_expires_at')
    .eq('id', profile.account_id)
    .single();

  if (accountError || !account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  // Fetch live usage metrics for trial / account report
  const [
    { count: contactsCount },
    { count: messagesCount },
    { count: broadcastsCount },
    { count: templatesCount }
  ] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('account_id', profile.account_id),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('account_id', profile.account_id),
    supabase.from('broadcasts').select('*', { count: 'exact', head: true }).eq('account_id', profile.account_id),
    supabase.from('message_templates').select('*', { count: 'exact', head: true }).eq('account_id', profile.account_id),
  ]);
  
  const trialUsage = {
    messagesSent: messagesCount || 0,
    contactsCreated: contactsCount || 0,
    broadcastsSent: broadcastsCount || 0,
    templatesUsed: templatesCount || 0,
  };

  const now = new Date();
  let isActive = false;
  let daysRemaining = 0;
  let trialEndsAtDate: Date | null = account.trial_ends_at ? new Date(account.trial_ends_at) : null;
  const hasPaidPlan = Boolean(account.subscription_plan && PAID_PLANS.includes(account.subscription_plan.toLowerCase()));

  if (account.subscription_status === 'blocked') {
    isActive = false;
    daysRemaining = 0;
  } else if (account.subscription_status === 'active' && hasPaidPlan) {
    if (account.subscription_expires_at) {
      const expiresAt = new Date(account.subscription_expires_at);
      if (expiresAt > now) {
        isActive = true;
        daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      } else {
        isActive = false;
        daysRemaining = 0;
        account.subscription_status = 'expired';
        await adminDb.from('accounts').update({ subscription_status: 'expired' }).eq('id', account.id);
      }
    } else {
      isActive = true;
      daysRemaining = 30;
    }
  } else {
    // Evaluate 5-day free trial
    if (!trialEndsAtDate) {
      const createdAt = account.created_at ? new Date(account.created_at) : now;
      trialEndsAtDate = new Date(createdAt.getTime() + 5 * 24 * 60 * 60 * 1000);
      account.trial_ends_at = trialEndsAtDate.toISOString();
      const newStatus = trialEndsAtDate > now ? 'trial' : 'expired';
      account.subscription_status = newStatus;
      await adminDb
        .from('accounts')
        .update({
          trial_ends_at: trialEndsAtDate.toISOString(),
          subscription_status: newStatus
        })
        .eq('id', account.id);
    }

    if (account.subscription_status === 'expired') {
      // Explicitly expired
      isActive = false;
      daysRemaining = 0;
    } else if (trialEndsAtDate && trialEndsAtDate > now) {
      isActive = true;
      account.subscription_status = 'trial';
      daysRemaining = Math.max(0, Math.ceil((trialEndsAtDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    } else {
      isActive = false;
      daysRemaining = 0;
      if (account.subscription_status !== 'expired') {
        account.subscription_status = 'expired';
        await adminDb
          .from('accounts')
          .update({ subscription_status: 'expired' })
          .eq('id', account.id);
      }
    }
  }

  const effectiveStatus = isActive
    ? (account.subscription_status === 'active' && hasPaidPlan ? 'active' : 'trial')
    : 'expired';

  const isTrial = effectiveStatus === 'trial';
  const planConfig = getPlanConfig(hasPaidPlan ? account.subscription_plan : null, isTrial);

  let blockedFeatures: string[] = [];
  if (!isActive) {
    blockedFeatures = [
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
      '/notifications'
    ];
  } else if (!isTrial && hasPaidPlan) {
    if (!planConfig.features.qrCoexistence) blockedFeatures.push('/dashboard/coexistence');
    if (!planConfig.features.broadcasts) blockedFeatures.push('/broadcasts', '/broadcasts/new');
    if (!planConfig.features.automations) blockedFeatures.push('/automations');
    if (!planConfig.features.flows) blockedFeatures.push('/flows', '/keyword-flows');
    if (!planConfig.features.pipelines) blockedFeatures.push('/pipelines');
  }

  const currentPlanLimits = isActive
    ? {
        messages: planConfig.maxMessages,
        contacts: planConfig.maxContacts,
        users: planConfig.maxAgents
      }
    : {
        messages: 0,
        contacts: 0,
        users: 0
      };

  const lockedFeatures = {
    metaApi: false,
    qrCoexistence: false,
    sharedInbox: false,
    broadcasts: false,
    automations: false,
    flows: false,
    aiReply: false,
    pipelines: false,
    templates: false,
    webhooks: false,
    exportContacts: false,
    prioritySupport: false
  };

  return NextResponse.json({
    status: effectiveStatus,
    plan: isActive ? (hasPaidPlan ? account.subscription_plan : 'trial') : 'none',
    planConfig: isActive ? planConfig : null,
    trialEndsAt: account.trial_ends_at,
    subscriptionExpiresAt: account.subscription_expires_at,
    daysRemaining,
    isActive,
    isOwner,
    isSuperAdmin,
    isTrial,
    trialUsage,
    currentPlanLimits,
    planFeatures: isActive ? planConfig.features : lockedFeatures,
    blockedFeatures
  });
}

