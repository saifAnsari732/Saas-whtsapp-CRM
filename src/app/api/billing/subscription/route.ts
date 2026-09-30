import { NextResponse } from 'next/server';
import { getCurrentAccount, toErrorResponse } from '@/lib/auth/account';
import { getAdminDb } from '@/lib/firebase/admin';
import { getPlanConfig } from '@/lib/billing/plan-features';

const PAID_PLANS = ['starter', 'essential', 'growth', 'allinone', 'all-in-one', 'enterprise'];

export async function GET() {
  try {
    const ctx = await getCurrentAccount();
    const db = getAdminDb();

    const ADMIN_EMAILS = [
      'ansarisaifuddin732@gmail.com',
      'kisandeveloper2@gmail.com',
      ...(process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : []),
      ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [])
    ];

    const userDoc = await db.collection("users").doc(ctx.userId).get();
    const userData = userDoc.data();

    const isSuperAdmin = Boolean(
      userData?.role === 'admin' ||
      userData?.role === 'superadmin' ||
      (userData?.email && ADMIN_EMAILS.includes(userData.email.toLowerCase()))
    );

    const isOwner = ctx.role === 'owner';

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

    // Get account subscription info from Firestore
    const accountDoc = await db.collection("accounts").doc(ctx.accountId).get();
    if (!accountDoc.exists) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const account = accountDoc.data() || {};
    account.id = accountDoc.id;

    // Fetch live usage metrics for trial / account report
    const [
      contactsSnap,
      messagesSnap,
      broadcastsSnap,
      templatesSnap
    ] = await Promise.all([
      db.collection('contacts').where('accountId', '==', ctx.accountId).count().get(),
      db.collection('messages').where('accountId', '==', ctx.accountId).count().get(),
      db.collection('broadcasts').where('accountId', '==', ctx.accountId).count().get(),
      db.collection('message_templates').where('accountId', '==', ctx.accountId).count().get(),
    ]);

    const trialUsage = {
      messagesSent: messagesSnap.data().count || 0,
      contactsCreated: contactsSnap.data().count || 0,
      broadcastsSent: broadcastsSnap.data().count || 0,
      templatesUsed: templatesSnap.data().count || 0,
    };

    const now = new Date();
    let isActive = false;
    let daysRemaining = 0;
    let trialEndsAtDate: Date | null = account.trial_ends_at || account.trialEndsAt ? new Date(account.trial_ends_at || account.trialEndsAt) : null;
    const hasPaidPlan = Boolean(account.subscription_plan || account.subscriptionPlan) && PAID_PLANS.includes((account.subscription_plan || account.subscriptionPlan).toLowerCase());

    const subscriptionStatus = account.subscription_status || account.subscriptionStatus || 'trial';

    if (subscriptionStatus === 'blocked') {
      isActive = false;
      daysRemaining = 0;
    } else if (subscriptionStatus === 'active' && hasPaidPlan) {
      const expiresStr = account.subscription_expires_at || account.subscriptionExpiresAt;
      if (expiresStr) {
        const expiresAt = new Date(expiresStr);
        if (expiresAt > now) {
          isActive = true;
          daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        } else {
          isActive = false;
          daysRemaining = 0;
          await db.collection('accounts').doc(account.id).update({ subscriptionStatus: 'expired', subscription_status: 'expired' });
        }
      } else {
        isActive = true;
        daysRemaining = 30;
      }
    } else {
      // Evaluate 5-day free trial
      if (!trialEndsAtDate) {
        const createdAt = account.createdAt || account.created_at ? new Date(account.createdAt || account.created_at) : now;
        trialEndsAtDate = new Date(createdAt.getTime() + 5 * 24 * 60 * 60 * 1000);
        const newStatus = trialEndsAtDate > now ? 'trial' : 'expired';
        await db.collection('accounts').doc(account.id).update({
          trialEndsAt: trialEndsAtDate.toISOString(),
          trial_ends_at: trialEndsAtDate.toISOString(),
          subscriptionStatus: newStatus,
          subscription_status: newStatus
        });
      }

      if (subscriptionStatus === 'expired') {
        isActive = false;
        daysRemaining = 0;
      } else if (trialEndsAtDate && trialEndsAtDate > now) {
        isActive = true;
        daysRemaining = Math.max(0, Math.ceil((trialEndsAtDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      } else {
        isActive = false;
        daysRemaining = 0;
        if (subscriptionStatus !== 'expired') {
          await db.collection('accounts').doc(account.id).update({ subscriptionStatus: 'expired', subscription_status: 'expired' });
        }
      }
    }

    const effectiveStatus = isActive
      ? (subscriptionStatus === 'active' && hasPaidPlan ? 'active' : 'trial')
      : 'expired';

    const isTrial = effectiveStatus === 'trial';
    const planConfig = getPlanConfig(hasPaidPlan ? (account.subscription_plan || account.subscriptionPlan) : null, isTrial);

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
      plan: isActive ? (hasPaidPlan ? (account.subscription_plan || account.subscriptionPlan) : 'trial') : 'none',
      planConfig: isActive ? planConfig : null,
      trialEndsAt: trialEndsAtDate?.toISOString() || null,
      subscriptionExpiresAt: account.subscription_expires_at || account.subscriptionExpiresAt || null,
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
  } catch (err) {
    return toErrorResponse(err);
  }
}
