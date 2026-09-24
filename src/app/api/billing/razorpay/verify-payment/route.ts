import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Get order
    const { data: order, error: orderError } = await supabase
      .from('billing_orders')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    if (order.status === 'paid') {
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    // Update order status
    await supabase
      .from('billing_orders')
      .update({ status: 'paid', updated_at: new Date().toISOString() })
      .eq('id', order.id);

    if (order.type === 'subscription') {
      // Update accounts table
      const billingCycle = order.metadata?.billing_cycle || 'monthly';
      const daysToAdd = billingCycle === 'yearly' ? 365 : 30;
      const expires_at = new Date();
      expires_at.setDate(expires_at.getDate() + daysToAdd);
      
      const normalizedPlanId = (order.plan_id === 'all-in-one') ? 'allinone' : order.plan_id;
      
      const { error: updateError } = await supabase
        .from('accounts')
        .update({
          subscription_plan: normalizedPlanId,
          subscription_status: 'active',
          subscription_expires_at: expires_at.toISOString(),
          subscription_started_at: new Date().toISOString()
        })
        .eq('id', profile.account_id);
        
      if (updateError) throw updateError;
      
    } else if (order.type === 'wallet_topup') {
      // Convert order.amount (in paise) to rupees for wallet balance
      const creditRupees = order.amount >= 100 ? Math.round(order.amount / 100) : order.amount;
      
      // Update wallet balance
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('account_id', profile.account_id)
        .single();
        
      const new_balance = (wallet?.balance || 0) + creditRupees;
      
      if (wallet) {
        await supabase.from('wallets').update({ balance: new_balance }).eq('account_id', profile.account_id);
      } else {
        await supabase.from('wallets').insert({ account_id: profile.account_id, balance: new_balance });
      }
      
      await supabase.from('wallet_transactions').insert({
        account_id: profile.account_id,
        amount: creditRupees,
        type: 'credit',
        description: 'Wallet Topup via Razorpay',
        reference_id: razorpay_payment_id
      });
    }

    return NextResponse.json({ success: true, type: order.type });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
