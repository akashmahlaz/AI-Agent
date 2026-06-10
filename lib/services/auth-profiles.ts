import crypto from "crypto";
import sql from "@/lib/pg";

export type AuthProfileType = "api_key" | "oauth" | "token";

export interface StoredAuthProfile {
  id: string;
  userId: string;
  profileId: string;
  type: AuthProfileType;
  provider: string;
  tokenEncrypted: string;
  tokenRef: string;
  baseUrl?: string;
  models?: string[];
  defaultModel?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PublicAuthProfile {
  profileId: string;
  type: AuthProfileType;
  provider: string;
  tokenRef: string;
  baseUrl?: string;
  models?: string[];
  defaultModel?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface AuthProfileRow {
  id: string;
  userId: string;
  provider: string;
  type: AuthProfileType;
  encryptedApiKey: string | null;
  encryptedOauthToken: string | null;
  tokenRef: string | null;
  baseUrl: string | null;
  models: string[] | null;
  defaultModel: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

const ENV_MAP: Record<string, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  google: "GOOGLE_GENERATIVE_AI_API_KEY",
  github: "GITHUB_TOKEN",
  "github-copilot": "GITHUB_TOKEN",
  openrouter: "OPENROUTER_API_KEY",
  xai: "XAI_API_KEY",
  mistral: "MISTRAL_API_KEY",
  groq: "GROQ_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  cohere: "COHERE_API_KEY",
  cloudflare: "CLOUDFLARE_API_KEY",
  fireworks: "FIREWORKS_API_KEY",
  perplexity: "PERPLEXITY_API_KEY",
  together: "TOGETHER_API_KEY",
  nebius: "NEBIUS_API_KEY",
  akash: "AKASH_API_KEY",
  replicate: "REPLICATE_API_KEY",
  minimax: "MINIMAX_API_KEY",
  qwen: "DASHSCOPE_API_KEY",
  dashscope: "DASHSCOPE_API_KEY",
  tavily: "TAVILY_API_KEY",
  vercel: "VERCEL_TOKEN",
  netlify: "NETLIFY_TOKEN",
  maton: "MATON_API_KEY",
};

function encryptionKey() {
  const secret =
    process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "operon-development-secret";
  return crypto.createHash("sha256").update(secret).digest();
}

function encryptToken(token: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

function decryptToken(value: string) {
  if (!value.startsWith("v1:")) return value;
  const [, ivRaw, tagRaw, encryptedRaw] = value.split(":");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivRaw, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function tokenRefFor(token: string) {
  if (token.length <= 10) return `${token.slice(0, 2)}...${token.slice(-2)}`;
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

function readTokenFromRow(row: AuthProfileRow): string | null {
  if (row.type === "oauth") return row.encryptedOauthToken;
  return row.encryptedApiKey ?? row.encryptedOauthToken;
}

function rowToStored(row: AuthProfileRow): StoredAuthProfile {
  const encrypted = readTokenFromRow(row) ?? "";
  return {
    id: row.id,
    userId: row.userId,
    profileId: `${row.provider}:${row.type}`,
    type: row.type,
    provider: row.provider,
    tokenEncrypted: encrypted,
    tokenRef: row.tokenRef ?? "",
    baseUrl: row.baseUrl ?? undefined,
    models: row.models ?? undefined,
    defaultModel: row.defaultModel ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toPublic(profile: StoredAuthProfile): PublicAuthProfile {
  return {
    profileId: profile.profileId,
    type: profile.type,
    provider: profile.provider,
    tokenRef: profile.tokenRef,
    baseUrl: profile.baseUrl,
    models: profile.models,
    defaultModel: profile.defaultModel,
    metadata: profile.metadata,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

const SELECT_COLS = sql`
  id, user_id, provider, type,
  encrypted_api_key, encrypted_oauth_token,
  token_ref, base_url,
  models, default_model, metadata,
  created_at, updated_at
`;

export async function listAuthProfiles(userId: string): Promise<PublicAuthProfile[]> {
  const rows = await sql<AuthProfileRow[]>`
    select ${SELECT_COLS}
    from auth_profiles
    where user_id = ${userId}
    order by updated_at desc
  `;
  return rows.map(rowToStored).map(toPublic);
}

export async function getAuthProfile(
  userId: string,
  provider: string,
  type?: AuthProfileType,
): Promise<PublicAuthProfile | null> {
  const rows = type
    ? await sql<AuthProfileRow[]>`
        select ${SELECT_COLS}
        from auth_profiles
        where user_id = ${userId} and provider = ${provider} and type = ${type}
        limit 1
      `
    : await sql<AuthProfileRow[]>`
        select ${SELECT_COLS}
        from auth_profiles
        where user_id = ${userId} and provider = ${provider}
        order by updated_at desc
        limit 1
      `;
  const row = rows[0];
  return row ? toPublic(rowToStored(row)) : null;
}

export async function upsertAuthProfile({
  userId,
  provider,
  type = "api_key",
  token,
  baseUrl,
  models,
  defaultModel,
  metadata,
}: {
  userId: string;
  provider: string;
  type?: AuthProfileType;
  token: string;
  baseUrl?: string;
  models?: string[];
  defaultModel?: string;
  metadata?: Record<string, unknown>;
}): Promise<PublicAuthProfile | null> {
  const encrypted = encryptToken(token);
  const ref = tokenRefFor(token);

  // Insert with both possible token columns; the conflict update writes only the column that matches the type.
  const apiKeyValue = type === "oauth" ? null : encrypted;
  const oauthValue = type === "oauth" ? encrypted : null;

  const [row] = await sql<AuthProfileRow[]>`
    insert into auth_profiles (
      id, user_id, provider, type,
      encrypted_api_key, encrypted_oauth_token,
      token_ref, base_url,
      models, default_model, metadata
    ) values (
      ${crypto.randomUUID()},
      ${userId},
      ${provider},
      ${type},
      ${apiKeyValue},
      ${oauthValue},
      ${ref},
      ${baseUrl ?? null},
      ${sql.json((models ?? []) as never)},
      ${defaultModel ?? null},
      ${sql.json((metadata ?? {}) as never)}
    )
    on conflict (user_id, provider, type) do update set
      encrypted_api_key     = case when excluded.type = 'oauth' then auth_profiles.encrypted_api_key     else excluded.encrypted_api_key     end,
      encrypted_oauth_token = case when excluded.type = 'oauth' then excluded.encrypted_oauth_token     else auth_profiles.encrypted_oauth_token end,
      token_ref             = excluded.token_ref,
      base_url              = coalesce(excluded.base_url, auth_profiles.base_url),
      models                = case when jsonb_array_length(excluded.models) > 0 then excluded.models else auth_profiles.models end,
      default_model         = coalesce(excluded.default_model, auth_profiles.default_model),
      metadata              = auth_profiles.metadata || excluded.metadata,
      updated_at            = now()
    returning ${SELECT_COLS}
  `;
  return row ? toPublic(rowToStored(row)) : null;
}

export async function removeAuthProfile(userId: string, profileId: string): Promise<void> {
  const [provider, type] = profileId.split(":");
  await sql`
    delete from auth_profiles
    where user_id = ${userId} and provider = ${provider} and type = ${type ?? "api_key"}
  `;
}

export async function updateAuthProfileModels(
  userId: string,
  provider: string,
  models: string[],
  defaultModel?: string,
): Promise<PublicAuthProfile | null> {
  const [row] = await sql<AuthProfileRow[]>`
    update auth_profiles
    set models        = ${sql.json(models)},
        default_model = coalesce(${defaultModel ?? null}, default_model),
        updated_at    = now()
    where user_id = ${userId} and provider = ${provider}
    returning ${SELECT_COLS}
  `;
  return row ? toPublic(rowToStored(row)) : null;
}

export async function resolveProviderKey(
  provider: string,
  userId?: string,
): Promise<string | undefined> {
  if (userId) {
    const [row] = await sql<AuthProfileRow[]>`
      select ${SELECT_COLS}
      from auth_profiles
      where user_id = ${userId} and provider = ${provider}
      order by updated_at desc
      limit 1
    `;
    const encrypted = row ? readTokenFromRow(row) : null;
    if (encrypted) return decryptToken(encrypted);
  }
  const envKey = ENV_MAP[provider];
  return envKey ? process.env[envKey] : undefined;
}

export async function resolveProviderBaseUrl(
  provider: string,
  userId?: string,
): Promise<string | undefined> {
  if (!userId) return undefined;
  const [row] = await sql<{ baseUrl: string | null }[]>`
    select base_url
    from auth_profiles
    where user_id = ${userId} and provider = ${provider}
    order by updated_at desc
    limit 1
  `;
  return row?.baseUrl ?? undefined;
}

export async function getMostRecentModelProfile(
  userId: string,
): Promise<PublicAuthProfile | null> {
  const [row] = await sql<AuthProfileRow[]>`
    select ${SELECT_COLS}
    from auth_profiles
    where user_id = ${userId}
      and jsonb_typeof(models) = 'array'
      and jsonb_array_length(models) > 0
    order by updated_at desc
    limit 1
  `;
  return row ? toPublic(rowToStored(row)) : null;
}
