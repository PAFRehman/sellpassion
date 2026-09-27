import { randomUUID } from "node:crypto";
import type { SpinUser } from "./auth";
import type { SpinDb } from "./db";
import { getDb, inTransaction } from "./db";
import { HttpError } from "./http";
import { enforceRateLimit } from "./rate-limit";
import { hashRedeemCode } from "./security";
import { queueSheetSync } from "./sheets";

export type TaskType = "like" | "repost" | "comment";

export type CampaignRow = {
  id: string;
  title: string;
  tweet_id: string;
  tweet_url: string;
  starts_at: Date | string;
  ends_at: Date | string;
  created_at: Date | string;
};

type TaskStartRow = {
  started_at: Date | string;
  ready_at: Date | string;
  ready?: boolean;
};

export function extractTweetId(tweetUrl: string) {
  const match = tweetUrl.trim().match(/^https:\/\/(?:www\.)?(?:x|twitter)\.com\/[A-Za-z0-9_]{1,15}\/status\/(\d{5,25})(?:[/?#].*)?$/i);
  if (!match) throw new HttpError(400, "Enter a complete X post URL.", "BAD_TWEET_URL");
  return match[1];
}

export async function getActiveCampaign(sql: SpinDb = getDb()) {
  const rows = await sql<CampaignRow[]>`
    select id, title, tweet_id, tweet_url, starts_at, ends_at, created_at
    from spin_campaigns
    where active = true and starts_at <= now() and ends_at > now()
    order by created_at desc
    limit 1
  `;
  return rows[0] ?? null;
}

export async function startCampaignTask(user: SpinUser, task: TaskType) {
  const sql = getDb();
  await enforceRateLimit(`task-start:${user.id}`, 15, 60, sql);
  const campaign = await getActiveCampaign(sql);
  if (!campaign) throw new HttpError(404, "No campaign is active right now.", "NO_CAMPAIGN");

  const existing = await sql<{ id: string }[]>`
    select id from spin_task_claims
    where user_id = ${user.id}::uuid and campaign_id = ${campaign.id}::uuid and task_type = ${task}
    limit 1
  `;
  if (existing[0]) {
    return {
      task,
      alreadyClaimed: true,
      tweetUrl: campaign.tweet_url,
      readyAt: new Date().toISOString(),
    };
  }

  return inTransaction(async (transaction) => {
    await transaction`select pg_advisory_xact_lock_shared(hashtext('bunny-hood-active-campaign'))`;
    const liveCampaign = await transaction<{ active: boolean }[]>`
      select active from spin_campaigns
      where id = ${campaign.id}::uuid and active = true and starts_at <= now() and ends_at > now()
    `;
    if (!liveCampaign[0]) {
      throw new HttpError(409, "The campaign changed. Refresh and open the new tasks.", "CAMPAIGN_CHANGED");
    }
    const inserted = await transaction<TaskStartRow[]>`
      insert into spin_task_starts (id, user_id, campaign_id, task_type)
      values (${randomUUID()}, ${user.id}::uuid, ${campaign.id}::uuid, ${task})
      on conflict (user_id, campaign_id, task_type) do nothing
      returning started_at, started_at + interval '5 seconds' as ready_at
    `;
    const starts = inserted[0] ? inserted : await transaction<TaskStartRow[]>`
      select started_at, started_at + interval '5 seconds' as ready_at
      from spin_task_starts
      where user_id = ${user.id}::uuid
        and campaign_id = ${campaign.id}::uuid
        and task_type = ${task}
      limit 1
    `;
    const start = starts[0];
    if (!start) throw new HttpError(500, "The task timer could not start.", "TASK_START_FAILED");
    return {
      task,
      alreadyClaimed: false,
      tweetUrl: campaign.tweet_url,
      startedAt: new Date(start.started_at).toISOString(),
      readyAt: new Date(start.ready_at).toISOString(),
    };
  });
}

export async function claimCampaignTask(user: SpinUser, task: TaskType) {
  const sql = getDb();
  await enforceRateLimit(`task-claim:${user.id}`, 15, 60, sql);
  const campaign = await getActiveCampaign(sql);
  if (!campaign) throw new HttpError(404, "No campaign is active right now.", "NO_CAMPAIGN");

  return inTransaction(async (transaction) => {
    await transaction`select pg_advisory_xact_lock_shared(hashtext('bunny-hood-active-campaign'))`;
    const liveCampaign = await transaction<{ active: boolean }[]>`
      select active from spin_campaigns
      where id = ${campaign.id}::uuid and active = true and starts_at <= now() and ends_at > now()
    `;
    if (!liveCampaign[0]) {
      throw new HttpError(409, "The campaign changed. Refresh and open the new tasks.", "CAMPAIGN_CHANGED");
    }
    await transaction`select id from spin_users where id = ${user.id}::uuid for update`;
    const existing = await transaction<{ id: string }[]>`
      select id from spin_task_claims
      where user_id = ${user.id}::uuid and campaign_id = ${campaign.id}::uuid and task_type = ${task}
      limit 1
    `;
    if (existing[0]) return { task, alreadyClaimed: true, spinsAwarded: 0 };

    const starts = await transaction<TaskStartRow[]>`
      select started_at,
        started_at + interval '5 seconds' as ready_at,
        now() >= started_at + interval '5 seconds' as ready
      from spin_task_starts
      where user_id = ${user.id}::uuid
        and campaign_id = ${campaign.id}::uuid
        and task_type = ${task}
      limit 1
      for update
    `;
    const start = starts[0];
    if (!start) {
      throw new HttpError(409, "Open the task first to start its five-second timer.", "TASK_NOT_STARTED");
    }
    if (!start.ready) {
      throw new HttpError(409, "Please wait for the five-second task timer to finish.", "TASK_TIMER_ACTIVE");
    }

    const inserted = await transaction<{ id: string }[]>`
      insert into spin_task_claims (id, user_id, campaign_id, task_type, awarded_spins)
      values (${randomUUID()}, ${user.id}::uuid, ${campaign.id}::uuid, ${task}, 1)
      on conflict (user_id, campaign_id, task_type) do nothing
      returning id
    `;
    if (!inserted[0]) return { task, alreadyClaimed: true, spinsAwarded: 0 };

    const updated = await transaction<{ spins_available: number; points: number }[]>`
      update spin_users
      set spins_available = spins_available + 1,
          points = points + 1,
          updated_at = now()
      where id = ${user.id}::uuid
      returning spins_available, points
    `;
    await queueSheetSync(transaction, "spin_user", `user:${user.id}`, {
      userId: user.id,
      xUserId: user.xUserId,
      xUsername: user.xUsername,
      xName: user.xName,
      spinsAvailable: Number(updated[0].spins_available),
      points: Number(updated[0].points),
      updatedAt: new Date().toISOString(),
    });
    return {
      task,
      alreadyClaimed: false,
      spinsAwarded: 1,
      spinsAvailable: Number(updated[0].spins_available),
      points: Number(updated[0].points),
    };
  });
}

export async function publishCampaign(input: {
  title: string;
  tweetUrl: string;
  redeemCode: string;
  endsAt?: string;
}) {
  const title = input.title.trim().slice(0, 80) || "Bunny Hood Daily Drop";
  const tweetUrl = input.tweetUrl.trim();
  const tweetId = extractTweetId(tweetUrl);
  const code = input.redeemCode.trim();
  if (code.length < 4 || code.length > 64) {
    throw new HttpError(400, "Redeem code must be 4–64 characters.", "BAD_CODE");
  }
  const end = input.endsAt ? new Date(input.endsAt) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (!Number.isFinite(end.getTime()) || end.getTime() <= Date.now() + 5 * 60_000) {
    throw new HttpError(400, "Campaign end time must be at least five minutes from now.", "BAD_END_TIME");
  }
  const campaignId = randomUUID();
  return inTransaction(async (sql) => {
    await sql`select pg_advisory_xact_lock(hashtext('bunny-hood-active-campaign'))`;
    await sql`update spin_campaigns set active = false where active = true`;
    const rows = await sql<CampaignRow[]>`
      insert into spin_campaigns (
        id, title, tweet_id, tweet_url, code_hash, starts_at, ends_at, active
      ) values (
        ${campaignId}, ${title}, ${tweetId}, ${tweetUrl},
        ${hashRedeemCode(campaignId, code)}, now(), ${end.toISOString()}::timestamptz, true
      )
      returning id, title, tweet_id, tweet_url, starts_at, ends_at, created_at
    `;
    return rows[0];
  });
}
