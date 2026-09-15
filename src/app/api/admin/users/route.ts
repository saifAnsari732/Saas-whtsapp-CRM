import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // 1. Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 2. Get user's profile to check if owner
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id, account_role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.account_role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden: Owner access required' }, { status: 403 });
    }

    // 3. Query all profiles in the same account with account info
    const { data: users, error } = await supabase
      .from('profiles')
      .select(`
        id,
        user_id,
        full_name,
        email,
        account_role,
        accounts!profiles_account_id_fkey (
          subscription_status,
          subscription_plan,
          trial_ends_at
        )
      `)
      .eq('account_id', profile.account_id);

    if (error) throw error;

    // Map to a cleaner format
    const formattedUsers = (users || []).map((u: any) => {
      const acc = Array.isArray(u.accounts) ? u.accounts[0] : u.accounts;
      return {
        id: u.id,
        user_id: u.user_id,
        full_name: u.full_name,
        email: u.email,
        role: u.account_role,
        status: acc?.subscription_status,
        plan: acc?.subscription_plan,
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
      .select('account_id, account_role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.account_role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { user_id, action, plan_id } = await request.json();
    if (!user_id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Since users share the same account_id in this CRM model, 
    // blocking or modifying a "user" means modifying their specific account if they own it.
    // Wait, the prompt says: "block: set account subscription_status to 'blocked'".
    // Let's get the target user's account_id.
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user_id)
      .single();
      
    if (!targetUser || targetUser.account_id !== profile.account_id) {
        return NextResponse.json({ error: 'User not found in this account' }, { status: 404 });
    }

    const account_id = targetUser.account_id;

    if (action === 'block') {
      await supabase.from('accounts').update({ subscription_status: 'blocked' }).eq('id', account_id);
    } else if (action === 'unblock') {
      await supabase.from('accounts').update({ subscription_status: 'active' }).eq('id', account_id);
    } else if (action === 'extend_trial') {
      // Add 7 days
      const { data: acc } = await supabase.from('accounts').select('trial_ends_at').eq('id', account_id).single();
      if (acc) {
        const newDate = new Date(acc.trial_ends_at || Date.now());
        newDate.setDate(newDate.getDate() + 7);
        await supabase.from('accounts').update({ trial_ends_at: newDate.toISOString() }).eq('id', account_id);
      }
    } else if (action === 'change_plan') {
      if (plan_id) {
        await supabase.from('accounts').update({ 
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
