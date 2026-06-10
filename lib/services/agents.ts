import sql from "@/lib/pg";
import type { Agent } from "@/lib/types";

export interface StoredAgent extends Agent {
  userId: string;
  updatedAt: string;
}

interface AgentRow {
  id: string;
  userId: string;
  name: string;
  description: string;
  systemPrompt: string;
  tools: string[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function fromRow(row: AgentRow): StoredAgent {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description,
    systemPrompt: row.systemPrompt,
    tools: row.tools ?? [],
    enabled: row.enabled,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listAgents(userId: string) {
  const rows = await sql<AgentRow[]>`
    select id, user_id, name, description, system_prompt, tools, enabled, created_at, updated_at
    from agents
    where user_id = ${userId}
    order by created_at desc
  `;
  return rows.map(fromRow);
}

export async function createAgent(userId: string, input: Omit<Agent, "id" | "createdAt">) {
  const id = crypto.randomUUID();
  const [row] = await sql<AgentRow[]>`
    insert into agents (id, user_id, name, description, system_prompt, tools, enabled)
    values (
      ${id},
      ${userId},
      ${input.name},
      ${input.description ?? ""},
      ${input.systemPrompt ?? ""},
      ${input.tools ?? []},
      ${input.enabled !== false}
    )
    returning id, user_id, name, description, system_prompt, tools, enabled, created_at, updated_at
  `;
  return fromRow(row);
}

export async function updateAgent(userId: string, id: string, patch: Partial<Omit<Agent, "id">>) {
  const [row] = await sql<AgentRow[]>`
    update agents
    set
      name          = coalesce(${patch.name ?? null}, name),
      description   = coalesce(${patch.description ?? null}, description),
      system_prompt = coalesce(${patch.systemPrompt ?? null}, system_prompt),
      tools         = coalesce(${patch.tools ?? null}::text[], tools),
      enabled       = coalesce(${patch.enabled ?? null}::boolean, enabled),
      updated_at    = now()
    where user_id = ${userId} and id = ${id}
    returning id, user_id, name, description, system_prompt, tools, enabled, created_at, updated_at
  `;
  return row ? fromRow(row) : null;
}

export async function deleteAgent(userId: string, id: string) {
  const result = await sql`
    delete from agents where user_id = ${userId} and id = ${id}
  `;
  return { deletedCount: result.count };
}
