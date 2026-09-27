# Bunny Hood Spin the Wheel — exact setup

The wheel is at `/SpinTheWheel`. The private campaign page is at `/admin/spin`.

## 1. Rotate the exposed X credentials first

The credentials previously pasted into chat must be treated as compromised. Open [X Developer Console](https://console.x.com/), revoke/regenerate the old API key and secret, bearer token, Client ID, and Client Secret, and never reuse the pasted values.

This website uses only a new OAuth 2.0 **Client ID** and **Client Secret**. It does not need the old consumer key or bearer token.

In the X app:

1. Enable OAuth 2.0.
2. Select **Web App** so the app is a confidential client.
3. Set the website URL to `https://www.bunnyhood.xyz`.
4. Add this exact callback URL:

```text
https://www.bunnyhood.xyz/api/spin/auth/x/callback
```

5. Save the newly generated Client ID and Client Secret privately.

The app requests only `tweet.read` and `users.read`. X requires an exact callback match. X is used to identify the connected account once; task completion does not call the X API.

## 2. Add PostgreSQL through Vercel

1. Open [Vercel Dashboard](https://vercel.com/dashboard) and select the `bunnyhood` project.
2. Open **Storage**.
3. Choose **Create Database / Marketplace Database**.
4. Install [Neon Postgres](https://vercel.com/marketplace/neon) and connect it to the Bunny Hood project.
5. Confirm Vercel created a server-only `DATABASE_URL` environment variable.
6. From Vercel Storage, select **Open in Neon Console → SQL Editor**.
7. Open `db/migrations/001_spin_wheel.sql` from this project, copy the complete file, paste it into the SQL Editor, and click **Run** once.

If you already installed the earlier Spin the Wheel database, do not rerun everything. Run `db/migrations/002_click_task_timer.sql` once instead.

The database is the authoritative record for users, points, spins, tasks, code redemptions, prize slots, wins, and locked wallets. Google Sheets is a protected readable mirror, not the transaction database.

## 3. Update Google Apps Script

1. Open the existing Bunny Hood Google Sheet.
2. Select **Extensions → Apps Script**.
3. Replace the old script with the complete contents of `google-apps-script/Code.gs`.
4. Open **Project Settings → Script Properties**.
5. Keep or add:

```text
BUNNY_HOOD_WEBHOOK_TOKEN = your-private-random-token
```

6. Select **Deploy → Manage deployments → Edit → New version → Deploy**.
7. Keep the `/exec` URL private.

The script maintains `Spin Users` and `Spin Wins` for the wheel. It may leave an existing historical `Whitelist` tab untouched. Wallets, spins used, spins remaining, points, and win totals are updated by stable IDs. A saved winner wallet cannot be replaced.

## 4. Generate private values on Windows

Open Command Prompt in the extracted project folder:

```cmd
cd /d "%USERPROFILE%\Downloads\BunnyHood"
npm install
npm run generate:secrets
```

Copy the six generated lines to a temporary private note. Do not commit them.

Generate the admin password hash:

```cmd
node scripts\hash-admin-password.mjs "PUT-A-STRONG-ADMIN-PASSWORD-HERE"
```

Copy the single `scrypt$...` result. The plain password is what you will enter at `/admin/spin`; only its hash goes into Vercel.

## 5. Add Vercel environment variables

Open **Vercel → bunnyhood → Settings → Environment Variables**. Add each value to Production and Preview:

```text
APP_URL=https://www.bunnyhood.xyz
DATABASE_URL=<automatically supplied by Neon>
X_CLIENT_ID=<new rotated OAuth 2.0 Client ID>
X_CLIENT_SECRET=<new rotated OAuth 2.0 Client Secret>
X_REDIRECT_URI=https://www.bunnyhood.xyz/api/spin/auth/x/callback
TOKEN_ENCRYPTION_KEY=<generated value>
CODE_PEPPER=<generated value>
PRIZE_RANDOM_SECRET=<generated value>
RATE_LIMIT_SECRET=<generated value>
ADMIN_SESSION_SECRET=<generated value>
ADMIN_PASSWORD_HASH=<generated scrypt value>
CRON_SECRET=<generated value>
GOOGLE_SHEETS_WEBHOOK_URL=<private Apps Script /exec URL>
GOOGLE_SHEETS_WEBHOOK_TOKEN=<same token as Apps Script property>
```

None of these names may start with `NEXT_PUBLIC_`.

## 6. Deploy and test

Push the updated source to the existing GitHub repository. Vercel will deploy automatically. Environment variable changes also require a redeployment.

1. Open `https://www.bunnyhood.xyz/SpinTheWheel`.
2. Connect a test X account.
3. Open `https://www.bunnyhood.xyz/admin/spin` and sign in with the admin password.
4. Paste the complete campaign post URL, enter a fresh code, and click **Publish and reset eligibility**.
5. With the test user, click each task. The post opens and each task automatically adds one spin after the server-enforced five-second timer.
6. Redeem the code and confirm it awards 10–20 spins.
7. Spin and confirm the balance changes exactly once per click.
8. Confirm `Spin Users` updates in Google Sheets. A `Spin Wins` row appears when a prize is won, and the later wallet submission updates the same row.

## Rules implemented

- Every new admin campaign creates a fresh version, so all connected users can complete the three tasks and redeem the new code again.
- Clicking each Like, Repost, and Comment task starts a server-backed five-second timer, then awards 1 spin and 1 point once per campaign.
- Task completion makes no X API verification request. It records the click and wait; it does not prove that the user completed the interaction on X.
- The code awards 10–20 spins using server cryptographic randomness and can be used once per campaign per X ID.
- The daily UTC inventory is exactly 15 GTD, 20 FCFS1, and 30 FCFS2 slots, released in hidden randomized windows throughout the day.
- A user can win at most three times for the lifetime of the account.
- Every win needs a different EVM wallet. Wallet uniqueness is enforced across all winners, and a submitted wallet is immutable.
- X tokens are encrypted at rest. Campaign codes are one-way hashed. Google URLs and tokens remain server-only. Raw IP addresses are not stored.
- No internet system is literally unbeatable; this implementation closes duplicate, replay, race-condition, exposed-secret, wallet-edit, and client-side-tampering paths. Multi-account abuse still requires operational review and, if needed, extra identity or account-age rules.
