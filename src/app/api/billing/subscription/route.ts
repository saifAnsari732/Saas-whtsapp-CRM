import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlanConfig } from '@/lib/billing/plan-features';

export async function GET() {
  const supabase = await createClient();

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

  const isPlatformAdmin = profile?.role === 'admin' || profile?.role === 'superadmin' || (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));

  // Platform Admins have full, unrestricted power across all features without plan or trial limits
  if (isPlatformAdmin) {
    return NextResponse.json({
      status: 'active',
      plan: 'enterprise',
      trialEndsAt: null,
      subscriptionExpiresAt: null,
      daysRemaining: 99999,
      isActive: true,
      isOwner: true,
      isSuperAdmin: true,
      trialUsage: { messagesSent: 0, contactsCreated: 0, broadcastsSent: 0, templatesUsed: 0 },
      currentPlanLimits: { messages: -1, contacts: -1, users: -1 },
      blockedFeatures: []
    });
  }

  const isOwner = profile.account_role === 'owner';

  // Get account subscription info
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('id, created_at, subscription_status, subscription_plan, trial_ends_at, subscription_expires_at')
    .eq('id', profile.account_id)
    .single();

  // If the columns don't exist yet (migration not applied to remote db),
  // fallback to a default active trial state to prevent crashing the app.
  if (accountError && accountError.code === '42703') {
    return NextResponse.json({
      status: 'trial',
      plan: null,
      trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      subscriptionExpiresAt: null,
      daysRemaining: 5,
      isActive: true,
      isOwner,
      trialUsage: { messagesSent: 0, contactsCreated: 0, broadcastsSent: 0, templatesUsed: 0 },
      currentPlanLimits: null,
      blockedFeatures: []
    });
  }

  if (accountError || !account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  // Fetch live usage metrics for trial report
  const [
    { count: contactsCount },
    { count: messagesCount },
    { count: broadcastsCount },
    { count: templatesCount }
  ] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('account_id', profile.account_id),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('account_id', profile.account_id),
    supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('account_id', profile.account_id),
    supabase.from('templates').select('*', { count: 'exact', head: true }).eq('account_id', profile.account_id),
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
  let trialEndsAtDate: Date | null = null;
  
  // Logic to determine active status and days remaining
  if (account.subscription_status === 'active') {
    if (account.subscription_expires_at) {
      const expiresAt = new Date(account.subscription_expires_at);
      if (expiresAt > now) {
        isActive = true;
        daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }
    } else {
      // Active subscription with no expiration
      isActive = true;
      daysRemaining = 365;
    }
  } else {
    // Determine trial end date
    if (account.trial_ends_at) {
      trialEndsAtDate = new Date(account.trial_ends_at);
    } else {
      // Missing trial_ends_at: default to created_at + 5 days or now + 5 days
      const createdAt = account.created_at ? new Date(account.created_at) : now;
      trialEndsAtDate = new Date(createdAt.getTime() + 5 * 24 * 60 * 60 * 1000);
      
      await supabase
        .from('accounts')
        .update({ 
          trial_ends_at: trialEndsAtDate.toISOString(),
          subscription_status: trialEndsAtDate > now ? 'trial' : 'expired'
        })
        .eq('id', account.id);
        
      account.trial_ends_at = trialEndsAtDate.toISOString();
      account.subscription_status = trialEndsAtDate > now ? 'trial' : 'expired';
    }

    // Safety check: If account was created within the last 5 days, grant full 5 days from created_at
    if (account.created_at) {
      const createdAt = new Date(account.created_at);
      const fiveDaysAfterCreation = new Date(createdAt.getTime() + 5 * 24 * 60 * 60 * 1000);
      if (fiveDaysAfterCreation > now && trialEndsAtDate <= now) {
        trialEndsAtDate = fiveDaysAfterCreation;
        await supabase
          .from('accounts')
          .update({ 
            trial_ends_at: trialEndsAtDate.toISOString(),
            subscription_status: 'trial'
          })
          .eq('id', account.id);
        account.trial_ends_at = trialEndsAtDate.toISOString();
        account.subscription_status = 'trial';
      }
    }

    if (trialEndsAtDate && trialEndsAtDate > now) {
      isActive = true;
      account.subscription_status = 'trial';
      daysRemaining = Math.max(0, Math.ceil((trialEndsAtDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    } else {
      isActive = false;
      account.subscription_status = 'expired';
      daysRemaining = 0;
    }
  }

  if (!isActive) {
    // If trial/subscription expired, block actions
  }

  const isTrial = account.subscription_status === 'trial';
  const planConfig = getPlanConfig(account.subscription_plan, isTrial);

  // If trial or active, what is blocked?
  // Trial: ALL FEATURES ARE ENABLED!
  // Active Plan: Only features not included in that specific plan are blocked
  // Expired: All operational routes are blocked
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
      '/agents'
    ];
  } else if (!isTrial && account.subscription_plan) {
    // Check specific plan feature exclusions
    if (!planConfig.features.qrCoexistence) blockedFeatures.push('/dashboard/coexistence');
    if (!planConfig.features.broadcasts) blockedFeatures.push('/broadcasts', '/broadcasts/new');
    if (!planConfig.features.automations) blockedFeatures.push('/automations');
    if (!planConfig.features.flows) blockedFeatures.push('/flows', '/keyword-flows');
    if (!planConfig.features.pipelines) blockedFeatures.push('/pipelines');
  }

  const currentPlanLimits = {
    messages: planConfig.maxMessages,
    contacts: planConfig.maxContacts,
    users: planConfig.maxAgents
  };

  return NextResponse.json({
    status: account.subscription_status,
    plan: account.subscription_plan || (isTrial ? 'trial' : 'none'),
    planConfig,
    trialEndsAt: account.trial_ends_at,
    subscriptionExpiresAt: account.subscription_expires_at,
    daysRemaining,
    isActive,
    isOwner,
    isTrial,
    trialUsage,
    currentPlanLimits,
    planFeatures: planConfig.features,
    blockedFeatures
  });
}
