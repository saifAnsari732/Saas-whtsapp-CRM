import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const ADMIN_EMAILS = [
  'ansarisaifuddin732@gmail.com',
  'kisandeveloper2@gmail.com',
  ...(process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : []),
  ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [])
];

function checkIsAdmin(userEmail: string | undefined | null, profileRole: string | undefined | null): boolean {
  if (profileRole === 'admin' || profileRole === 'superadmin') return true;
  if (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase())) return true;
  return false;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id, role, email')
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle();

    if (!checkIsAdmin(user.email || profile?.email, profile?.role)) {
      return NextResponse.json({ error: 'Forbidden: Platform Admin access required' }, { status: 403 });
    }

    const adminDb = createAdminClient();

    // Fire ALL count, revenue and transaction queries in parallel Promise.all batch for ultra-fast performance
    const [
      { count: totalUsers },
      { count: activeSubscriptions },
      { count: trialUsers },
      { count: expiredUsers },
      { data: txs },
      { data: rawTxs }
    ] = await Promise.all([
      adminDb.from('profiles').select('*', { count: 'exact', head: true }),
      adminDb.from('accounts').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
      adminDb.from('accounts').select('*', { count: 'exact', head: true }).eq('subscription_status', 'trial'),
      adminDb.from('accounts').select('*', { count: 'exact', head: true }).eq('subscription_status', 'expired'),
      adminDb.from('wallet_transactions').select('amount').eq('type', 'credit'),
      adminDb.from('wallet_transactions').select('*').order('created_at', { ascending: false }).limit(30)
    ]);

    // Async background update for expired trial status (non-blocking)
    adminDb
      .from('accounts')
      .update({ subscription_status: 'expired' })
      .eq('subscription_status', 'trial')
      .lt('trial_ends_at', new Date().toISOString())
      .then(() => {})
      .catch(() => {});

    const totalRevenue = (txs || []).reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const accountIds = Array.from(new Set((rawTxs || []).map(t => t.account_id).filter(Boolean)));
    
    // Batch fetch account names & profiles in parallel
    const [{ data: accounts }, { data: profiles }] = await Promise.all([
      accountIds.length > 0 
        ? adminDb.from('accounts').select('id, name, subscription_plan, subscription_status').in('id', accountIds)
        : Promise.resolve({ data: [] }),
      accountIds.length > 0 
        ? adminDb.from('profiles').select('user_id, full_name, email, account_id').in('account_id', accountIds)
        : Promise.resolve({ data: [] })
    ]);

    const accountsMap = new Map((accounts || []).map(a => [a.id, a]));
    const profilesMap = new Map((profiles || []).map(p => [p.account_id, p]));

    const recentTransactions = (rawTxs || []).map(t => {
      const acc = accountsMap.get(t.account_id);
      const prof = profilesMap.get(t.account_id);
      return {
        id: t.id,
        amount: t.amount,
        type: t.type,
        description: t.description,
        reference_id: t.reference_id,
        created_at: t.created_at,
        account_name: acc?.name || 'Account',
        user_name: prof?.full_name || 'Customer',
        user_email: prof?.email || 'N/A',
        plan: acc?.subscription_plan || 'N/A'
      };
    });

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeSubscriptions: activeSubscriptions || 0,
      trialUsers: trialUsers || 0,
      expiredUsers: expiredUsers || 0,
      totalRevenue,
      recentTransactions
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
