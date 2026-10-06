import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAccountContext } from '@/lib/firebase/auth-helper';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const admin = createAdminClient();
    let accountId: string | undefined;

    try {
      const fbContext = await getAccountContext(request as any);
      if (fbContext?.accountId) {
        accountId = fbContext.accountId;
      }
    } catch {}

    if (!accountId) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await admin
            .from('profiles')
            .select('account_id')
            .eq('user_id', user.id)
            .maybeSingle();
          if (profile?.account_id) accountId = profile.account_id;
        }
      } catch {}
    }

    let query = admin.from('profiles').select('*').order('full_name');
    if (accountId) {
      query = query.eq('account_id', accountId);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ profiles: [] });
    }

    return NextResponse.json({ profiles: data || [] });
  } catch {
    return NextResponse.json({ profiles: [] });
  }
}
