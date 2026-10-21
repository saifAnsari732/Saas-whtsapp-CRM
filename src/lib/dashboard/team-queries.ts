import type { SupabaseClient } from '@supabase/supabase-js'

export interface TeamMemberActivity {
  id: string
  full_name: string | null
  email: string
  role: string | null
  account_role: string | null
  avatar_url: string | null
  messagesSent: number
}

/**
 * Loads team activity for the current account.
 * Uses the secure server-side /api/dashboard/team-activity endpoint
 * backed by Firebase Auth & Firestore with graceful fallbacks.
 */
export async function loadTeamActivity(
  _db?: SupabaseClient | any,
  _accountId?: string
): Promise<TeamMemberActivity[]> {
  try {
    const res = await fetch('/api/dashboard/team-activity', { cache: 'no-store' });
    if (!res.ok) {
      console.warn(`[loadTeamActivity] endpoint returned status: ${res.status}`);
      return [];
    }
    const data = await res.json();
    if (Array.isArray(data?.team)) {
      return data.team;
    }
    return [];
  } catch (err) {
    console.warn('[loadTeamActivity] fetch warning:', err);
    return [];
  }
}
