import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user profile to find account_id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('account_id, account_role')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile?.account_id) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const isOwner = profile.account_role === 'owner';

  // Get account subscription info
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('subscription_status, subscription_plan, trial_ends_at, subscription_expires_at')
    .eq('id', profile.account_id)
    .single();

  // If the columns don't exist yet (migration not applied to remote db),
  // fallback to a default active trial state to prevent crashing the app.
  if (accountError && accountError.code === '42703') {
    return NextResponse.json({
      status: 'trial',
      plan: null,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      subscriptionExpiresAt: null,
      daysRemaining: 7,
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
  
  // Logic to determine active status and days remaining
  if (account.subscription_status === 'active') {
    if (account.subscription_expires_at) {
      const expiresAt = new Date(account.subscription_expires_at);
      if (expiresAt > now) {
        isActive = true;
        daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }
    } else {
      // Active subscription with no expiration (e.g. lifetime or active recurring handled by stripe webhook)
      isActive = true;
    }
  } else if (account.subscription_status === 'trial') {
    if (account.trial_ends_at) {
      const trialEndsAt = new Date(account.trial_ends_at);
      if (trialEndsAt > now) {
        isActive = true;
        daysRemaining = Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      } else {
        // Automatically consider expired if trial date passed
        account.subscription_status = 'expired';
      }
    }
  }

  if (isOwner) {
    isActive = true; // Owner is NEVER blocked
  }

  const blockedFeatures = isActive ? [] : ['/inbox', '/broadcasts', '/automations', '/contacts', '/pipelines', '/flows', '/agents', '/dashboard/coexistence', '/dashboard/chats'];

  let currentPlanLimits = null;
  if (account.subscription_plan === 'starter') currentPlanLimits = { messages: 1000, contacts: 500, users: 1 };
  if (account.subscription_plan === 'essential') currentPlanLimits = { messages: 5000, contacts: 2500, users: 3 };
  if (account.subscription_plan === 'growth') currentPlanLimits = { messages: 25000, contacts: 10000, users: 5 };
  if (account.subscription_plan === 'allinone') currentPlanLimits = { messages: -1, contacts: -1, users: -1 };

  return NextResponse.json({
    status: account.subscription_status,
    plan: account.subscription_plan,
    trialEndsAt: account.trial_ends_at,
    subscriptionExpiresAt: account.subscription_expires_at,
    daysRemaining,
    isActive,
    isOwner,
    trialUsage,
    currentPlanLimits,
    blockedFeatures
  });
}
