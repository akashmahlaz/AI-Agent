import sql from "@/lib/pg";
import { builtInSkills } from "@/lib/skills";
import type { Skill } from "@/lib/types";

export interface StoredSkill extends Skill {
  userId: string;
  updatedAt: string;
}

interface SkillRow {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  payload: {
    slug?: string;
    category?: Skill["category"];
    enabled?: boolean;
    installed?: boolean;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

function fromRow(row: SkillRow): StoredSkill | null {
  const slug = row.payload?.slug;
  if (!slug) return null;
  const base = builtInSkills.find((skill) => skill.slug === slug);
  return {
    id: base?.id ?? row.id,
    slug,
    name: base?.name ?? row.name,
    description: base?.description ?? row.description ?? "",
    category: row.payload?.category ?? base?.category ?? "automation",
    enabled: row.payload?.enabled ?? base?.enabled ?? true,
    installed: row.payload?.installed ?? true,
    userId: row.userId,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listSkills(userId: string) {
  const rows = await sql<SkillRow[]>`
    select id, user_id, name, description, payload, created_at, updated_at
    from skills
    where user_id = ${userId}
  `;
  const bySlug = new Map<string, StoredSkill>();
  for (const row of rows) {
    const stored = fromRow(row);
    if (stored) bySlug.set(stored.slug, stored);
  }
  return builtInSkills.map((skill) => bySlug.get(skill.slug) ?? skill);
}

export async function setSkillEnabled(userId: string, slug: string, enabled: boolean) {
  const base = builtInSkills.find((skill) => skill.slug === slug);
  if (!base) return null;

  const payload = {
    slug,
    category: base.category,
    enabled,
    installed: true,
  };

  const [row] = await sql<SkillRow[]>`
    insert into skills (id, user_id, name, description, payload)
    values (${crypto.randomUUID()}, ${userId}, ${base.name}, ${base.description}, ${sql.json(payload)})
    on conflict (user_id, (payload->>'slug'))
    do update set
      name        = excluded.name,
      description = excluded.description,
      payload     = skills.payload || excluded.payload,
      updated_at  = now()
    returning id, user_id, name, description, payload, created_at, updated_at
  `;
  return fromRow(row);
}
