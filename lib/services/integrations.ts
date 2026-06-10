import sql from "@/lib/pg";
import { builtInIntegrations } from "@/lib/integrations";
import type { Integration } from "@/lib/types";

export interface StoredIntegration extends Integration {
  userId: string;
  credentials?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

interface IntegrationRow {
  id: string;
  userId: string;
  provider: string;
  state: {
    connected?: boolean;
    credentials?: Record<string, string>;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

function fromRow(row: IntegrationRow): StoredIntegration | null {
  const base = builtInIntegrations.find((entry) => entry.slug === row.provider);
  if (!base) return null;
  const state = row.state ?? {};
  return {
    ...base,
    userId: row.userId,
    connected: state.connected === true,
    credentials: state.credentials,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listIntegrations(userId: string) {
  const rows = await sql<IntegrationRow[]>`
    select id, user_id, provider, state, created_at, updated_at
    from integrations
    where user_id = ${userId}
  `;
  const bySlug = new Map<string, StoredIntegration>();
  for (const row of rows) {
    const integration = fromRow(row);
    if (integration) bySlug.set(integration.slug, integration);
  }
  return builtInIntegrations.map((integration) => bySlug.get(integration.slug) ?? integration);
}

export async function upsertIntegration(
  userId: string,
  slug: string,
  patch: Partial<Pick<StoredIntegration, "connected" | "credentials">>,
) {
  const base = builtInIntegrations.find((integration) => integration.slug === slug);
  if (!base) return null;

  const stateDelta: Record<string, unknown> = {};
  if (patch.connected !== undefined) stateDelta.connected = patch.connected;
  if (patch.credentials !== undefined) stateDelta.credentials = patch.credentials;

  const [row] = await sql<IntegrationRow[]>`
    insert into integrations (id, user_id, provider, state)
    values (${crypto.randomUUID()}, ${userId}, ${slug}, ${sql.json(stateDelta as never)})
    on conflict (user_id, provider)
    do update set
      state      = integrations.state || excluded.state,
      updated_at = now()
    returning id, user_id, provider, state, created_at, updated_at
  `;
  return fromRow(row);
}
