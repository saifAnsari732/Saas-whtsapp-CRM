import type { Conversation, Contact, Tag } from "@/types";

/**
 * Conversation select that embeds the contact plus its tags, so the Inbox
 * can filter conversations by contact tag without a second round-trip.
 * `contact_tags(tags(*))` returns the join rows; {@link normalizeConversation}
 * flattens them onto `contact.tags`.
 */
export const CONVERSATION_SELECT =
  "*, contact:contacts(*, contact_tags(tags(*))), messages:messages(id, sender_type, content_text, created_at)";

/** Raw shape returned by {@link CONVERSATION_SELECT} before flattening. */
type RawContact = Contact & { contact_tags?: { tags: Tag | null }[] };
type RawConversation = Omit<Conversation, "contact"> & {
  contact?: RawContact | null;
  messages?: Array<{
    id: string;
    sender_type: "customer" | "agent" | "bot";
    content_text?: string | null;
    created_at: string;
  }> | null;
};

/**
 * Flatten the embedded `contact_tags(tags(*))` join into `contact.tags`
 * and compute customer reply status.
 */
export function normalizeConversation(raw: RawConversation): Conversation {
  const { messages, ...rest } = raw;
  const rawContact = raw.contact;

  let has_customer_reply = false;
  let last_sender_type: "customer" | "agent" | "bot" | undefined;
  let last_customer_message_text: string | undefined;

  if (Array.isArray(messages) && messages.length > 0) {
    const sorted = [...messages].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    last_sender_type = sorted[0]?.sender_type;

    const customerMsgs = sorted.filter((m) => m.sender_type === "customer");
    if (customerMsgs.length > 0) {
      has_customer_reply = true;
      last_customer_message_text = customerMsgs[0]?.content_text || undefined;
    }
  }

  if (!rawContact) {
    return {
      ...(rest as Conversation),
      has_customer_reply,
      last_sender_type,
      last_customer_message_text,
    };
  }

  const { contact_tags, ...contact } = rawContact;
  return {
    ...(rest as Conversation),
    has_customer_reply,
    last_sender_type,
    last_customer_message_text,
    contact: {
      ...contact,
      tags: (contact_tags ?? [])
        .map((ct) => ct.tags)
        .filter((t): t is Tag => t != null),
    },
  };
}

export function normalizeConversations(
  rows: RawConversation[],
): Conversation[] {
  return rows.map(normalizeConversation);
}

export interface ContactFilters {
  /** Tag ids; a conversation matches if its contact has ANY of them (OR). */
  tagIds: string[];
  /** Exact company match, or null for no company filter. */
  company: string | null;
}

/**
 * Whether a conversation passes the contact-based Inbox filters (issue #272).
 * Empty `tagIds` and null `company` are no-ops, so the default (no filters)
 * always matches. Tags use OR logic, consistent with Broadcast audiences.
 */
export function matchesContactFilters(
  conversation: Conversation,
  { tagIds, company }: ContactFilters,
): boolean {
  if (tagIds.length > 0) {
    const contactTagIds = conversation.contact?.tags ?? [];
    if (!contactTagIds.some((t) => tagIds.includes(t.id))) return false;
  }

  if (company !== null && conversation.contact?.company?.trim() !== company) {
    return false;
  }

  return true;
}
