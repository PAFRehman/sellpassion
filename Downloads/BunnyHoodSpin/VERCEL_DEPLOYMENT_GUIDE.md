# Bunny Hood — easy Vercel deployment guide

The public rewards page is `/SpinTheWheel`. Old `/getWL` and `/whitelist` links automatically redirect to it.

## 1. Install the database

1. Open [Vercel Dashboard](https://vercel.com/dashboard), choose `bunnyhood`, then open **Storage**.
2. Add a Neon Postgres database and connect it to the project.
3. Open **Neon Console → SQL Editor**.
4. For a new installation, run all of `db/migrations/001_spin_wheel.sql` once.
5. If the earlier wheel database is already installed, run only `db/migrations/002_click_task_timer.sql` once.

The database is the authoritative source for accounts, points, spins, task timers, code redemptions, wins, and locked wallets.

## 2. Configure X Connect

In the [X Developer Console](https://console.x.com/), configure an OAuth 2.0 Web App with:

```text
Website URL: https://www.bunnyhood.xyz
Callback URL: https://www.bunnyhood.xyz/api/spin/auth/x/callback
Scopes: tweet.read users.read
```

Task completion does not use X API verification. X Connect is used to identify and restore the user account; each task opens the campaign post, waits five seconds, and awards once.

Rotate any credentials that were previously shared in chat. Use only newly generated values in Vercel.

## 3. Configure Google Sheets

1. In the existing Sheet, select **Extensions → Apps Script**.
2. Replace the script with `google-apps-script/Code.gs` from this package.
3. In **Project Settings → Script Properties**, add `BUNNY_HOOD_WEBHOOK_TOKEN` with a long private random value.
4. Select **Deploy → Manage deployments → Edit → New version → Deploy**.
5. Copy the private URL ending in `/exec`.

The browser never receives the Sheet editor URL, Apps Script URL, or webhook token.

## 4. Generate private values

In Windows Command Prompt:

```cmd
cd /d "%USERPROFILE%\Downloads\BunnyHood"
npm install
npm run generate:secrets
node scripts\hash-admin-password.mjs "YOUR-STRONG-ADMIN-PASSWORD"
```

Save the generated values privately. Do not put them in GitHub.

## 5. Add Vercel environment variables

Open **Vercel → bunnyhood → Settings → Environment Variables** and add these to Production and Preview:

```text
APP_URL=https://www.bunnyhood.xyz
DATABASE_URL=<provided by Neon>
X_CLIENT_ID=<new X OAuth Client ID>
X_CLIENT_SECRET=<new X OAuth Client Secret>
X_REDIRECT_URI=https://www.bunnyhood.xyz/api/spin/auth/x/callback
TOKEN_ENCRYPTION_KEY=<generated value>
CODE_PEPPER=<generated value>
PRIZE_RANDOM_SECRET=<generated value>
RATE_LIMIT_SECRET=<generated value>
ADMIN_SESSION_SECRET=<generated value>
ADMIN_PASSWORD_HASH=<generated scrypt hash>
CRON_SECRET=<generated value>
GOOGLE_SHEETS_WEBHOOK_URL=<private Apps Script /exec URL>
GOOGLE_SHEETS_WEBHOOK_TOKEN=<same Apps Script property value>
```

Never prefix a private variable with `NEXT_PUBLIC_`.

## 6. Upload and deploy

From Windows Command Prompt in the extracted folder:

```cmd
cd /d "%USERPROFILE%\Downloads\BunnyHood"
git add .
git commit -m "Replace Get WL with Spin the Wheel"
git push origin main
```

Vercel deploys the GitHub push automatically. If this is the first deployment, import the repository at [vercel.com/new](https://vercel.com/new), keep the detected Next.js defaults, and click **Deploy**.

## 7. Publish a daily campaign

1. Open `https://www.bunnyhood.xyz/admin/spin`.
2. Sign in with the admin password.
3. Paste the new X post URL, add the daily redeem code, choose the end time, and publish.
4. Users can immediately complete the three five-second tasks and redeem the new code.

## 8. Test

1. Open `https://www.bunnyhood.xyz/SpinTheWheel`.
2. Connect X.
3. Click a task and confirm X opens.
4. Confirm the button counts down and adds exactly one spin after five seconds.
5. Reload during a timer and confirm it resumes.
6. Redeem the code and confirm 10–20 spins are added once.
7. Confirm stats appear in `Spin Users` and wins appear in `Spin Wins`.

Task timers are enforced by the server and protected against repeat claims. Because there is no X interaction lookup, the timer confirms the click-and-wait flow—not the actual like, repost, or comment.
