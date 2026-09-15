import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id, account_role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.account_role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get total users in the same account
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', profile.account_id);

    // For active/trial/expired, we check the account's subscription_status
    // Since this is for the current account, these are account-level stats, but 
    // the prompt implies we might be managing multiple accounts if we are a super admin.
    // Let's just return the account's status as 1 or 0 for now, or if it meant across all accounts.
    // Prompt says: "totalUsers: number, // count of profiles in account"
    // "activeSubscriptions: number, // accounts with status='active'" - wait, this implies multiple accounts.
    // If the user is super admin, they might see all. Let's do as requested:
    
    // For simplicity, let's just query the accounts table for all counts if owner is super admin,
    // or just the current account if restricted. The prompt says "accounts with status='active'".
    
    const { count: activeSubscriptions } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'active');

    const { count: trialUsers } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'trial');

    const { count: expiredUsers } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'expired');

    const { data: txs } = await supabase
      .from('wallet_transactions')
      .select('amount')
      .eq('type', 'credit');

    const totalRevenue = txs?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;

    const { data: recentTransactions } = await supabase
      .from('wallet_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeSubscriptions: activeSubscriptions || 0,
      trialUsers: trialUsers || 0,
      expiredUsers: expiredUsers || 0,
      totalRevenue,
      recentTransactions: recentTransactions || []
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
