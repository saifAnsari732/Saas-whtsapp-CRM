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
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle();

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const body = await req.json();
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      plan_id = 'essential',
      type = 'subscription',
      billing_cycle = 'monthly',
      amount = 999
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Payment credentials missing. Payment not completed.' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Razorpay secret key not configured in environment' }, { status: 500 });
    }

    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('[Verify Payment Security] Invalid payment signature attempt', {
        razorpay_order_id,
        razorpay_payment_id
      });
      return NextResponse.json(
        { error: 'Payment signature verification failed. Plan not activated.' },
        { status: 400 }
      );
    }

    // Lookup order from DB
    let order: any = null;
    if (razorpay_order_id) {
      const { data: dbOrder } = await supabase
        .from('billing_orders')
        .select('*')
        .eq('razorpay_order_id', razorpay_order_id)
        .maybeSingle();
      order = dbOrder;
    }

    const targetType = order?.type || type || 'subscription';
    const targetPlanId = order?.plan_id || plan_id || 'essential';
    const targetBillingCycle = order?.metadata?.billing_cycle || billing_cycle || 'monthly';

    // 1. Update order record in DB if found
    if (order?.id) {
      await supabase
        .from('billing_orders')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', order.id);
    } else {
      // Create record if missing
      try {
        await supabase.from('billing_orders').insert({
          account_id: profile.account_id,
          razorpay_order_id: razorpay_order_id || `order_demo_${Date.now()}`,
          amount: Math.round(Number(amount) * 100),
          currency: 'INR',
          plan_id: targetPlanId,
          type: targetType,
          status: 'paid',
          metadata: { billing_cycle: targetBillingCycle },
        });
      } catch (insertErr) {
        console.warn('[Verify Payment] Order insert warning:', insertErr);
      }
    }

    // 2. Perform Account / Wallet Updates
    if (targetType === 'subscription') {
      const daysToAdd = targetBillingCycle === 'yearly' ? 365 : 30;
      const expires_at = new Date();
      expires_at.setDate(expires_at.getDate() + daysToAdd);

      const normalizedPlanId = (targetPlanId === 'all-in-one') ? 'allinone' : targetPlanId;

      const { error: updateError } = await supabase
        .from('accounts')
        .update({
          subscription_plan: normalizedPlanId,
          subscription_status: 'active',
          subscription_expires_at: expires_at.toISOString(),
          subscription_started_at: new Date().toISOString()
        })
        .eq('id', profile.account_id);

      if (updateError) {
        console.error('[Verify Payment] Account update error:', updateError);
        throw updateError;
      }
    } else if (targetType === 'wallet_topup') {
      const creditRupees = Math.round(Number(amount));

      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('account_id', profile.account_id)
        .maybeSingle();

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
        reference_id: razorpay_payment_id || `pay_demo_${Date.now()}`
      });
    }

    return NextResponse.json({ 
      success: true, 
      type: targetType,
      plan_id: targetPlanId,
      message: 'Payment and subscription verified successfully' 
    });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
