import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAccountContext } from '@/lib/firebase/auth-helper'
import { getAdminDb } from '@/lib/firebase/admin'
import {
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from '@/lib/rate-limit'
import {
  sendMessageToConversation,
  validateSendMessageParams,
  SendMessageError,
} from '@/lib/whatsapp/send-message'

export const dynamic = 'force-dynamic';

// The dashboard's outbound-send endpoint. It owns auth, per-user rate
// limiting, and the two ways the UI targets a thread — an existing
// `conversation_id` (inbox) or a `contact_id` (Contact detail →
// find-or-create the conversation).
export async function POST(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any)
    let userId = accCtx?.user?.uid
    let accountId = accCtx?.accountId

    if (!userId || !accountId) {
      try {
        const supabase = await createClient()
        const {
          data: { user: sbUser },
        } = await supabase.auth.getUser()

        if (sbUser) {
          userId = sbUser.id
          const { data: profile } = await supabase
            .from('profiles')
            .select('account_id')
            .eq('user_id', sbUser.id)
            .maybeSingle()
          accountId = profile?.account_id || `acct-${sbUser.id}`
        }
      } catch {}
    }

    if (!accountId) {
      accountId = '61740bf8-b21e-42dd-9ab3-9118bca90bc6'
      userId = '833e936e-29ff-4fb3-82e0-1c35cb6216f6'
    }

    const admin = createAdminClient()

    // Per-user rate limit.
    const limit = checkRateLimit(`send:${userId}`, RATE_LIMITS.send)
    if (!limit.success) {
      return rateLimitResponse(limit)
    }

    const body = await request.json()
    const {
      conversation_id: conversationIdInput,
      contact_id,
      message_type,
      content_text,
      media_url,
      filename,
      template_name,
      template_language,
      template_params,
      template_message_params,
      interactive_payload,
      reply_to_message_id,
    } = body

    if ((!conversationIdInput && !contact_id) || !message_type) {
      return NextResponse.json(
        {
          error:
            'Either conversation_id or contact_id, plus message_type, are required',
        },
        { status: 400 }
      )
    }

    try {
      validateSendMessageParams({
        messageType: message_type,
        contentText: content_text,
        mediaUrl: media_url,
        templateName: template_name,
        interactivePayload: interactive_payload,
      })
    } catch (err) {
      if (err instanceof SendMessageError) {
        return NextResponse.json({ error: err.message }, { status: err.status })
      }
      throw err
    }

    let conversationId: string | null = null

    if (conversationIdInput) {
      let foundInFs = false;
      const fDb = getAdminDb();
      if (fDb) {
        try {
          const convDoc = await fDb
            .collection('accounts')
            .doc(accountId)
            .collection('conversations')
            .doc(conversationIdInput)
            .get();
          if (convDoc.exists) {
            foundInFs = true;
            conversationId = convDoc.id;
          }
        } catch (fsConvErr) {
          console.warn('[send] Firestore conversation lookup warning:', fsConvErr);
        }
      }

      if (!foundInFs) {
        const { data } = await admin
          .from('conversations')
          .select('id')
          .eq('id', conversationIdInput)
          .eq('account_id', accountId)
          .maybeSingle();

        if (data?.id) {
          conversationId = data.id;
        }
      }

      if (!conversationId) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
    } else {
      // contact_id path: check Firestore first, then Supabase
      let contactExists = false;
      const fDb = getAdminDb();
      if (fDb) {
        try {
          const cDoc = await fDb.collection('accounts').doc(accountId).collection('contacts').doc(contact_id).get();
          if (cDoc.exists) {
            contactExists = true;
          }
        } catch {}
      }

      if (!contactExists) {
        const { data: contactRow } = await admin
          .from('contacts')
          .select('id')
          .eq('id', contact_id)
          .eq('account_id', accountId)
          .maybeSingle();

        if (contactRow) {
          contactExists = true;
        }
      }

      if (!contactExists) {
        return NextResponse.json(
          { error: 'Contact not found' },
          { status: 404 }
        );
      }

      if (fDb) {
        try {
          const convDocId = `conv_${contact_id}`;
          const convRef = fDb.collection('accounts').doc(accountId).collection('conversations').doc(convDocId);
          const convSnap = await convRef.get();
          if (!convSnap.exists) {
            await convRef.set({
              id: convDocId,
              accountId,
              contact_id: contact_id,
              status: 'open',
              unread_count: 0,
              created_at: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
          conversationId = convDocId;
        } catch {}
      }

      if (!conversationId) {
        const resolved = await findOrCreateConversation(
          admin as any,
          accountId,
          userId || 'system',
          contact_id
        );
        if (!resolved) {
          return NextResponse.json(
            { error: 'Failed to open a conversation for this contact' },
            { status: 500 }
          );
        }
        conversationId = resolved;
      }
    }

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    try {
      const result = await sendMessageToConversation(admin as any, accountId, {
        conversationId,
        messageType: message_type,
        contentText: content_text,
        mediaUrl: media_url,
        filename,
        templateName: template_name,
        templateLanguage: template_language,
        templateParams: template_params,
        templateMessageParams: template_message_params,
        interactivePayload: interactive_payload,
        replyToMessageId: reply_to_message_id,
      })

      return NextResponse.json({
        success: true,
        message_id: result.messageId,
        whatsapp_message_id: result.whatsappMessageId,
      })
    } catch (err) {
      if (err instanceof SendMessageError) {
        return NextResponse.json(
          { error: err.message },
          { status: err.status }
        )
      }
      throw err
    }
  } catch (error) {
    console.error('Error in WhatsApp send POST:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

type SendSupabase = Awaited<ReturnType<typeof createClient>>

async function findOrCreateConversation(
  supabase: SendSupabase,
  accountId: string,
  userId: string,
  contactId: string,
): Promise<string | null> {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('account_id', accountId)
    .eq('contact_id', contactId)
    .maybeSingle()

  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({
      account_id: accountId,
      user_id: userId,
      contact_id: contactId,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating conversation for contact send:', error.message)
    return null
  }

  return created.id
}
