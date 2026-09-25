import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminDb, admin } from '@/lib/firebase/admin';

const PLAN_PRICES_PAISE: Record<string, { name: string; monthly: number; yearly: number }> = {
  essential: { name: 'Essential', monthly: 99900, yearly: 1138800 },  // ₹999/mo, ₹11,388/yr (5% OFF)
  growth: { name: 'Growth', monthly: 199900, yearly: 2278800 },       // ₹1,999/mo, ₹22,788/yr (5% OFF)
  allinone: { name: 'All-In-One', monthly: 399900, yearly: 4558800 },  // ₹3,999/mo, ₹45,588/yr (5% OFF)
  'all-in-one': { name: 'All-In-One', monthly: 399900, yearly: 4558800 },
};

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
    const { plan_id, type = 'subscription', billing_cycle = 'monthly', amount: customAmount, coupon_code } = body;

    let total_amount = 0;
    let gst_amount = 0;
    let price = 0;
    let original_price = 0;
    let discount_amount = 0;
    let applied_coupon: any = null;
    let planData: any = null;

    if (type === 'wallet_topup') {
      price = (customAmount || 100) * 100; // in paise
      original_price = price;
      gst_amount = Math.round(price * 0.18);
      total_amount = price + gst_amount;
      planData = { id: 'wallet_topup', name: 'Wallet Top-up', price };
    } else {
      const normalizedPlan = (plan_id || 'essential').toLowerCase().replace(/[-_]/g, '');
      const planInfo = PLAN_PRICES_PAISE[normalizedPlan] || PLAN_PRICES_PAISE.essential;
      
      price = billing_cycle === 'yearly' ? planInfo.yearly : planInfo.monthly;
      original_price = price;
      planData = { id: plan_id || 'essential', name: planInfo.name, price };

      // Apply coupon code if provided
      if (coupon_code && typeof coupon_code === 'string' && coupon_code.trim()) {
        try {
          const cleanCode = coupon_code.trim().toUpperCase();
          const fDb = getAdminDb();
          const snap = await fDb.collection('coupons').where('code', '==', cleanCode).limit(1).get();

          if (!snap.empty) {
            const cDoc = snap.docs[0];
            const coupon = cDoc.data();

            const isExpired = coupon.expires_at ? new Date(coupon.expires_at).getTime() < Date.now() : false;
            const isLimitReached = coupon.max_uses ? coupon.used_count >= coupon.max_uses : false;

            if (coupon.is_active && !isExpired && !isLimitReached) {
              if (coupon.discount_type === 'percentage') {
                discount_amount = Math.round(price * (Number(coupon.discount_value) / 100));
              } else {
                discount_amount = Number(coupon.discount_value) * 100; // to paise
              }

              discount_amount = Math.min(price, Math.max(0, discount_amount));
              price = Math.max(0, price - discount_amount);

              applied_coupon = {
                id: cDoc.id,
                code: coupon.code,
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value,
                discount_amount_paise: discount_amount,
              };

              // Increment coupon used_count in Firestore
              await fDb.collection('coupons').doc(cDoc.id).update({
                used_count: admin.firestore.FieldValue.increment(1)
              });
            }
          }
        } catch (cErr) {
          console.warn('[Razorpay Order] Coupon processing warning:', cErr);
        }
      }

      gst_amount = Math.round(price * 0.18);
      total_amount = price + gst_amount;
    }

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
        receipt: `rcpt_${Date.now()}_${profile.account_id.substring(0, 8)}`,
      }),
    });

    if (!rzpResponse.ok) {
      const error = await rzpResponse.json();
      throw new Error(error.error?.description || 'Failed to create Razorpay order');
    }

    const order = await rzpResponse.json();

    // Save order details to database
    try {
      await supabase
        .from('billing_orders')
        .insert({
          account_id: profile.account_id,
          razorpay_order_id: order.id,
          amount: total_amount,
          currency: 'INR',
          plan_id: plan_id || 'essential',
          type,
          metadata: { 
            billing_cycle, 
            gst_amount, 
            original_price, 
            discount_amount, 
            final_price: price,
            coupon: applied_coupon 
          },
        });
    } catch (dbErr) {
      console.warn('[Razorpay Order] Saved to order with fallback:', dbErr);
    }

    return NextResponse.json({
      order_id: order.id,
      amount: total_amount,
      currency: 'INR',
      gst_amount,
      discount_amount,
      applied_coupon,
      plan: {
        id: planData.id,
        name: planData.name,
        price,
        original_price,
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
