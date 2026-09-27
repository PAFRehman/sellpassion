import type { SpinDb } from "./db";
import { getDb, inTransaction } from "./db";
import { getSheetConfig } from "./config";

type OutboxRow = {
  id: number;
  revision: number;
  event_type: string;
  payload: Record<string, unknown>;
};

export async function queueSheetSync(
  sql: SpinDb,
  eventType: "spin_user" | "spin_win",
  dedupeKey: string,
  payload: Record<string, unknown>,
) {
  await sql`
    insert into spin_sheet_outbox (event_type, dedupe_key, payload)
    values (${eventType}, ${dedupeKey}, ${JSON.stringify(payload)}::jsonb)
    on conflict (dedupe_key) do update set
      payload = excluded.payload,
      revision = spin_sheet_outbox.revision + 1,
      delivered_at = null,
      next_attempt_at = now(),
      locked_until = null,
      updated_at = now()
  `;
}

async function claimOutboxRows(limit: number) {
  return inTransaction(async (sql) => {
    const rows = await sql<OutboxRow[]>`
      select id, revision, event_type, payload
      from spin_sheet_outbox
      where delivered_at is null
        and next_attempt_at <= now()
        and (locked_until is null or locked_until < now())
      order by id
      limit ${limit}
      for update skip locked
    `;
    if (rows.length) {
      await sql`
        update spin_sheet_outbox
        set locked_until = now() + interval '2 minutes', updated_at = now()
        where id in ${sql(rows.map((row) => row.id))}
      `;
    }
    return rows;
  });
}

async function deliver(row: OutboxRow, endpoint: string, token: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        source: "bunny-hood-spin-v1",
        eventType: row.event_type,
        webhookToken: token,
        ...row.payload,
      }),
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({})) as { ok?: boolean };
    if (!response.ok || !result.ok) throw new Error("Sheet webhook rejected the event.");
    const sql = getDb();
    await sql`
      update spin_sheet_outbox
      set delivered_at = now(), locked_until = null, updated_at = now()
      where id = ${row.id} and revision = ${row.revision}
    `;
  } catch {
    const sql = getDb();
    await sql`
      update spin_sheet_outbox
      set attempts = attempts + 1,
          next_attempt_at = now() + (least(3600, power(2, least(attempts + 1, 10))) * interval '1 second'),
          locked_until = null,
          last_error = 'Delivery failed',
          updated_at = now()
      where id = ${row.id} and revision = ${row.revision}
    `;
  } finally {
    clearTimeout(timeout);
  }
}

export async function flushSheetOutbox(limit = 12) {
  const config = getSheetConfig();
  if (!config) return;
  const rows = await claimOutboxRows(limit);
  for (const row of rows) await deliver(row, config.url, config.token);
}
