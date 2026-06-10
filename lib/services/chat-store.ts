import sql from "@/lib/pg";
import type { Channel, ConversationDetail, MessageRole } from "@/lib/types";

export interface StoredConversation {
  _id: string;
  id: string;
  userId: string;
  title: string;
  channel: Channel;
  lastMessage: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoredMessage {
  _id: string;
  id: string;
  conversationId: string;
  userId: string;
  role: MessageRole;
  content: string;
  parts: unknown[];
  createdAt: string;
}

export type NewChatMessage = Pick<StoredMessage, "role" | "content" | "parts" | "createdAt">;

interface ConversationRow {
  id: string;
  userId: string;
  title: string;
  channel: string;
  lastMessage: string | null;
  messageCount: string | number;
  createdAt: Date;
  updatedAt: Date;
}

interface MessageRow {
  id: string;
  conversationId: string;
  userId: string | null;
  role: MessageRole;
  content: string;
  parts: unknown[] | null;
  createdAt: Date;
}

function fromConversationRow(row: ConversationRow): StoredConversation {
  return {
    _id: row.id,
    id: row.id,
    userId: row.userId,
    title: row.title,
    channel: row.channel as Channel,
    lastMessage: row.lastMessage,
    messageCount: Number(row.messageCount ?? 0),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function fromMessageRow(row: MessageRow): StoredMessage {
  return {
    _id: row.id,
    id: row.id,
    conversationId: row.conversationId,
    userId: row.userId ?? "",
    role: row.role,
    content: row.content,
    parts: row.parts ?? [],
    createdAt: row.createdAt.toISOString(),
  };
}

function toSummary(conversation: StoredConversation) {
  return {
    ...conversation,
    preview: conversation.lastMessage ?? undefined,
  };
}

export async function listConversations(userId: string) {
  const rows = await sql<ConversationRow[]>`
    select
      c.id,
      c.user_id,
      c.title,
      c.channel,
      c.created_at,
      c.updated_at,
      (
        select m.content
        from messages m
        where m.conversation_id = c.id
        order by m.created_at desc
        limit 1
      ) as last_message,
      (
        select count(*)
        from messages m
        where m.conversation_id = c.id
      ) as message_count
    from conversations c
    where c.user_id = ${userId}
    order by c.updated_at desc
  `;
  return rows.map(fromConversationRow).map(toSummary);
}

export async function getConversation(
  conversationId: string,
  userId: string,
): Promise<ConversationDetail | null> {
  const [conversation] = await sql<ConversationRow[]>`
    select
      c.id,
      c.user_id,
      c.title,
      c.channel,
      c.created_at,
      c.updated_at,
      null::text as last_message,
      0::bigint   as message_count
    from conversations c
    where c.id = ${conversationId} and c.user_id = ${userId}
    limit 1
  `;
  if (!conversation) return null;

  const messageRows = await sql<MessageRow[]>`
    select id, conversation_id, user_id, role, content, parts, created_at
    from messages
    where conversation_id = ${conversationId}
    order by created_at asc
  `;

  return {
    ...fromConversationRow(conversation),
    messages: messageRows.map((message) => ({
      id: message.id,
      _id: message.id,
      conversationId: message.conversationId,
      role: message.role,
      content: message.content,
      parts: message.parts ?? [],
      createdAt: message.createdAt.toISOString(),
    })),
  };
}

export async function createConversation({
  userId,
  title = "New Chat",
  channel = "web",
}: {
  userId: string;
  title?: string;
  channel?: Channel;
}) {
  const id = crypto.randomUUID();
  const [row] = await sql<ConversationRow[]>`
    insert into conversations (id, user_id, title, channel)
    values (${id}, ${userId}, ${title}, ${channel})
    returning id, user_id, title, channel, created_at, updated_at,
              null::text as last_message, 0::bigint as message_count
  `;
  return { ...fromConversationRow(row), messages: [] };
}

export async function deleteConversation(conversationId: string, userId: string) {
  await sql`
    delete from conversations where id = ${conversationId} and user_id = ${userId}
  `;
}

export async function updateConversationTitle(
  conversationId: string,
  userId: string,
  title: string,
) {
  await sql`
    update conversations
    set title = ${title.trim().slice(0, 80)}, updated_at = now()
    where id = ${conversationId} and user_id = ${userId}
  `;
}

export async function appendMessage(
  conversationId: string,
  userId: string,
  message: NewChatMessage,
) {
  const [existing] = await sql<{ id: string }[]>`
    select id from conversations where id = ${conversationId} and user_id = ${userId} limit 1
  `;
  if (!existing) return null;

  const id = crypto.randomUUID();
  const createdAt = new Date(message.createdAt);

  const [row] = await sql<MessageRow[]>`
    insert into messages (id, conversation_id, user_id, role, content, parts, created_at)
    values (
      ${id},
      ${conversationId},
      ${userId},
      ${message.role},
      ${message.content},
      ${sql.json((message.parts ?? []) as never)},
      ${createdAt}
    )
    returning id, conversation_id, user_id, role, content, parts, created_at
  `;

  await sql`
    update conversations
    set updated_at = ${createdAt}
    where id = ${conversationId}
  `;

  return fromMessageRow(row);
}
