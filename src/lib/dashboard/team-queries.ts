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

export async function loadTeamActivity(db: SupabaseClient, accountId: string): Promise<TeamMemberActivity[]> {
  const { data, error } = await db
    .from('profiles')
    .select('id, full_name, email, role, account_role, avatar_url')
    .eq('account_id', accountId)
    
  if (error) throw error;
  
  // Also get some stats for each user
  const { data: messages } = await db
    .from('messages')
    .select('sender_id')
    .eq('sender_type', 'agent')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    
  const msgCounts: Record<string, number> = {}
  if (messages) {
    messages.forEach(m => {
      msgCounts[m.sender_id] = (msgCounts[m.sender_id] || 0) + 1
    })
  }
  
  return (data || []).map(p => ({
    ...p,
    messagesSent: msgCounts[p.id] || 0
  }))
}
