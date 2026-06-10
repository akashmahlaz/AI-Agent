import sql from "@/lib/pg";
import type { LogEntry } from "@/lib/types";

export interface StoredLogEntry extends LogEntry {
  userId?: string;
  metadata?: Record<string, unknown>;
}

interface LogRow {
  id: string;
  userId: string | null;
  level: LogEntry["level"];
  source: string;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

function fromRow(row: LogRow): StoredLogEntry {
  return {
    id: row.id,
    level: row.level,
    source: row.source,
    message: row.message,
    userId: row.userId ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function appendLog(
  entry: Omit<LogEntry, "id" | "createdAt"> & { userId?: string; metadata?: Record<string, unknown> },
) {
  const id = crypto.randomUUID();
  const [row] = await sql<LogRow[]>`
    insert into logs (id, user_id, level, source, message, metadata)
    values (
      ${id},
      ${entry.userId ?? null},
      ${entry.level},
      ${entry.source},
      ${entry.message},
      ${sql.json((entry.metadata ?? {}) as never)}
    )
    returning id, user_id, level, source, message, metadata, created_at
  `;
  return fromRow(row);
}

export async function listLogs({ userId, limit = 100 }: { userId?: string; limit?: number } = {}) {
  const rows = userId
    ? await sql<LogRow[]>`
        select id, user_id, level, source, message, metadata, created_at
        from logs
        where user_id = ${userId}
        order by created_at desc
        limit ${limit}
      `
    : await sql<LogRow[]>`
        select id, user_id, level, source, message, metadata, created_at
        from logs
        order by created_at desc
        limit ${limit}
      `;
  return rows.map(fromRow);
}
