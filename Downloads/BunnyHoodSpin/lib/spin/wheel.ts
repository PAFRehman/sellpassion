import { createHmac, randomInt, randomUUID } from "node:crypto";
import type { SpinUser } from "./auth";
import type { CampaignRow } from "./campaigns";
import { getActiveCampaign } from "./campaigns";
import type { SpinDb } from "./db";
import { getDb, inTransaction } from "./db";
import { HttpError } from "./http";
import { enforceRateLimit } from "./rate-limit";
import { hashRedeemCode, normalizeRedeemCode, safeEqual } from "./security";
import { requireStrongSecret } from "./config";
import { queueSheetSync } from "./sheets";

export type PrizeType = "GTD" | "FCFS1" | "FCFS2";

const DAILY_PRIZES: Array<{ type: PrizeType; count: number }> = [
  { type: "GTD", count: 15 },
  { type: "FCFS1", count: 20 },
  { type: "FCFS2", count: 30 },
];

type LockedUser = {
  id: string;
  x_user_id: string;
  x_username: string;
  x_name: string;
  spins_available: number;
  spins_used: number;
  points: number;
  total_wins: number;
};

type PrizeSlot = {
  id: string;
  prize_type: PrizeType;
  attempts: number;
  claim_after: number;
};

type SpinResponse = {
  eventId: string;
  result: PrizeType | "NONE";
  spinsLeft: number;
  spinsUsed: number;
  totalWins: number;
  winId?: string;
};

function utcPrizeDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function deterministicNumber(day: string, index: number, label: string) {
  const bytes = createHmac("sha256", requireStrongSecret("PRIZE_RANDOM_SECRET"))
    .update(`${day}:${label}:${index}`)
    .digest();
  return bytes.readUInt32BE(0) / 0x1_0000_0000;
}

export async function ensureDailyPrizeSlots(sql: SpinDb, day = utcPrizeDay()) {
  const exists = await sql<{ count: number }[]>`
    select count(*)::int as count from spin_prize_slots where prize_day = ${day}::date
  `;
  if (Number(exists[0]?.count ?? 0) === 65) return;

  const types = DAILY_PRIZES.flatMap((item) =>
    Array.from({ length: item.count }, (_, index) => ({
      type: item.type,
      score: deterministicNumber(day, index, `shuffle:${item.type}`),
    })),
  ).sort((left, right) => left.score - right.score).map((item) => item.type);

  const start = Date.parse(`${day}T00:00:00.000Z`);
  const bucketSize = 86_400_000 / types.length;
  const counters: Record<PrizeType, number> = { GTD: 0, FCFS1: 0, FCFS2: 0 };
  const rows = types.map((type, index) => {
    counters[type] += 1;
    const jitter = deterministicNumber(day, index, "release");
    return {
      id: randomUUID(),
      prizeType: type,
      slotNumber: counters[type],
      releaseAt: new Date(start + (index + jitter) * bucketSize).toISOString(),
      claimAfter: 1 + Math.floor(deterministicNumber(day, index, "claim") * 5),
    };
  });

  await Promise.all(rows.map((row) => sql`
    insert into spin_prize_slots (
      id, prize_day, prize_type, slot_number, release_at, claim_after
    ) values (
      ${row.id}, ${day}::date, ${row.prizeType}, ${row.slotNumber},
      ${row.releaseAt}::timestamptz, ${row.claimAfter}
    )
    on conflict (prize_day, prize_type, slot_number) do nothing
  `));
}

export async function redeemCampaignCode(user: SpinUser, rawCode: string) {
  const code = normalizeRedeemCode(rawCode);
  if (code.length < 4 || code.length > 64) {
    throw new HttpError(400, "Enter the current Bunny Hood code.", "BAD_CODE");
  }
  const sql = getDb();
  await enforceRateLimit(`redeem:${user.id}`, 8, 10 * 60, sql);
  const campaigns = await sql<(CampaignRow & { code_hash: string })[]>`
    select id, title, tweet_id, tweet_url, starts_at, ends_at, created_at, code_hash
    from spin_campaigns
    where active = true and starts_at <= now() and ends_at > now()
    order by created_at desc
    limit 1
  `;
  const campaign = campaigns[0];
  if (!campaign) throw new HttpError(404, "No campaign is active right now.", "NO_CAMPAIGN");
  const submittedHash = hashRedeemCode(campaign.id, code);
  if (!safeEqual(submittedHash, campaign.code_hash)) {
    throw new HttpError(400, "That code is not valid for the current campaign.", "INVALID_CODE");
  }

  return inTransaction(async (transaction) => {
    await transaction`select pg_advisory_xact_lock_shared(hashtext('bunny-hood-active-campaign'))`;
    const liveCampaign = await transaction<{ active: boolean; code_hash: string }[]>`
      select active, code_hash from spin_campaigns
      where id = ${campaign.id}::uuid and active = true and starts_at <= now() and ends_at > now()
    `;
    if (!liveCampaign[0] || !safeEqual(submittedHash, liveCampaign[0].code_hash)) {
      throw new HttpError(409, "The campaign changed. Refresh and use the new code.", "CAMPAIGN_CHANGED");
    }
    await transaction`select id from spin_users where id = ${user.id}::uuid for update`;
    const existing = await transaction<{ awarded_spins: number }[]>`
      select awarded_spins from spin_code_redemptions
      where user_id = ${user.id}::uuid and campaign_id = ${campaign.id}::uuid
      limit 1
    `;
    if (existing[0]) {
      throw new HttpError(409, "You already redeemed this campaign code.", "CODE_ALREADY_REDEEMED");
    }
    const awarded = randomInt(10, 21);
    await transaction`
      insert into spin_code_redemptions (id, user_id, campaign_id, awarded_spins)
      values (${randomUUID()}, ${user.id}::uuid, ${campaign.id}::uuid, ${awarded})
    `;
    const updated = await transaction<LockedUser[]>`
      update spin_users
      set spins_available = spins_available + ${awarded}, updated_at = now()
      where id = ${user.id}::uuid
      returning id, x_user_id, x_username, x_name, spins_available, spins_used, points, total_wins
    `;
    await queueSheetSync(transaction, "spin_user", `user:${user.id}`, userSheetPayload(updated[0]));
    return { awardedSpins: awarded, spinsAvailable: Number(updated[0].spins_available) };
  });
}

function userSheetPayload(user: LockedUser) {
  return {
    userId: user.id,
    xUserId: user.x_user_id,
    xUsername: user.x_username,
    xName: user.x_name,
    spinsAvailable: Number(user.spins_available),
    spinsUsed: Number(user.spins_used),
    points: Number(user.points),
    totalWins: Number(user.total_wins),
    updatedAt: new Date().toISOString(),
  };
}

export async function playSpin(user: SpinUser, idempotencyKey: string): Promise<SpinResponse> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    throw new HttpError(400, "Invalid spin request. Refresh and try again.", "BAD_IDEMPOTENCY_KEY");
  }
  const database = getDb();
  await enforceRateLimit(`spin:${user.id}`, 35, 60, database);
  const day = utcPrizeDay();

  return inTransaction(async (sql) => {
    await ensureDailyPrizeSlots(sql, day);
    const locked = await sql<LockedUser[]>`
      select id, x_user_id, x_username, x_name, spins_available, spins_used, points, total_wins
      from spin_users where id = ${user.id}::uuid for update
    `;
    const current = locked[0];
    if (!current) throw new HttpError(401, "Connect X to continue.", "AUTH_REQUIRED");

    const duplicate = await sql<{ response: SpinResponse }[]>`
      select response from spin_events
      where user_id = ${user.id}::uuid and idempotency_key = ${idempotencyKey}
      limit 1
    `;
    if (duplicate[0]) return duplicate[0].response;
    if (Number(current.spins_available) < 1) {
      throw new HttpError(409, "You do not have a spin available.", "NO_SPINS");
    }
    if (Number(current.total_wins) >= 3) {
      throw new HttpError(409, "You reached the maximum of three Bunny Hood wins.", "WIN_LIMIT_REACHED");
    }

    const eventId = randomUUID();
    const slotRows = await sql<PrizeSlot[]>`
      select id, prize_type, attempts, claim_after
      from spin_prize_slots
      where prize_day = ${day}::date
        and release_at <= now()
        and winner_user_id is null
      order by release_at, id
      limit 1
      for update skip locked
    `;
    const slot = slotRows[0];
    const shouldWin = Boolean(slot && Number(slot.attempts) + 1 >= Number(slot.claim_after));
    const winId = shouldWin ? randomUUID() : undefined;
    const result: PrizeType | "NONE" = shouldWin ? slot.prize_type : "NONE";
    const nextSpins = Number(current.spins_available) - 1;
    const nextUsed = Number(current.spins_used) + 1;
    const nextWins = Number(current.total_wins) + (shouldWin ? 1 : 0);

    if (slot) {
      await sql`
        update spin_prize_slots
        set attempts = attempts + 1,
            winner_user_id = ${shouldWin ? user.id : null}::uuid,
            spin_event_id = ${shouldWin ? eventId : null}::uuid,
            claimed_at = ${shouldWin ? new Date().toISOString() : null}::timestamptz
        where id = ${slot.id}::uuid
      `;
    }

    if (shouldWin && winId) {
      await sql`
        insert into spin_wins (id, user_id, prize_slot_id, prize_type, won_at)
        values (${winId}, ${user.id}::uuid, ${slot.id}::uuid, ${slot.prize_type}, now())
      `;
    }

    const updatedRows = await sql<LockedUser[]>`
      update spin_users
      set spins_available = spins_available - 1,
          spins_used = spins_used + 1,
          total_wins = total_wins + ${shouldWin ? 1 : 0},
          updated_at = now()
      where id = ${user.id}::uuid
      returning id, x_user_id, x_username, x_name, spins_available, spins_used, points, total_wins
    `;
    const response: SpinResponse = {
      eventId,
      result,
      spinsLeft: nextSpins,
      spinsUsed: nextUsed,
      totalWins: nextWins,
      ...(winId ? { winId } : {}),
    };
    await sql`
      insert into spin_events (
        id, user_id, idempotency_key, result, prize_slot_id, spins_before, spins_after, response
      ) values (
        ${eventId}, ${user.id}::uuid, ${idempotencyKey}, ${result},
        ${shouldWin ? slot.id : null}::uuid, ${current.spins_available}, ${nextSpins}, ${JSON.stringify(response)}::jsonb
      )
    `;
    await queueSheetSync(sql, "spin_user", `user:${user.id}`, userSheetPayload(updatedRows[0]));
    if (shouldWin && winId) {
      await queueSheetSync(sql, "spin_win", `win:${winId}`, {
        winId,
        userId: user.id,
        xUserId: current.x_user_id,
        xUsername: current.x_username,
        xName: current.x_name,
        prizeType: result,
        wonAt: new Date().toISOString(),
        wallet: "",
        walletSubmittedAt: "",
      });
    }
    return response;
  });
}

export async function submitWinWallet(user: SpinUser, winId: string, walletValue: string) {
  const wallet = walletValue.trim();
  if (!/^(?:0x)[a-fA-F0-9]{40}$/.test(wallet)) {
    throw new HttpError(400, "Enter a valid EVM wallet beginning with 0x.", "BAD_WALLET");
  }
  return inTransaction(async (sql) => {
    await sql`select pg_advisory_xact_lock(hashtext(${`winner-wallet:${wallet.toLowerCase()}`}))`;
    const wins = await sql<{
      id: string;
      prize_type: PrizeType;
      won_at: Date | string;
      wallet_address: string | null;
    }[]>`
      select id, prize_type, won_at, wallet_address
      from spin_wins
      where id = ${winId}::uuid and user_id = ${user.id}::uuid
      limit 1
      for update
    `;
    const win = wins[0];
    if (!win) throw new HttpError(404, "Win not found.", "WIN_NOT_FOUND");
    if (win.wallet_address) {
      if (win.wallet_address.toLowerCase() === wallet.toLowerCase()) {
        return { wallet: win.wallet_address, alreadySubmitted: true };
      }
      throw new HttpError(409, "This win already has a locked wallet and cannot be updated.", "WALLET_LOCKED");
    }
    const duplicate = await sql<{ id: string }[]>`
      select id from spin_wins where lower(wallet_address) = lower(${wallet}) limit 1
    `;
    if (duplicate[0]) {
      throw new HttpError(409, "That wallet is already attached to another win.", "WALLET_ALREADY_USED");
    }
    const updated = await sql<{ wallet_address: string; wallet_submitted_at: Date | string }[]>`
      update spin_wins
      set wallet_address = ${wallet}, wallet_submitted_at = now()
      where id = ${win.id}::uuid
      returning wallet_address, wallet_submitted_at
    `;
    await queueSheetSync(sql, "spin_win", `win:${win.id}`, {
      winId: win.id,
      userId: user.id,
      xUserId: user.xUserId,
      xUsername: user.xUsername,
      xName: user.xName,
      prizeType: win.prize_type,
      wonAt: new Date(win.won_at).toISOString(),
      wallet: updated[0].wallet_address,
      walletSubmittedAt: new Date(updated[0].wallet_submitted_at).toISOString(),
    });
    return { wallet: updated[0].wallet_address, alreadySubmitted: false };
  });
}

export async function getWheelState(user: SpinUser | null) {
  const sql = getDb();
  const campaign = await getActiveCampaign(sql);
  const day = utcPrizeDay();
  await ensureDailyPrizeSlots(sql, day);
  const inventory = await sql<{ prize_type: PrizeType; claimed: number; total: number }[]>`
    select prize_type,
      count(*) filter (where winner_user_id is not null)::int as claimed,
      count(*)::int as total
    from spin_prize_slots
    where prize_day = ${day}::date
    group by prize_type
  `;

  if (!user) {
    return { authenticated: false, campaign: publicCampaign(campaign), inventory };
  }
  const currentUsers = await sql<LockedUser[]>`
    select id, x_user_id, x_username, x_name, spins_available, spins_used, points, total_wins
    from spin_users where id = ${user.id}::uuid limit 1
  `;
  const current = currentUsers[0];
  const claims = campaign ? await sql<{ task_type: TaskType }[]>`
    select task_type from spin_task_claims
    where user_id = ${user.id}::uuid and campaign_id = ${campaign.id}::uuid
  ` : [];
  const taskStarts = campaign ? await sql<{ task_type: TaskType; ready_at: Date | string }[]>`
    select task_type, started_at + interval '5 seconds' as ready_at
    from spin_task_starts starts
    where user_id = ${user.id}::uuid
      and campaign_id = ${campaign.id}::uuid
      and not exists (
        select 1 from spin_task_claims claims
        where claims.user_id = starts.user_id
          and claims.campaign_id = starts.campaign_id
          and claims.task_type = starts.task_type
      )
  ` : [];
  const redemptions = campaign ? await sql<{ awarded_spins: number }[]>`
    select awarded_spins from spin_code_redemptions
    where user_id = ${user.id}::uuid and campaign_id = ${campaign.id}::uuid limit 1
  ` : [];
  const wins = await sql<{
    id: string;
    prize_type: PrizeType;
    won_at: Date | string;
    wallet_address: string | null;
    wallet_submitted_at: Date | string | null;
  }[]>`
    select id, prize_type, won_at, wallet_address, wallet_submitted_at
    from spin_wins
    where user_id = ${user.id}::uuid
    order by won_at desc
  `;

  return {
    authenticated: true,
    user: {
      id: current.id,
      xUserId: current.x_user_id,
      xUsername: current.x_username,
      xName: current.x_name,
      spinsAvailable: Number(current.spins_available),
      spinsUsed: Number(current.spins_used),
      points: Number(current.points),
      totalWins: Number(current.total_wins),
    },
    campaign: publicCampaign(campaign),
    claimedTasks: claims.map((claim) => claim.task_type),
    taskStarts: taskStarts.map((start) => ({
      taskType: start.task_type,
      readyAt: new Date(start.ready_at).toISOString(),
    })),
    codeRedemption: redemptions[0] ? { awardedSpins: Number(redemptions[0].awarded_spins) } : null,
    inventory,
    wins: wins.map((win) => ({
      id: win.id,
      prizeType: win.prize_type,
      wonAt: new Date(win.won_at).toISOString(),
      wallet: win.wallet_address,
      walletSubmittedAt: win.wallet_submitted_at ? new Date(win.wallet_submitted_at).toISOString() : null,
    })),
  };
}

function publicCampaign(campaign: CampaignRow | null) {
  return campaign ? {
    id: campaign.id,
    title: campaign.title,
    tweetUrl: campaign.tweet_url,
    startsAt: new Date(campaign.starts_at).toISOString(),
    endsAt: new Date(campaign.ends_at).toISOString(),
  } : null;
}

type TaskType = "like" | "repost" | "comment";

export async function getAdminDashboard() {
  const sql = getDb();
  const day = utcPrizeDay();
  await ensureDailyPrizeSlots(sql, day);
  const campaign = await getActiveCampaign(sql);
  const [totals, inventory, outbox] = await Promise.all([
    sql<{ users: number; spins: number; wins: number; pending_wallets: number }[]>`
      select
        (select count(*)::int from spin_users) as users,
        (select coalesce(sum(spins_used), 0)::int from spin_users) as spins,
        (select count(*)::int from spin_wins) as wins,
        (select count(*)::int from spin_wins where wallet_address is null) as pending_wallets
    `,
    sql<{ prize_type: PrizeType; claimed: number; total: number }[]>`
      select prize_type,
        count(*) filter (where winner_user_id is not null)::int as claimed,
        count(*)::int as total
      from spin_prize_slots where prize_day = ${day}::date group by prize_type
    `,
    sql<{ pending: number }[]>`
      select count(*)::int as pending from spin_sheet_outbox where delivered_at is null
    `,
  ]);
  return {
    campaign: publicCampaign(campaign),
    totals: totals[0],
    inventory,
    sheetSyncPending: Number(outbox[0]?.pending ?? 0),
    prizeDay: day,
  };
}
