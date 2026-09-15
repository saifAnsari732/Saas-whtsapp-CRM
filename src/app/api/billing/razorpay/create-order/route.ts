import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const { plan_id, type = 'subscription', billing_cycle = 'monthly' } = body;

    // Validate plan
    const { data: plan } = await supabase
      .from('billing_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Calculate amount
    const price = billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
    const gst_amount = Math.round(price * 0.18);
    const total_amount = price + gst_amount;

    // Create Razorpay order
    const auth = Buffer.from(
      `${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
    ).toString('base64');

    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: total_amount,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}_${profile.account_id.substring(0,8)}`,
      }),
    });

    if (!rzpResponse.ok) {
      const error = await rzpResponse.json();
      throw new Error(error.error?.description || 'Failed to create Razorpay order');
    }

    const order = await rzpResponse.json();

    // Save order
    const { error: insertError } = await supabase
      .from('billing_orders')
      .insert({
        account_id: profile.account_id,
        razorpay_order_id: order.id,
        amount: total_amount,
        currency: 'INR',
        plan_id,
        type,
        metadata: { billing_cycle, gst_amount, price },
      });

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      order_id: order.id,
      amount: total_amount,
      currency: 'INR',
      gst_amount,
      plan: {
        id: plan.id,
        name: plan.name,
        price,
        billing_cycle
      }
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
