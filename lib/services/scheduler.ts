import sql from "@/lib/pg";
import type { ScheduledJob } from "@/lib/types";

export interface StoredScheduledJob extends ScheduledJob {
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface JobRow {
  id: string;
  userId: string;
  kind: string;
  schedule: string;
  payload: {
    description?: string;
    status?: ScheduledJob["status"];
  } | null;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function fromRow(row: JobRow): StoredScheduledJob {
  const payload = row.payload ?? {};
  return {
    id: row.id,
    userId: row.userId,
    description: payload.description ?? "",
    cron: row.schedule,
    lastRunAt: row.lastRunAt?.toISOString(),
    nextRunAt: row.nextRunAt?.toISOString(),
    status: payload.status ?? "active",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listJobs(userId: string) {
  const rows = await sql<JobRow[]>`
    select id, user_id, kind, schedule, payload, last_run_at, next_run_at, created_at, updated_at
    from jobs
    where user_id = ${userId}
    order by created_at desc
  `;
  return rows.map(fromRow);
}

export async function createJob(
  userId: string,
  input: Omit<ScheduledJob, "id" | "status"> & { status?: ScheduledJob["status"] },
) {
  const id = crypto.randomUUID();
  const payload = { description: input.description, status: input.status ?? "active" };
  const [row] = await sql<JobRow[]>`
    insert into jobs (id, user_id, kind, schedule, payload, last_run_at, next_run_at)
    values (
      ${id},
      ${userId},
      ${"scheduled"},
      ${input.cron},
      ${sql.json(payload as never)},
      ${input.lastRunAt ?? null},
      ${input.nextRunAt ?? null}
    )
    returning id, user_id, kind, schedule, payload, last_run_at, next_run_at, created_at, updated_at
  `;
  return fromRow(row);
}

export async function updateJob(userId: string, id: string, patch: Partial<Omit<ScheduledJob, "id">>) {
  const payloadDelta: Record<string, unknown> = {};
  if (patch.description !== undefined) payloadDelta.description = patch.description;
  if (patch.status !== undefined) payloadDelta.status = patch.status;

  const [row] = await sql<JobRow[]>`
    update jobs
    set
      schedule    = coalesce(${patch.cron ?? null}, schedule),
      last_run_at = coalesce(${patch.lastRunAt ?? null}::timestamptz, last_run_at),
      next_run_at = coalesce(${patch.nextRunAt ?? null}::timestamptz, next_run_at),
      payload     = payload || ${sql.json(payloadDelta as never)}::jsonb,
      updated_at  = now()
    where user_id = ${userId} and id = ${id}
    returning id, user_id, kind, schedule, payload, last_run_at, next_run_at, created_at, updated_at
  `;
  return row ? fromRow(row) : null;
}

export async function deleteJob(userId: string, id: string) {
  const result = await sql`
    delete from jobs where user_id = ${userId} and id = ${id}
  `;
  return { deletedCount: result.count };
}
