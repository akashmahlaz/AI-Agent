import sql from "@/lib/pg";
import { embedText, embedBatch, cosineSimilarity } from "@/lib/ai/embeddings";

export interface MemoryFact {
  id: string;
  userId: string;
  content: string;
  source?: string;
  kind?: "preference" | "fact" | "project" | "instruction";
  importance?: number;
  normalizedContent?: string;
  embedding?: number[];
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

type MemoryFactInput = {
  content: string;
  source?: string;
  kind?: MemoryFact["kind"];
  importance?: number;
};

// ─── Probe whether pgvector / embedding column is available ──────────────────

let embeddingsAvailable: boolean | null = null;

async function hasEmbeddingColumn(): Promise<boolean> {
  if (embeddingsAvailable !== null) return embeddingsAvailable;
  try {
    const rows = await sql<{ exists: boolean }[]>`
      select exists (
        select 1
        from information_schema.columns
        where table_name = 'memories' and column_name = 'embedding'
      ) as exists
    `;
    embeddingsAvailable = rows[0]?.exists === true;
  } catch {
    embeddingsAvailable = false;
  }
  return embeddingsAvailable;
}

// ─── Keywords (cheap BM25-style features) ─────────────────────────────────────

const STOP_WORDS = new Set([
  "the","a","an","is","are","was","were","be","been","being","have","has","had",
  "do","does","did","will","would","could","should","may","might","shall","can",
  "to","of","in","for","on","with","at","by","from","as","into","about","like",
  "through","after","over","between","out","up","down","off","then","than","so",
  "no","not","only","own","same","but","and","or","nor","if","this","that","these",
  "those","it","its","my","your","his","her","our","their","i","you","he","she",
  "we","they","me","him","us","them","what","which","who","when","where","how",
  "all","each","every","both","few","more","most","other","some","such","just",
  "also","very",
]);

function extractKeywords(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
    ),
  ).slice(0, 50);
}

// ─── Chunking ────────────────────────────────────────────────────────────────

const CHUNK_SIZE_TOKENS = 400;
const CHUNK_OVERLAP_TOKENS = 80;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function chunkText(text: string): Array<{
  text: string;
  tokenCount: number;
  keywords: string[];
}> {
  const lines = text.split("\n");
  const chunks: Array<{ text: string; tokenCount: number; keywords: string[] }> = [];

  let currentLines: string[] = [];
  let currentTokens = 0;

  for (const line of lines) {
    const lineTokens = estimateTokens(line);
    currentLines.push(line);
    currentTokens += lineTokens;

    if (currentTokens >= CHUNK_SIZE_TOKENS || line === lines[lines.length - 1]) {
      const chunkBody = currentLines.join("\n");
      chunks.push({
        text: chunkBody,
        tokenCount: currentTokens,
        keywords: extractKeywords(chunkBody),
      });

      let overlapTokens = 0;
      let overlapStart = currentLines.length;
      for (let j = currentLines.length - 1; j >= 0; j--) {
        overlapTokens += estimateTokens(currentLines[j]);
        if (overlapTokens >= CHUNK_OVERLAP_TOKENS) {
          overlapStart = j;
          break;
        }
      }
      currentLines = currentLines.slice(overlapStart);
      currentTokens = currentLines.reduce((acc, l) => acc + estimateTokens(l), 0);
    }
  }

  return chunks;
}

// ─── Secret guard ─────────────────────────────────────────────────────────────

const SECRET_PATTERNS = [
  /\b(api[_-]?key|access[_-]?token|refresh[_-]?token|bearer|password|passwd|secret|private[_-]?key)\b/i,
  /\b(ghp|gho|ghu|ghs|github_pat)_[A-Za-z0-9_]{20,}\b/,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];

function normalizeContent(content: string) {
  return content.trim().replace(/\s+/g, " ").toLowerCase();
}

function assertSafeMemory(content: string) {
  if (SECRET_PATTERNS.some((pattern) => pattern.test(content))) {
    throw new Error(
      "Memory cannot store credentials, tokens, API keys, passwords, or private keys.",
    );
  }
}

function clampImportance(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  return Math.min(5, Math.max(1, Math.round(value)));
}

// ─── Row mapping ──────────────────────────────────────────────────────────────

interface MemoryRow {
  id: string;
  userId: string;
  content: string;
  source: string | null;
  kind: MemoryFact["kind"] | null;
  importance: number | null;
  normalizedContent: string | null;
  embedding: number[] | string | null;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date | null;
}

function parseEmbedding(value: number[] | string | null): number[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value;
  // pgvector returns a string like "[0.1,0.2,...]"
  if (typeof value === "string" && value.startsWith("[")) {
    try {
      return JSON.parse(value) as number[];
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function fromRow(row: MemoryRow): MemoryFact {
  return {
    id: row.id,
    userId: row.userId,
    content: row.content,
    source: row.source ?? undefined,
    kind: row.kind ?? undefined,
    importance: row.importance ?? undefined,
    normalizedContent: row.normalizedContent ?? undefined,
    embedding: parseEmbedding(row.embedding),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    lastUsedAt: row.lastUsedAt ? row.lastUsedAt.toISOString() : undefined,
  };
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function compactMemoryLine(memoryFact: MemoryFact) {
  const kind = memoryFact.kind ? `${memoryFact.kind}: ` : "";
  return `- ${kind}${memoryFact.content}`;
}

function scoreMemory(fact: MemoryFact): number {
  const importance = fact.importance ?? 3;
  const ageMs = Date.now() - new Date(fact.updatedAt).getTime();
  const ageDays = ageMs / 86_400_000;
  const recency = Math.exp(-ageDays / 30);
  const kindBoost = fact.kind === "instruction" || fact.kind === "preference" ? 1.3 : 1;
  return importance * recency * kindBoost;
}

// ─── Purge ───────────────────────────────────────────────────────────────────

const DEPTH_TO_DAYS: Record<string, number | null> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  forever: null,
};

async function purgeExpired(userId: string, depth: string | undefined) {
  if (!depth) return;
  const days = DEPTH_TO_DAYS[depth];
  if (days === undefined || days === null) return;
  await sql`
    delete from memories
    where user_id = ${userId}
      and updated_at < now() - (${days} || ' days')::interval
      and (importance is null or importance < 4)
  `;
}

// ─── Public API ──────────────────────────────────────────────────────────────

async function setEmbeddingAsync(userId: string, normalized: string, content: string) {
  if (!(await hasEmbeddingColumn())) return;
  try {
    const result = await embedText(content, userId);
    if (!result?.embedding?.length) return;
    const literal = `[${result.embedding.join(",")}]`;
    await sql`
      update memories
      set embedding = ${literal}::vector, embedding_stale = false
      where user_id = ${userId} and normalized_content = ${normalized}
    `;
  } catch {
    // Best-effort — embedding storage failures must not break writes.
  }
}

const SELECT_COLS_NO_EMBED = sql`
  id, user_id, content, source, kind, importance,
  normalized_content, null::text as embedding,
  created_at, updated_at, last_used_at
`;

const SELECT_COLS_WITH_EMBED = sql`
  id, user_id, content, source, kind, importance,
  normalized_content, embedding::text as embedding,
  created_at, updated_at, last_used_at
`;

async function selectCols(): Promise<[typeof SELECT_COLS_NO_EMBED]> {
  return [(await hasEmbeddingColumn()) ? SELECT_COLS_WITH_EMBED : SELECT_COLS_NO_EMBED];
}

export const memory = {
  async add(userId: string, fact: MemoryFactInput): Promise<MemoryFact> {
    const content = fact.content.trim();
    assertSafeMemory(content);
    const normalized = normalizeContent(content);
    const importance = clampImportance(fact.importance);
    const keywords = extractKeywords(content);

    const [cols] = await selectCols();
    const [row] = await sql<MemoryRow[]>`
      insert into memories (
        id, user_id, scope, content, metadata,
        kind, importance, source, normalized_content, keywords
      ) values (
        ${crypto.randomUUID()},
        ${userId},
        ${"user"},
        ${content},
        ${sql.json({})},
        ${fact.kind ?? null},
        ${importance ?? null},
        ${fact.source ?? null},
        ${normalized},
        ${keywords}::text[]
      )
      on conflict (user_id, normalized_content) where normalized_content is not null
      do update set
        content     = excluded.content,
        kind        = excluded.kind,
        importance  = coalesce(excluded.importance, memories.importance),
        source      = coalesce(excluded.source, memories.source),
        keywords    = excluded.keywords,
        updated_at  = now()
      returning ${cols}
    `;

    // Fire-and-forget embedding write.
    void setEmbeddingAsync(userId, normalized, content);

    return fromRow(row);
  },

  async search(userId: string, query: string, limit = 10): Promise<MemoryFact[]> {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const pattern = `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`;

    const [cols] = await selectCols();
    const rows = await sql<MemoryRow[]>`
      select ${cols}
      from memories
      where user_id = ${userId}
        and lower(content) like ${pattern}
      order by importance desc nulls last, updated_at desc
      limit 50
    `;
    const candidates = rows.map(fromRow);
    if (candidates.length === 0) return [];

    if (await hasEmbeddingColumn()) {
      try {
        const queryEmbedding = await embedText(query, userId);
        if (queryEmbedding?.embedding?.length) {
          candidates.sort((a, b) => {
            const simA = a.embedding
              ? cosineSimilarity(queryEmbedding.embedding, a.embedding) * (a.importance ?? 3)
              : 0;
            const simB = b.embedding
              ? cosineSimilarity(queryEmbedding.embedding, b.embedding) * (b.importance ?? 3)
              : 0;
            return simB - simA;
          });
        }
      } catch {
        // ignore embedding failures
      }
    }

    const selected = candidates.slice(0, limit);
    const ids = selected.map((entry) => entry.id);
    if (ids.length > 0) {
      void sql`
        update memories set last_used_at = now() where user_id = ${userId} and id = any(${ids}::uuid[])
      `.catch(() => undefined);
    }
    return selected;
  },

  async list(userId: string, limit = 50): Promise<MemoryFact[]> {
    const [cols] = await selectCols();
    const rows = await sql<MemoryRow[]>`
      select ${cols}
      from memories
      where user_id = ${userId}
      order by importance desc nulls last, updated_at desc
      limit ${limit}
    `;
    return rows.map(fromRow);
  },

  async remove(userId: string, id: string): Promise<void> {
    await sql`delete from memories where user_id = ${userId} and id = ${id}`;
  },

  async purgeExpired(userId: string, depth: string | undefined) {
    await purgeExpired(userId, depth);
  },

  async context(
    userId: string,
    query: string,
    limit = 8,
    options?: { depth?: string },
  ): Promise<string> {
    if (options?.depth) await purgeExpired(userId, options.depth);

    const [matched, recent] = await Promise.all([
      query.trim() ? memory.search(userId, query, limit) : Promise.resolve([] as MemoryFact[]),
      memory.list(userId, Math.max(4, Math.floor(limit / 2))),
    ]);

    const byId = new Map<string, MemoryFact>();
    for (const entry of [...matched, ...recent]) byId.set(entry.id, entry);

    const sorted = [...byId.values()].sort((a, b) => scoreMemory(b) - scoreMemory(a));
    const selected = sorted.slice(0, limit);
    if (selected.length === 0) return "";

    const ids = selected.map((entry) => entry.id);
    void sql`
      update memories set last_used_at = now() where user_id = ${userId} and id = any(${ids}::uuid[])
    `.catch(() => undefined);

    return [
      "Known user memory (use as context, don't reveal unless relevant):",
      ...selected.map(compactMemoryLine),
    ].join("\n");
  },

  /**
   * Index a long text into memory chunks — for conversation transcripts,
   * workspace files, and other long-form content.
   */
  async indexChunked(
    userId: string,
    source: "conversation" | "workspace" | "note",
    sourceId: string,
    text: string,
  ): Promise<number> {
    const chunks = chunkText(text);
    if (chunks.length === 0) return 0;

    const scope = source === "note" ? "user" : source;
    const embeddings = await embedBatch(chunks.map((chunk) => chunk.text), userId).catch(
      () => [] as Array<{ embedding?: number[] } | null>,
    );

    const embedAvailable = await hasEmbeddingColumn();

    await sql.begin(async (tx) => {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = (embeddings[i] as { embedding?: number[] } | null)?.embedding;
        const id = crypto.randomUUID();
        if (embedAvailable && embedding?.length) {
          const literal = `[${embedding.join(",")}]`;
          await tx`
            insert into memories (
              id, user_id, scope, subject_type, subject_id,
              content, metadata, keywords, token_count, embedding, embedding_stale
            ) values (
              ${id}, ${userId}, ${scope}, ${source}, ${sourceId},
              ${chunk.text}, ${sql.json({})}, ${chunk.keywords}::text[], ${chunk.tokenCount},
              ${literal}::vector, false
            )
          `;
        } else {
          await tx`
            insert into memories (
              id, user_id, scope, subject_type, subject_id,
              content, metadata, keywords, token_count
            ) values (
              ${id}, ${userId}, ${scope}, ${source}, ${sourceId},
              ${chunk.text}, ${sql.json({})}, ${chunk.keywords}::text[], ${chunk.tokenCount}
            )
          `;
        }
      }
    });

    return chunks.length;
  },

  /**
   * Hybrid search: vector similarity + keyword overlap, merged with weighted scoring.
   * Used for long content indexed via indexChunked().
   */
  async hybridSearch(
    userId: string,
    query: string,
    options: {
      sources?: string[];
      topK?: number;
      minScore?: number;
      vectorWeight?: number;
      textWeight?: number;
    } = {},
  ): Promise<
    Array<{ content: string; source: string; sourceId: string; score: number }>
  > {
    const {
      sources,
      topK = 6,
      minScore = 0.3,
      vectorWeight = 0.7,
      textWeight = 0.3,
    } = options;

    const queryKeywords = extractKeywords(query);

    let vectorResults: Array<{ content: string; source: string; sourceId: string; score: number }> = [];

    if (await hasEmbeddingColumn()) {
      const queryEmbedding = await embedText(query, userId).catch(() => null);
      if (queryEmbedding?.embedding?.length) {
        const candidates = await sql<MemoryRow[]>`
          select id, user_id, content, source, kind, importance,
                 normalized_content,
                 embedding::text as embedding,
                 subject_type, subject_id,
                 created_at, updated_at, last_used_at
          from memories
          where user_id = ${userId}
            and embedding is not null
            ${sources && sources.length > 0
              ? sql`and subject_type = any(${sources}::text[])`
              : sql``}
          limit 200
        ` as unknown as Array<MemoryRow & { subjectType: string | null; subjectId: string | null }>;
        vectorResults = candidates
          .map((doc) => ({
            content: doc.content,
            source: doc.subjectType ?? "unknown",
            sourceId: doc.subjectId ?? "",
            score: cosineSimilarity(
              queryEmbedding.embedding,
              parseEmbedding(doc.embedding) ?? [],
            ),
          }))
          .filter((entry) => entry.score > 0.1)
          .sort((a, b) => b.score - a.score)
          .slice(0, topK * 2);
      }
    }

    let textResults: Array<{ content: string; source: string; sourceId: string; score: number }> = [];

    if (queryKeywords.length > 0) {
      const top = queryKeywords.slice(0, 8);
      const textCandidates = (await sql<
        Array<{
          content: string;
          subjectType: string | null;
          subjectId: string | null;
          keywords: string[] | null;
        }>
      >`
        select content, subject_type, subject_id, keywords
        from memories
        where user_id = ${userId}
          and keywords && ${top}::text[]
          ${sources && sources.length > 0
            ? sql`and subject_type = any(${sources}::text[])`
            : sql``}
        limit ${topK * 2}
      `).map((doc) => {
        const matched = queryKeywords.filter((keyword) =>
          (doc.keywords ?? []).includes(keyword),
        ).length;
        return {
          content: doc.content,
          source: doc.subjectType ?? "unknown",
          sourceId: doc.subjectId ?? "",
          score: matched / queryKeywords.length,
        };
      });
      textResults = textCandidates
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK * 2);
    }

    const merged = new Map<
      string,
      { content: string; source: string; sourceId: string; score: number }
    >();

    for (const r of vectorResults) {
      const key = `${r.source}:${r.sourceId}:${r.content.slice(0, 50)}`;
      merged.set(key, { ...r, score: r.score * vectorWeight });
    }
    for (const r of textResults) {
      const key = `${r.source}:${r.sourceId}:${r.content.slice(0, 50)}`;
      const existing = merged.get(key);
      if (existing) {
        existing.score += r.score * textWeight;
      } else {
        merged.set(key, { ...r, score: r.score * textWeight });
      }
    }

    return Array.from(merged.values())
      .filter((entry) => entry.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  },
};
