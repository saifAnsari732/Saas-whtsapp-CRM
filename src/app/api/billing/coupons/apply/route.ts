import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminDb } from '@/lib/firebase/admin';

const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
  essential: { monthly: 999, yearly: 11388 },  // ₹949/mo * 12 (5% off)
  growth: { monthly: 1999, yearly: 22788 },     // ₹1,899/mo * 12 (5% off)
  allinone: { monthly: 3999, yearly: 45588 },    // ₹3,799/mo * 12 (5% off)
  'all-in-one': { monthly: 3999, yearly: 45588 },
};

// Built-in promo coupons fallback map
const FALLBACK_COUPONS: Record<string, { code: string; discount_type: 'percentage' | 'fixed'; discount_value: number; is_active: boolean }> = {
  'SAIF': { code: 'SAIF', discount_type: 'percentage', discount_value: 20, is_active: true },
  'WELCOME10': { code: 'WELCOME10', discount_type: 'percentage', discount_value: 10, is_active: true },
  'CHATFLYR50': { code: 'CHATFLYR50', discount_type: 'percentage', discount_value: 50, is_active: true },
  'SPECIAL20': { code: 'SPECIAL20', discount_type: 'percentage', discount_value: 20, is_active: true },
  'FLAT500': { code: 'FLAT500', discount_type: 'fixed', discount_value: 500, is_active: true },
  'OFFER50': { code: 'OFFER50', discount_type: 'percentage', discount_value: 50, is_active: true },
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, plan_id = 'essential', billing_cycle = 'monthly' } = body;

    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Please enter a coupon code' }, { status: 400 });
    }

    const cleanCode = String(code).trim().toUpperCase();
    const normalizedPlan = plan_id.toLowerCase().replace(/[-_]/g, '');
    const prices = PLAN_PRICES[normalizedPlan] || PLAN_PRICES.essential;
    const basePrice = billing_cycle === 'yearly' ? prices.yearly : prices.monthly;

    let coupon: any = null;
    let couponId = 'promo-' + cleanCode.toLowerCase();

    // 1. Try querying Firestore
    try {
      const fDb = getAdminDb();
      const snap = await fDb.collection('coupons').where('code', '==', cleanCode).limit(1).get();
      if (!snap.empty) {
        const doc = snap.docs[0];
        couponId = doc.id;
        coupon = doc.data();
      }
    } catch (fErr) {
      console.warn('[Apply Coupon] Firestore query failed, falling back to built-in promo list:', fErr);
    }

    // 2. Fallback to built-in coupons if not found in Firestore
    if (!coupon && FALLBACK_COUPONS[cleanCode]) {
      coupon = FALLBACK_COUPONS[cleanCode];
    }

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 400 });
    }

    if (!coupon.is_active) {
      return NextResponse.json({ error: 'This coupon code is no longer active' }, { status: 400 });
    }

    if (coupon.expires_at) {
      const expiry = new Date(coupon.expires_at).getTime();
      if (!isNaN(expiry) && expiry < Date.now()) {
        return NextResponse.json({ error: 'This coupon code has expired' }, { status: 400 });
      }
    }

    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({ error: 'This coupon code has reached its usage limit' }, { status: 400 });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = Math.round(basePrice * (Number(coupon.discount_value) / 100));
    } else {
      discountAmount = Number(coupon.discount_value);
    }

    // Ensure discount does not exceed base price
    discountAmount = Math.min(basePrice, Math.max(0, discountAmount));
    const finalPrice = Math.max(0, basePrice - discountAmount);
    const gstAmount = Math.round(finalPrice * 0.18);
    const totalAmount = finalPrice + gstAmount;

    return NextResponse.json({
      success: true,
      valid: true,
      coupon: {
        id: couponId,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
      },
      summary: {
        original_price: basePrice,
        discount_amount: discountAmount,
        final_price: finalPrice,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        billing_cycle,
        plan_id
      }
    });
  } catch (error: any) {
    console.error('[Apply Coupon Error]:', error);
    return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 400 });
  }
}
