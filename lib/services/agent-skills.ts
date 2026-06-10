import sql from "@/lib/pg";

/**
 * Agent skills — Hermes-style procedural memory.
 *
 * A "skill" is a named, re-runnable recipe consisting of:
 *  - a human description ("Deploy a Next.js app to Vercel with Supabase auth"),
 *  - a sequence of tool invocations the agent should follow,
 *  - tag/keyword metadata so the planner can recall it from a natural-language hint,
 *  - usage stats so we can promote successful recipes and demote failing ones.
 *
 * Skills are stored per-user (privacy default). Sharing happens later via an
 * opt-in `share_slug`. The agent recalls skills by similarity and presents the
 * best candidate before executing the steps.
 */

export interface AgentSkillStep {
  /** Tool name to call, e.g. "github_create_branch". */
  tool: string;
  /** JSON-serialisable arguments. May include placeholders like `{{owner}}`. */
  args: Record<string, unknown>;
  /** Optional human note describing what this step accomplishes. */
  note?: string;
}

export interface AgentSkill {
  id: string;
  userId: string;
  name: string;
  description: string;
  tags: string[];
  steps: AgentSkillStep[];
  trigger: string;
  invocationCount: number;
  successCount: number;
  failureCount: number;
  lastUsedAt: string | null;
  shareSlug: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AgentSkillRow {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  trigger: string | null;
  tags: string[] | null;
  steps: AgentSkillStep[] | null;
  invocationCount: number;
  successCount: number;
  failureCount: number;
  lastUsedAt: Date | null;
  shareSlug: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function fromRow(row: AgentSkillRow): AgentSkill {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description ?? "",
    tags: row.tags ?? [],
    steps: row.steps ?? [],
    trigger: row.trigger ?? row.description ?? "",
    invocationCount: row.invocationCount,
    successCount: row.successCount,
    failureCount: row.failureCount,
    lastUsedAt: row.lastUsedAt ? row.lastUsedAt.toISOString() : null,
    shareSlug: row.shareSlug,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listAgentSkills(userId: string): Promise<AgentSkill[]> {
  const rows = await sql<AgentSkillRow[]>`
    select id, user_id, name, description, trigger, tags, steps,
           invocation_count, success_count, failure_count,
           last_used_at, null::text as share_slug,
           created_at, updated_at
    from agent_skills
    where user_id = ${userId}
    order by updated_at desc
    limit 200
  `;
  return rows.map(fromRow);
}

export async function searchAgentSkills(
  userId: string,
  query: string,
  limit = 8,
): Promise<AgentSkill[]> {
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3);
  if (tokens.length === 0) return listAgentSkills(userId);

  const pattern = `%${tokens.join("%")}%`;
  const rows = await sql<AgentSkillRow[]>`
    select id, user_id, name, description, trigger, tags, steps,
           invocation_count, success_count, failure_count,
           last_used_at, null::text as share_slug,
           created_at, updated_at
    from agent_skills
    where user_id = ${userId}
      and (
        lower(name) like ${pattern}
        or lower(coalesce(description, '')) like ${pattern}
        or lower(coalesce(trigger, '')) like ${pattern}
        or tags && ${tokens}::text[]
      )
    order by invocation_count desc, updated_at desc
    limit ${limit}
  `;
  return rows.map(fromRow);
}

export async function saveAgentSkill(
  userId: string,
  input: {
    name: string;
    description: string;
    steps: AgentSkillStep[];
    tags?: string[];
    trigger?: string;
  },
): Promise<AgentSkill> {
  const id = crypto.randomUUID();
  const [row] = await sql<AgentSkillRow[]>`
    insert into agent_skills (
      id, user_id, name, description, trigger, tags, steps
    ) values (
      ${id},
      ${userId},
      ${input.name},
      ${input.description},
      ${input.trigger ?? input.description},
      ${input.tags ?? []}::text[],
      ${sql.json(input.steps as never)}
    )
    on conflict (user_id, name) do update set
      description = excluded.description,
      trigger     = excluded.trigger,
      tags        = excluded.tags,
      steps       = excluded.steps,
      updated_at  = now()
    returning id, user_id, name, description, trigger, tags, steps,
              invocation_count, success_count, failure_count,
              last_used_at, null::text as share_slug,
              created_at, updated_at
  `;
  return fromRow(row);
}

export async function recordAgentSkillRun(
  userId: string,
  name: string,
  outcome: "success" | "failure",
): Promise<void> {
  if (outcome === "success") {
    await sql`
      update agent_skills
      set invocation_count = invocation_count + 1,
          success_count    = success_count + 1,
          last_used_at     = now()
      where user_id = ${userId} and name = ${name}
    `;
  } else {
    await sql`
      update agent_skills
      set invocation_count = invocation_count + 1,
          failure_count    = failure_count + 1,
          last_used_at     = now()
      where user_id = ${userId} and name = ${name}
    `;
  }
}

export async function deleteAgentSkill(userId: string, name: string): Promise<boolean> {
  const result = await sql`
    delete from agent_skills where user_id = ${userId} and name = ${name}
  `;
  return result.count === 1;
}
