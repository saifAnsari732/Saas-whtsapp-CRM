import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const payload = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(payload)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(payload);
    const eventId = req.headers.get('x-razorpay-event-id') || event.id || `evt_${Date.now()}`;
    const supabase = createAdminClient();

    // Idempotency check
    const { data: existingEvent } = await supabase
      .from('billing_webhook_events')
      .select('id')
      .eq('id', eventId)
      .single();

    if (existingEvent) {
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    // Record event
    await supabase
      .from('billing_webhook_events')
      .insert({
        id: eventId,
        event_type: event.event,
        payload: event
      });

    const payment = event.payload.payment?.entity;
    const order_id = payment?.order_id;
    
    switch (event.event) {
      case 'payment.captured':
        if (order_id) {
          const { data: order } = await supabase
            .from('billing_orders')
            .select('*')
            .eq('razorpay_order_id', order_id)
            .single();
            
          if (order && order.status !== 'paid') {
            await supabase
              .from('billing_orders')
              .update({ status: 'paid', updated_at: new Date().toISOString() })
              .eq('id', order.id);
              
            if (order.type === 'subscription') {
              const expires_at = new Date();
              expires_at.setDate(expires_at.getDate() + 30);
              
              await supabase
                .from('accounts')
                .update({
                  subscription_plan: order.plan_id,
                  subscription_status: 'active',
                  subscription_expires_at: expires_at.toISOString(),
                  subscription_started_at: new Date().toISOString()
                })
                .eq('id', order.account_id);
            } else if (order.type === 'wallet_topup') {
              const { data: wallet } = await supabase
                .from('wallets')
                .select('balance')
                .eq('account_id', order.account_id)
                .single();
                
              const new_balance = (wallet?.balance || 0) + order.amount;
              
              if (wallet) {
                await supabase.from('wallets').update({ balance: new_balance }).eq('account_id', order.account_id);
              } else {
                await supabase.from('wallets').insert({ account_id: order.account_id, balance: new_balance });
              }
              
              await supabase.from('wallet_transactions').insert({
                account_id: order.account_id,
                amount: order.amount,
                type: 'credit',
                description: 'Wallet Topup via Razorpay Webhook',
                reference_id: payment.id
              });
            }
          }
        }
        break;
        
      case 'payment.failed':
        if (order_id) {
          await supabase
            .from('billing_orders')
            .update({ status: 'failed', updated_at: new Date().toISOString() })
            .eq('razorpay_order_id', order_id);
        }
        break;
        
      case 'subscription.charged':
        // Optional webhook handling for Razorpay actual subscription module
        break;
        
      case 'subscription.cancelled':
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
