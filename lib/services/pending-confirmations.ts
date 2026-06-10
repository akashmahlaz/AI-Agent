/**
 * Two-phase confirmation for destructive tool calls.
 *
 * Pattern:
 *   1. The destructive tool builds a `PendingAction` describing exactly what
 *      will happen, stores it under a short token, and returns
 *      `{ requires_confirmation: true, token, summary, expiresAt }` to the
 *      model. The system prompt instructs the model to surface the summary
 *      verbatim and wait for explicit operator approval.
 *   2. The model calls `confirm_action({ token, approve: true })`. The pending
 *      action is looked up, validated against the same userId, and executed.
 *
 * Tokens live in PostgreSQL (`pending_confirmations`) so they survive server
 * restarts and are scoped per user. TTL = 10 minutes (enforced on read).
 */

import { randomBytes } from "node:crypto";
import sql from "@/lib/pg";

export interface PendingAction {
  token: string;
  userId: string;
  tool: string;
  args: Record<string, unknown>;
  summary: string;
  createdAt: string;
  expiresAt: Date;
}

const TTL_SECONDS = 60 * 10;

interface PendingRow {
  token: string;
  userId: string;
  tool: string;
  args: Record<string, unknown>;
  summary: string;
  createdAt: Date;
  expiresAt: Date;
}

export async function createPendingConfirmation(input: {
  userId: string;
  tool: string;
  args: Record<string, unknown>;
  summary: string;
}): Promise<{
  token: string;
  expiresAt: string;
  requires_confirmation: true;
  summary: string;
}> {
  const token = randomBytes(12).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_SECONDS * 1000);

  await sql`
    insert into pending_confirmations (token, user_id, tool, args, summary, expires_at)
    values (
      ${token},
      ${input.userId},
      ${input.tool},
      ${sql.json(input.args as never)},
      ${input.summary},
      ${expiresAt}
    )
  `;

  return {
    requires_confirmation: true,
    token,
    summary: input.summary,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function consumePendingConfirmation(
  userId: string,
  token: string,
): Promise<PendingAction | null> {
  // Atomic claim-and-delete: only succeeds if token belongs to user and is unexpired.
  const [row] = await sql<PendingRow[]>`
    delete from pending_confirmations
    where token   = ${token}
      and user_id = ${userId}
      and expires_at >= now()
    returning token, user_id, tool, args, summary, created_at, expires_at
  `;

  // Best-effort cleanup of expired rows for everyone.
  void sql`delete from pending_confirmations where expires_at < now()`.catch(() => undefined);

  if (!row) return null;
  return {
    token: row.token,
    userId: row.userId,
    tool: row.tool,
    args: row.args,
    summary: row.summary,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt,
  };
}
