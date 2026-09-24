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
    
    // 1. Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 2. Get user's profile to verify platform admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id, role, email')
      .eq('user_id', user.id)
      .single();

    if (!checkIsAdmin(user.email || profile?.email, profile?.role)) {
      return NextResponse.json({ error: 'Forbidden: Platform Admin access required' }, { status: 403 });
    }

    // 3. Query all profiles using adminDb to see all platform users
    const adminDb = createAdminClient();
    const { data: users, error } = await adminDb
      .from('profiles')
      .select(`
        id,
        user_id,
        full_name,
        email,
        role,
        account_role,
        account_id,
        created_at,
        accounts!profiles_account_id_fkey (
          subscription_status,
          subscription_plan,
          trial_ends_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map to user-friendly format with clear User vs Admin role
    const formattedUsers = (users || []).map((u: any) => {
      const acc = Array.isArray(u.accounts) ? u.accounts[0] : u.accounts;
      const isAdmin = checkIsAdmin(u.email, u.role);
      return {
        id: u.id,
        user_id: u.user_id,
        full_name: u.full_name,
        email: u.email,
        role: isAdmin ? 'Admin' : 'User',
        status: acc?.subscription_status || 'trial',
        plan: acc?.subscription_plan || 'None',
        trial_ends_at: acc?.trial_ends_at
      };
    });

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id, role, email')
      .eq('user_id', user.id)
      .single();

    if (!checkIsAdmin(user.email || profile?.email, profile?.role)) {
      return NextResponse.json({ error: 'Forbidden: Platform Admin access required' }, { status: 403 });
    }

    const { user_id, action, plan_id } = await request.json();
    if (!user_id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const adminDb = createAdminClient();
    const { data: targetProfile } = await adminDb
      .from('profiles')
      .select('account_id')
      .eq('user_id', user_id)
      .single();
      
    if (!targetProfile?.account_id) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    const account_id = targetProfile.account_id;

    if (action === 'block') {
      await adminDb.from('accounts').update({ subscription_status: 'blocked' }).eq('id', account_id);
    } else if (action === 'unblock') {
      await adminDb.from('accounts').update({ subscription_status: 'active' }).eq('id', account_id);
    } else if (action === 'extend_trial') {
      const { data: acc } = await adminDb.from('accounts').select('trial_ends_at').eq('id', account_id).single();
      const currentExpiry = acc?.trial_ends_at ? new Date(acc.trial_ends_at) : new Date();
      const baseDate = currentExpiry.getTime() > Date.now() ? currentExpiry : new Date();
      baseDate.setDate(baseDate.getDate() + 7);
      await adminDb.from('accounts').update({ 
        trial_ends_at: baseDate.toISOString(),
        subscription_status: 'trial'
      }).eq('id', account_id);
    } else if (action === 'change_plan') {
      if (plan_id) {
        await adminDb.from('accounts').update({ 
          subscription_plan: plan_id,
          subscription_status: 'active'
        }).eq('id', account_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating admin user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
