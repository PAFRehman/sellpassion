# PassionHouse

**Ideas into motion** — Discover validated ideas, find credible builders, control disclosure and execute together.

## Tech Stack

- **Next.js 15** — React framework
- **React 19** — UI library
- **Tailwind CSS 4** — Styling
- **shadcn/ui** — Component library (Radix UI primitives)
- **TypeScript** — Type safety
- **Sonner** — Toast notifications
- **Lucide React** — Icons

## Getting Started

### Prerequisites

- Node.js >= 18
- npm

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Vercel auto-detects Next.js — no extra configuration needed
4. Deploy!

## Project Structure

```
app/
  layout.tsx       — Root layout
  page.tsx         — Home page (renders PassionHouseApp)
  globals.css      — Global styles & design tokens
components/
  passionhouse-app.tsx  — Main application component
  ui/              — shadcn UI components
lib/
  passionhouse-types.ts      — TypeScript types
  passionhouse-demo.ts       — Demo data
  passionhouse-repository.ts — Local storage persistence
  utils.ts         — Utility functions
hooks/
  use-mobile.ts    — Mobile breakpoint hook
public/
  favicon.svg      — App icon
```

## Features

- **Discover** — Browse and filter validated startup ideas
- **Access Control** — Request tiered access to idea details
- **Proposals** — Send and receive collaboration proposals
- **Deal Rooms** — Structured collaboration spaces with milestones
- **Credibility Scores** — Trust-based profile system
- **Local Auth** — Client-side demo authentication

## License

Private project.
