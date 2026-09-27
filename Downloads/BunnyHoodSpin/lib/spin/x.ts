import { randomUUID } from "node:crypto";
import { getXConfig } from "./config";
import { getDb } from "./db";
import { HttpError } from "./http";
import { seal } from "./security";
import { queueSheetSync } from "./sheets";

type XTokenReply = {
  token_type: string;
  expires_in: number;
  access_token: string;
  scope: string;
  refresh_token?: string;
};

type XMeReply = {
  data?: {
    id: string;
    name: string;
    username: string;
    created_at?: string;
    profile_image_url?: string;
  };
  errors?: Array<{ detail?: string; title?: string }>;
};

function basicAuthorization(clientId: string, clientSecret: string) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

async function tokenRequest(body: URLSearchParams) {
  const { clientId, clientSecret } = getXConfig();
  const response = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      authorization: basicAuthorization(clientId, clientSecret),
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({})) as Partial<XTokenReply> & { error_description?: string };
  if (!response.ok || !data.access_token || !data.expires_in) {
    throw new HttpError(502, data.error_description || "X authorization could not be completed.", "X_AUTH_FAILED");
  }
  return data as XTokenReply;
}

export async function exchangeAuthorizationCode(code: string, verifier: string) {
  const { clientId, redirectUri } = getXConfig();
  return tokenRequest(new URLSearchParams({
    code,
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  }));
}

export async function fetchXMe(accessToken: string) {
  const response = await fetch(
    "https://api.x.com/2/users/me?user.fields=created_at,profile_image_url",
    { headers: { authorization: `Bearer ${accessToken}` }, cache: "no-store" },
  );
  const data = await response.json().catch(() => ({})) as XMeReply;
  if (!response.ok || !data.data) {
    throw new HttpError(502, data.errors?.[0]?.detail || "X profile could not be loaded.", "X_PROFILE_FAILED");
  }
  return data.data;
}

export async function upsertXUser(profile: XMeReply["data"] & {}, token: XTokenReply) {
  const sql = getDb();
  const id = randomUUID();
  const rows = await sql<{
    id: string;
    x_user_id: string;
    x_username: string;
    x_name: string;
    spins_available: number;
    spins_used: number;
    points: number;
    total_wins: number;
  }[]>`
    insert into spin_users (
      id,
      x_user_id,
      x_username,
      x_name,
      x_profile_image_url,
      x_account_created_at,
      x_access_token_enc,
      x_refresh_token_enc,
      x_token_expires_at
    ) values (
      ${id},
      ${profile.id},
      ${profile.username},
      ${profile.name},
      ${profile.profile_image_url ?? null},
      ${profile.created_at ?? null}::timestamptz,
      ${seal({ token: token.access_token })},
      ${token.refresh_token ? seal({ token: token.refresh_token }) : null},
      ${new Date(Date.now() + token.expires_in * 1000).toISOString()}::timestamptz
    )
    on conflict (x_user_id) do update set
      x_username = excluded.x_username,
      x_name = excluded.x_name,
      x_profile_image_url = excluded.x_profile_image_url,
      x_account_created_at = coalesce(spin_users.x_account_created_at, excluded.x_account_created_at),
      x_access_token_enc = excluded.x_access_token_enc,
      x_refresh_token_enc = coalesce(excluded.x_refresh_token_enc, spin_users.x_refresh_token_enc),
      x_token_expires_at = excluded.x_token_expires_at,
      updated_at = now()
    returning id, x_user_id, x_username, x_name, spins_available, spins_used, points, total_wins
  `;
  const user = rows[0];
  await queueSheetSync(sql, "spin_user", `user:${user.id}`, {
    userId: user.id,
    xUserId: user.x_user_id,
    xUsername: user.x_username,
    xName: user.x_name,
    spinsAvailable: Number(user.spins_available),
    spinsUsed: Number(user.spins_used),
    points: Number(user.points),
    totalWins: Number(user.total_wins),
    updatedAt: new Date().toISOString(),
  });
  return user.id;
}
