# Bunny Hood

Production-ready Next.js website for Bunny Hood on Vercel.

## Routes

- `/` — collection homepage
- `/SpinTheWheel` — X-connected rewards, five-second click tasks, code redemption, wheel, and winner profile
- `/admin/spin` — private campaign control room

Old `/getWL` and `/whitelist` links redirect to `/SpinTheWheel`.

## Spin system

- X OAuth 2.0 PKCE login with encrypted user tokens
- one-click five-second tasks that automatically award 1 spin + 1 point, with no paid X task-verification API calls
- one cryptographically random 10–20 spin code redemption per campaign
- custom username-style referral codes and 3 spins for each newly connected referred X account
- X sharing for referral links, individual wins, and batch results
- private admin-set GTD, FCFS1, and FCFS2 campaign inventories paced across a 20-day campaign
- one 20-day prize pool with fresh daily tweet/code rounds, so daily eligibility resets without resetting inventory
- equal server-side odds per spin with private repeat-win protection and GTD kept as the rarest inventory
- single-spin animation with skip control or idempotent batches of up to 100 spins
- transaction-safe balances and a maximum of three wins per role (nine total) per X account
- one immutable, globally unique EVM wallet per win, with delayed profile submission
- protected Google Sheets mirrors for user stats and winner wallets
- server-side rate limits, origin and CSRF checks, hashed codes, encrypted X tokens, and private admin sessions

## Setup

Follow [SPIN_THE_WHEEL_SETUP.md](SPIN_THE_WHEEL_SETUP.md) before deployment. New installs run migrations `001`, `002`, and `003` in order. Existing wheel installs run `db/migrations/003_referrals_fair_campaigns.sql` after `002`. The required Google Apps Script is in `google-apps-script/Code.gs`.

Run locally:

```bash
npm install
npm run test
npm run dev
```

Never commit `.env.local` or place private values in a variable beginning with `NEXT_PUBLIC_`.
