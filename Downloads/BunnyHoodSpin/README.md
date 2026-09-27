# Bunny Hood

Production-ready Next.js website for Bunny Hood on Vercel.

## Routes

- `/` — collection homepage
- `/SpinTheWheel` — X-connected rewards, five-second click tasks, code redemption, wheel, and winner profile
- `/admin/spin` — private campaign control room

Old `/getWL` and `/whitelist` links redirect to `/SpinTheWheel`.

## Spin system

- X OAuth 2.0 PKCE login with encrypted user tokens
- 1 spin + 1 point for each five-second click task per campaign, with no X task-verification API calls
- one cryptographically random 10–20 spin code redemption per campaign
- daily inventory of 15 GTD, 20 FCFS1, and 30 FCFS2 prize slots released across the UTC day
- transaction-safe balances, idempotent spins, and a lifetime maximum of three wins per X account
- one immutable, globally unique EVM wallet per win, with delayed profile submission
- protected Google Sheets mirrors for user stats and winner wallets
- server-side rate limits, origin and CSRF checks, hashed codes, encrypted X tokens, and private admin sessions

## Setup

Follow [SPIN_THE_WHEEL_SETUP.md](SPIN_THE_WHEEL_SETUP.md) before deployment. New installs use `db/migrations/001_spin_wheel.sql`; existing wheel installs must also run `db/migrations/002_click_task_timer.sql`. The required Google Apps Script is in `google-apps-script/Code.gs`.

Run locally:

```bash
npm install
npm run test
npm run dev
```

Never commit `.env.local` or place private values in a variable beginning with `NEXT_PUBLIC_`.
