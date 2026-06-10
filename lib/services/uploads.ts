import sql from "@/lib/pg";

export interface StoredUpload {
  id: string;
  userId: string;
  filename: string;
  contentType: string;
  size: number;
  url: string;
  createdAt: string;
}

export type NewUpload = Pick<StoredUpload, "userId" | "filename" | "contentType" | "size" | "url">;

interface UploadRow {
  id: string;
  userId: string;
  filename: string;
  contentType: string | null;
  sizeBytes: string | number | null;
  storageKey: string;
  createdAt: Date;
}

function fromRow(row: UploadRow): StoredUpload {
  return {
    id: row.id,
    userId: row.userId,
    filename: row.filename,
    contentType: row.contentType ?? "application/octet-stream",
    size: Number(row.sizeBytes ?? 0),
    url: row.storageKey,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function recordUpload(input: NewUpload) {
  const id = crypto.randomUUID();
  const [row] = await sql<UploadRow[]>`
    insert into uploads (id, user_id, filename, content_type, size_bytes, storage_key)
    values (${id}, ${input.userId}, ${input.filename}, ${input.contentType}, ${input.size}, ${input.url})
    returning id, user_id, filename, content_type, size_bytes, storage_key, created_at
  `;
  return fromRow(row);
}

export async function listUploads(userId: string, limit = 100) {
  const rows = await sql<UploadRow[]>`
    select id, user_id, filename, content_type, size_bytes, storage_key, created_at
    from uploads
    where user_id = ${userId}
    order by created_at desc
    limit ${limit}
  `;
  return rows.map(fromRow);
}
