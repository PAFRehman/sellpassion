# PassionHouse

**A public home where ideas find builders, support and a path to becoming real.**

I wanted to build a platform for a simple situation: I may have a valuable idea but not the skills, team or money to build it. Somewhere else, a capable developer, designer or operator may want to build something meaningful but does not have the right idea.

PassionHouse brings those people together.

An idea owner can explain what should exist. Builders can discover it, understand the deeper plan and offer their skills. Readers can improve it through discussion, tip useful thinking or back the next milestone. If the project earns enough proof, the creator can make a clear grant or investor ask.

PassionHouse takes **0% equity**.

Social feeds produce attention but little commitment, while project tools assume a team already exists. PassionHouse connects the missing journey:

**Share → understand → trust → support → build → fund → deliver**

## What the MVP demonstrates

### Share at the right size

Users can publish three kinds of public content:

- **Post:** a quick thought, question, update or request.
- **Idea:** a structured opportunity that other people can help build.
- **Article:** long-form thinking, research, lessons or strategy.

Posting stays simple. Funding is intentionally handled later, after the idea has one clear next milestone.

### A feed designed for reading

Posts, ideas and articles look different instead of repeating one heavy card. The feed includes dedicated channels, search, filters, reactions, discussion, tips, builder interest, media and a floating create button.

### Full-screen idea reader

Opening an idea or article uses the complete screen instead of a narrow side panel. It brings together the creator, readable numbered sections, media, validation, required skills, access, funding progress, support actions and discussion.

Paid or trusted access now reveals real additional sections instead of only changing a label.

### Creator-controlled idea access

Every idea can use one of four modes:

1. **Public** — everyone can read every written section.
2. **Trust** — builders above the creator’s credibility threshold unlock the Builder Kit free.
3. **Paid** — readers choose a one-time project access plan.
4. **Hybrid** — qualify through trust or use the paid path.

The project layers are:

- **Context:** public problem, thesis and opportunity.
- **Builder Kit:** product workflow, validation, requirements and builder brief.
- **Execution Room:** roadmap, commercial direction, risks and protected materials.

Demo prices are `$19` for the Builder Kit and `$49` for the Execution Room. Creator requests auto-approve in this MVP so the full flow can be tested instantly.

### Tip anyone

Readers can send a simulated `$5`, `$10`, `$25` or `$50` tip to:

- a useful post;
- a complete idea;
- an article;
- an individual builder profile;
- or a developer actively building a project.

Ideas can also be backed specifically rather than tipped generally. No real payment is processed in the MVP.

### Funding that is easier to understand

Support has three clear sizes:

1. **Tip useful work** — small appreciation with no pitch required.
2. **Back one milestone** — support a prototype, pilot, audit or launch target.
3. **Fund the project** — a PassionHouse grant or investor raise for a validated idea.

Every serious funding ask answers five questions:

- How much is needed?
- What becomes true if it is funded?
- What will the money pay for?
- What proof already exists?
- How long will the milestone take?

Funding remains attached to the public idea, its creator and its progress.

### Builders can move from interest to work

- Mark an idea with **I can help**
- See the exact roles and commitment needed
- Unlock the Builder Kit through trust or payment
- Send a scoped contribution proposal
- Agree on scope, budget, timeline and ownership
- Open a private deal room after acceptance
- Track chat, documents and milestones

### Identity and credibility

- Demo X sign-in and persona switching
- Search people, skills, roles and social handles
- Human and NFT/Web3 identities
- Connected X, LinkedIn, GitHub, Instagram and websites
- Credibility from identity, execution, community and responsiveness
- Trust-based access powered by the visible credibility score

## Demo walkthrough

1. Continue with X as Maya Chen.
2. Scroll the mixed feed and compare a Post, Idea and Article.
3. Open an idea to enter the full-screen reader.
4. Open Nightjar and unlock its Builder Kit using Maya’s trust score.
5. Open ChainCred and test the paid access flow.
6. Tip an article, back Loopline’s milestone and tip a builder profile.
7. Publish a new idea and choose Public, Trust, Paid or Hybrid access.
8. Open Funding and create one clear milestone, grant or investor ask.
9. Offer to help build an idea, then inspect proposals and the deal room.

## Technology

Next.js 15, React 19, strict TypeScript, Tailwind CSS 4, Radix/shadcn, Lucide and Sonner. The seed includes more than 20 ideas, posts and articles, ten profiles, all four access modes, funding asks, proposals and an active deal room.

The demo stores data locally behind a repository adapter. Supabase, Postgres, object storage, real authentication and payment services can replace it without rewriting the main product views.

## Run locally

Requires Node.js 20 or newer.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

Validate everything:

```bash
npm run check
```

## Deploy to Vercel

1. Push the repository to GitHub.
2. Import it with the Next.js framework preset.
3. Keep the repository root as the Root Directory.
4. Leave Build and Install commands at their defaults.
5. Deploy; the MVP requires no environment variables.

The included `vercel.json` clears a stale custom Output Directory and prevents the earlier `No Output Directory named "output"` failure.

## MVP boundaries

- X OAuth, social metrics and credibility verification are simulated.
- Tips, access purchases and funding are demo transactions only.
- Uploaded media stays in local browser storage and should remain small.
- Client-side demo authentication is not production security.
- Protected access is demonstrated in the UI, not enforced by a server.
- Never enter real secrets, card data or confidential project documents.

## Production direction

1. Real X OAuth, verified socials and transparent reputation events
2. Postgres/Supabase with server-enforced access permissions
3. Creator pricing, Stripe/crypto checkout and revenue settlement
4. Tip balances, milestone escrow and refund rules
5. Personalized discovery and semantic builder matching
6. Versioned ideas, build logs and supporter updates
7. Investor data rooms, e-signatures and milestone approvals
8. Notifications, moderation and anti-spam systems

## Long-term vision

PassionHouse can become the network around the earliest stage of creation.

Someone should be able to arrive with only a thought, explain it clearly, meet a person who can build it, earn public support, protect the sensitive parts, fund one real milestone and leave with a working project. Builders gain a stream of meaningful opportunities. Creators keep ownership. Supporters can participate before an idea becomes obvious.

That is the house: ideas enter as words and leave with people behind them.

## License

Private project. All rights reserved.
