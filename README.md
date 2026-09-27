# PassionHouse

**The public network where thoughts become teams, funding and real projects.**

PassionHouse combines an X-style idea feed, credible social identity, controlled project access, funding discovery and private execution. A user can share one casual sentence or publish a complete venture thesis, then find the people and capital needed to move it forward.

The platform takes **0% equity**.

## Why it exists

The internet has many places to post and many tools to manage established teams, but very little infrastructure between those moments. Promising ideas lose momentum because:

- useful thoughts are buried by attention-driven feeds;
- creators cannot quickly distinguish credible collaborators from noise;
- sensitive plans are either exposed too early or hidden too completely;
- funding requests are detached from visible proof and community response;
- replies, DMs, proposals, terms and delivery live in separate tools.

PassionHouse creates one continuous path:

**Post → signal → trust → access → funding/proposal → deal room → delivery**

## What this MVP includes

### A social feed for ideas of every size

- Quick posts for questions, updates, observations and casual asks
- Full ideas with overview, complete plan, proof, media and collaborators needed
- “For you,” Ideas, Quick posts and Latest feed channels
- Search, sector/stage filters and signal-based ranking
- Likes, dislikes, comments and builder-interest signals
- Image and video uploads in the browser demo
- Floating `+` composer available while scrolling

All content is public by default. A full idea can be completely open or use a public preview with protected project material.

### Tiered and paid project access

Each full idea supports three plans:

1. **Context** — public research and problem framing; free
2. **Build Plan** — workflow, validation and build priorities; demo price `$19`
3. **Full Project** — commercial plan, private media and execution material; demo price `$49`

Two access paths are demonstrated:

- **Request access:** creator-review flow that auto-approves Full Project access in the MVP.
- **Instant access:** tier selection, order summary, simulated card checkout and immediate unlock.

No real payment is processed. Pricing is seeded only to demonstrate the product and upgrade flow.

### Funding before or after collaboration

Creators can pitch:

- verified investors;
- the PassionHouse project fund;
- or both audiences together.

A funding pitch records the amount, milestone, use of funds and review status. The Funding channel shows open opportunities, creator submissions, funded examples and investor-interest signals.

### Trust-aware people discovery

- Demo X sign-in and persona switching
- Searchable people, skills, roles and social handles
- Human and NFT/Web3-style identities
- Connected X, LinkedIn, GitHub, Instagram and website profiles
- Credibility based on identity, execution, community and responsiveness
- Direct social/contact routes from public profiles

### Collaboration and execution

- Structured contribution proposals
- Scope, timeline, budget and outcome terms
- Proposal acceptance that opens a private deal room
- Chat, milestones, documents and agreement summary
- Explicit ownership language and 0% platform equity

## Demo data

The seed includes 20 full ideas and quick posts across AI, Web3, climate, health, fintech, civic technology, creator economy, education and the future of work. It also includes ten varied profiles, funding pitches, access records, proposals, comments and an active deal room.

Suggested walkthrough:

1. Continue with X as Maya Chen or choose a Web3 persona.
2. Switch between Ideas and Quick posts in Discover.
3. Open a fully public idea and a protected-preview idea.
4. Choose **Request access** to test automatic MVP approval.
5. Reopen access and test the paid Build Plan or Full Project checkout.
6. Open Funding, inspect opportunities and submit a creator pitch.
7. Search people and inspect connected socials and credibility.
8. Review proposals and use the active Nightjar deal room.
9. Use the floating `+` button to publish a quick post or complete idea.

## Design

The interface carries the HoodX visual language into a friendlier product system:

- black and graphite foundation with restrained blue/pink signal accents;
- star field, orbital lines, binary fragments and meteor motion;
- lightweight glass surfaces and high-contrast actions;
- custom cursor, scroll progress and reduced-motion support;
- responsive feed, sheets, dialogs and mobile navigation;
- illustrated human and Web3/NFT profile avatars.

## Stack

- Next.js 15 App Router
- React 19 + strict TypeScript
- Tailwind CSS 4
- Radix/shadcn primitives
- Lucide icons + Sonner notifications
- Versioned browser-local repository

## Project structure

```text
app/                               route, metadata and global design system
components/passionhouse-shell.tsx  application state and flow orchestration
components/passionhouse/
  discovery.tsx                    feed, posts and idea detail
  composer-dialogs.tsx             quick/full composer and access checkout
  funding.tsx                      funding channel and pitch flow
  collaboration-views.tsx          requests, proposals and deal rooms
  people-views.tsx                 people, profiles and demo auth
  passionhouse-ui.tsx              shared product primitives
lib/
  passionhouse-types.ts            typed domain model
  passionhouse-demo.ts             compact seeded MVP data
  passionhouse-repository.ts       replaceable local persistence adapter
public/avatars/                    original illustrated profile art
public/media/                      project demo media
```

The UI never writes to `localStorage` directly. The repository adapter can later be replaced by Supabase/Postgres and server APIs without rewriting the product views.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

Validate the complete project:

```bash
npm run check
```

## Deploy to Vercel

1. Push the repository to GitHub.
2. Import it into Vercel with the **Next.js** framework preset.
3. Keep Root Directory at the repository root.
4. Leave Build Command and Install Command overrides disabled.
5. Deploy. No environment variables are required for this MVP.

The included `vercel.json` pins the Next.js preset and clears any stale custom Output Directory. This prevents the previous `No Output Directory named "output"` failure. If the dashboard still shows an Output Directory override, switch it off and redeploy without the build cache.

## Demo boundaries

- X OAuth, social metrics, investor interest and payments are simulated.
- Uploaded media is stored as local browser data and should remain small.
- Local passwords are demo-only client-side hashes, not production authentication.
- Deal-room documents store metadata only.
- There is no server authorization, object storage, payment settlement or escrow yet.
- Do not use real secrets, financial details or confidential project files.

## Production path

1. Real X OAuth and verified social connections
2. Postgres/Supabase, object storage and server-enforced tier permissions
3. Creator-defined pricing, Stripe/crypto checkout and revenue settlement
4. Transparent credibility, anti-gaming and verified work outcomes
5. Semantic matching, notifications and personalized feeds
6. E-signatures, escrow, milestone approvals and durable deal-room chat

## The long-term opportunity

PassionHouse is not merely another place to post startup concepts. It can become the coordination layer between public intent and committed work.

Every successful project improves the network: ideas gain evidence, people gain portable proof, investors see momentum in context, and future teams form with less uncertainty. If PassionHouse closes that loop, an ordinary post can become a trusted collaboration without losing its energy—or its creator—between disconnected platforms.

## License

Private project. All rights reserved.
