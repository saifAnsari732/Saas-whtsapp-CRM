import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

// Initialize the Supabase Service Role client to bypass RLS and use Admin API
function getAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase Service Role Keys');
  }
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Strict check for super admin privileges
async function verifySuperAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return false;
  }

  // Check hardcoded email or role in profiles
  // Using the user's specific email from the screenshot for failsafe security
  if (user.email === 'kisandeveloper2@gmail.com') {
    return true;
  }

  // Fallback check if they manually set their profile role to superadmin in the database
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (profile && profile.role === 'superadmin') {
    return true;
  }

  return false;
}

export async function GET() {
  try {
    const isSuperAdmin = await verifySuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const adminClient = getAdminClient();

    // 1. Fetch all users from Auth
    const { data: { users }, error: authError } = await adminClient.auth.admin.listUsers();
    if (authError) throw authError;

    // 2. Fetch all profiles from public.profiles
    const { data: profiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('user_id, full_name, email, role, avatar_url, created_at')
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    // 3. Merge data
    const mergedUsers = profiles.map(profile => {
      const authUser = users.find(u => u.id === profile.user_id);
      return {
        id: profile.user_id,
        fullName: profile.full_name,
        email: profile.email,
        role: profile.role,
        avatarUrl: profile.avatar_url,
        createdAt: profile.created_at,
        isBanned: authUser ? !!authUser.banned_until : false,
        lastSignInAt: authUser?.last_sign_in_at || null,
      };
    });

    return NextResponse.json({ success: true, users: mergedUsers });
  } catch (error: any) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const isSuperAdmin = await verifySuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, action } = body;

    if (!userId || !['ban', 'unban'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    const adminClient = getAdminClient();

    if (action === 'ban') {
      // Ban for 10 years
      const { data, error } = await adminClient.auth.admin.updateUserById(userId, { ban_duration: '87600h' });
      if (error) throw error;
    } else if (action === 'unban') {
      // Unban by setting ban_duration to "none"
      const { data, error } = await adminClient.auth.admin.updateUserById(userId, { ban_duration: 'none' });
      if (error) throw error;
    }

    return NextResponse.json({ success: true, message: `User successfully ${action === 'ban' ? 'blocked' : 'unblocked'}` });
  } catch (error: any) {
    console.error(`Error performing admin action:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
