import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current account ID from the user's active account context
    // Fetching the user's account membership
    const { data: membership, error: membershipError } = await supabase
      .from('account_members')
      .select('account_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'No active account found' }, { status: 404 });
    }

    const accountId = membership.account_id;

    // Fetch the wallet
    let { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('account_id', accountId)
      .single();

    // If wallet doesn't exist, create it on the fly (lazy initialization)
    if (walletError && walletError.code === 'PGRST116') {
      const { data: newWallet, error: insertError } = await supabase
        .from('wallets')
        .insert({ account_id: accountId, balance: 0.00, low_balance_alert: 100.00 })
        .select()
        .single();
        
      if (insertError) {
        console.error('Error creating wallet:', insertError);
        return NextResponse.json({ error: 'Failed to initialize wallet' }, { status: 500 });
      }
      wallet = newWallet;
    } else if (walletError) {
      console.error('Error fetching wallet:', walletError);
      return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
    }

    // Fetch transactions
    const { data: transactions, error: txError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (txError) {
      console.error('Error fetching transactions:', txError);
      // Don't fail the whole request if only TX fetch fails
    }

    return NextResponse.json({ 
      success: true, 
      wallet,
      transactions: transactions || []
    });
  } catch (error: any) {
    console.error('Wallet GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { low_balance_alert } = body;

    if (low_balance_alert === undefined || isNaN(Number(low_balance_alert))) {
      return NextResponse.json({ error: 'Invalid alert value' }, { status: 400 });
    }

    // Get the account ID for the user
    const { data: member } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'No active account found' }, { status: 404 });
    }

    const { data: updatedWallet, error } = await supabase
      .from('wallets')
      .update({ low_balance_alert: Number(low_balance_alert) })
      .eq('account_id', membership.account_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, wallet: updatedWallet });
  } catch (error: any) {
    console.error('Wallet PATCH Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
