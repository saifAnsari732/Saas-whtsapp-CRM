import type { SupabaseClient } from '@supabase/supabase-js'
import type { ChatMessage } from './types'
import { aiContextMessageLimit } from './defaults'

interface DbMessage {
  sender_type: 'customer' | 'agent' | 'bot'
  content_type: string
  content_text: string | null
  template_name: string | null
}

/**
 * Fetch the last N text and template messages of a conversation and map them to the
 * provider-neutral chat shape. Customer messages become `user`; agent
 * and bot messages become `assistant`.
 *
 * Ordered oldest-first (chronological) so the transcript reads
 * naturally and the most recent customer message lands last.
 */
export async function buildConversationContext(
  db: SupabaseClient,
  conversationId: string,
  limit: number = aiContextMessageLimit(),
): Promise<ChatMessage[]> {
  const { data, error } = await db
    .from('messages')
    .select('sender_type, content_type, content_text, template_name')
    .eq('conversation_id', conversationId)
    .in('content_type', ['text', 'interactive', 'template'])
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  const rows = ((data ?? []) as DbMessage[]).reverse()

  // Collect unique template names that have no content_text
  const templateNames = Array.from(
    new Set(
      rows
        .filter((m) => m.content_type === 'template' && !m.content_text && m.template_name)
        .map((m) => m.template_name!),
    ),
  )

  const templateMap = new Map<string, string>()
  if (templateNames.length > 0) {
    const { data: tmpls } = await db
      .from('message_templates')
      .select('name, body_text')
      .in('name', templateNames)
    if (tmpls) {
      for (const t of tmpls) {
        if (t.name && t.body_text) templateMap.set(t.name, t.body_text)
      }
    }
  }

  const result: ChatMessage[] = []
  for (const m of rows) {
    let text = m.content_text ? m.content_text.trim() : ''
    if (m.content_type === 'template' && !text && m.template_name) {
      const body = templateMap.get(m.template_name)
      text = body ? body : `[Template: ${m.template_name}]`
    }
    if (text) {
      result.push({
        role: m.sender_type === 'customer' ? 'user' : 'assistant',
        content: text,
      })
    }
  }

  return result
}
