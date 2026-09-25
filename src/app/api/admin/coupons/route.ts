import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminDb } from '@/lib/firebase/admin';

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
      .select('role, email')
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle();

    if (!checkIsAdmin(user.email || profile?.email, profile?.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const fDb = getAdminDb();
    const snap = await fDb.collection('coupons').orderBy('created_at', 'desc').get();
    
    const coupons: any[] = [];
    snap.forEach((doc) => {
      coupons.push({ id: doc.id, ...doc.data() });
    });

    return NextResponse.json({ coupons });
  } catch (error: any) {
    console.error('[Admin Coupons GET] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email')
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle();

    if (!checkIsAdmin(user.email || profile?.email, profile?.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { code, discount_type, discount_value, max_uses, expires_at } = body;

    if (!code || !discount_type || discount_value === undefined) {
      return NextResponse.json({ error: 'Code, discount_type, and discount_value are required' }, { status: 400 });
    }

    const cleanCode = String(code).trim().toUpperCase();
    if (cleanCode.length < 2) {
      return NextResponse.json({ error: 'Coupon code must be at least 2 characters long' }, { status: 400 });
    }

    const fDb = getAdminDb();
    
    // Check if code already exists
    const existingSnap = await fDb.collection('coupons').where('code', '==', cleanCode).limit(1).get();
    if (!existingSnap.empty) {
      return NextResponse.json({ error: `Coupon code '${cleanCode}' already exists` }, { status: 400 });
    }

    const newCoupon = {
      code: cleanCode,
      discount_type: discount_type === 'percentage' ? 'percentage' : 'fixed',
      discount_value: Number(discount_value),
      max_uses: max_uses ? Number(max_uses) : null,
      used_count: 0,
      is_active: true,
      expires_at: expires_at || null,
      created_at: new Date().toISOString(),
      created_by: user.email || user.id
    };

    const docRef = await fDb.collection('coupons').add(newCoupon);

    return NextResponse.json({
      success: true,
      coupon: { id: docRef.id, ...newCoupon }
    });
  } catch (error: any) {
    console.error('[Admin Coupons POST] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email')
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle();

    if (!checkIsAdmin(user.email || profile?.email, profile?.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { coupon_id, is_active } = body;

    if (!coupon_id) {
      return NextResponse.json({ error: 'coupon_id is required' }, { status: 400 });
    }

    const fDb = getAdminDb();
    await fDb.collection('coupons').doc(coupon_id).update({
      is_active: Boolean(is_active),
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Admin Coupons PATCH] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email')
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle();

    if (!checkIsAdmin(user.email || profile?.email, profile?.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const coupon_id = searchParams.get('id');

    if (!coupon_id) {
      return NextResponse.json({ error: 'Coupon ID parameter is required' }, { status: 400 });
    }

    const fDb = getAdminDb();
    await fDb.collection('coupons').doc(coupon_id).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Admin Coupons DELETE] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
