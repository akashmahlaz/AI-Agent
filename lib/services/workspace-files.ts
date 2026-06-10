import sql from "@/lib/pg";

export type WorkspaceFileKind = "bootstrap" | "soul" | "user";

export interface WorkspaceFile {
  id: string;
  userId: string;
  kind: WorkspaceFileKind;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceFileRow {
  id: string;
  userId: string;
  kind: WorkspaceFileKind;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

function fromRow(row: WorkspaceFileRow): WorkspaceFile {
  return {
    id: row.id,
    userId: row.userId,
    kind: row.kind,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export interface WorkspaceFilesSnapshot {
  bootstrap?: string;
  soul?: string;
  user?: string;
}

export async function getActiveWorkspaceFiles(userId: string): Promise<WorkspaceFilesSnapshot> {
  const rows = await sql<{ kind: WorkspaceFileKind; content: string }[]>`
    select kind, content
    from workspace_files
    where user_id = ${userId}
  `;
  const result: WorkspaceFilesSnapshot = {};
  for (const row of rows) {
    result[row.kind] = row.content;
  }
  return result;
}

export async function saveWorkspaceFile(
  userId: string,
  kind: WorkspaceFileKind,
  content: string,
): Promise<WorkspaceFile> {
  const [row] = await sql<WorkspaceFileRow[]>`
    insert into workspace_files (id, user_id, kind, content)
    values (${crypto.randomUUID()}, ${userId}, ${kind}, ${content})
    on conflict (user_id, kind)
    do update set
      content    = excluded.content,
      updated_at = now()
    returning id, user_id, kind, content, created_at, updated_at
  `;
  return fromRow(row);
}

export async function deleteWorkspaceFile(userId: string, kind: WorkspaceFileKind): Promise<void> {
  await sql`
    delete from workspace_files where user_id = ${userId} and kind = ${kind}
  `;
}

export async function listWorkspaceFiles(userId: string) {
  const rows = await sql<{ id: string; kind: WorkspaceFileKind; updatedAt: Date }[]>`
    select id, kind, updated_at
    from workspace_files
    where user_id = ${userId}
    order by updated_at desc
  `;
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export function formatWorkspaceFilesSection(snapshot: WorkspaceFilesSnapshot): string {
  const parts: string[] = [];
  if (snapshot.bootstrap) {
    parts.push(
      "## BOOTSTRAP (operational rules — load first, apply always)\n" +
        snapshot.bootstrap.trim(),
    );
  }
  if (snapshot.soul) {
    parts.push(
      "## SOUL (personality & voice — shape how you communicate)\n" + snapshot.soul.trim(),
    );
  }
  if (snapshot.user) {
    parts.push(
      "## USER PROFILE (learned from interaction — always respect)\n" + snapshot.user.trim(),
    );
  }
  return parts.length > 0 ? ["\n## Workspace Files\n", ...parts].join("\n") : "";
}
