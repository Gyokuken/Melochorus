# 🎵 Melochorus

> A **democratic music queue** — anyone in the room submits a track, the group votes, and the crowd's favorite plays next on the speaker. No DJ, no arguments.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?logo=postgresql)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwindcss)

Melochorus was built for shared spaces — a lab, a hostel common room, a hackathon floor — where one speaker is playing and everyone has an opinion. Spin up a **room**, share the **code**, and let the group queue and up/down‑vote tracks. The highest‑voted song plays next automatically, and the host can always step in.

> 🔊 **How playback works:** the audio/video plays on the **host machine** (the one wired to the speaker) via an embedded YouTube player. Everyone else uses their phone/laptop as a *remote* — they submit and vote, and see what's now playing. Perfect for a single shared speaker.

---

## Table of contents
- [Features](#-features)
- [How it works](#-how-it-works)
- [Tech stack](#-tech-stack)
- [Getting started](#-getting-started)
- [Environment variables](#-environment-variables)
- [Scripts](#-scripts)
- [Project structure](#-project-structure)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

##  Features

- ** Google sign‑in** — one‑tap auth via NextAuth, real identities, real one‑person‑one‑vote.
- ** Rooms with join codes** — create a room, share a 6‑character code; anyone signed in can join.
- ** Live voting leaderboard** — up/down‑vote tracks; the queue re‑ranks for everyone within seconds (polling, no WebSockets needed).
- ** Auto‑advancing host player** — embeds YouTube, plays the top‑voted track, and advances to the next when each song ends.
- ** Host DJ overrides** — *Play now* (jump to a track immediately) and *Play next* (bump a track to the front, bypassing votes — shows a ⚡ Priority badge to everyone).
- ** Presence** — the host sees **who's joined** with live online dots.
- ** Room lifecycle** — host can **End room**; idle rooms expire after 24h; a daily cron sweeps abandoned ones (no database bloat).
- ** Modern dark UI** — Tailwind + shadcn/ui, violet accent.

---

##  How it works

```
   Phones / laptops (audience)                 Host machine (speaker)
 ┌─────────────────────────────┐           ┌──────────────────────────────┐
 │  /room/<CODE>                │           │  /room/<CODE>/host           │
 │  • paste a YouTube link      │           │  • embedded YouTube player   │
 │  • up/down‑vote the queue    │           │  • auto‑advance on song end  │
 │  • see "Now playing"         │           │  • Play now / Play next      │
 └──────────────┬──────────────┘           │  • "Who's joined" + online   │
                │  poll every ~5s            └───────────────┬──────────────┘
                ▼                                            ▼
        GET /api/streams?roomId=…  ◀────── ranked queue ──────  POST /api/streams/next
                │                                            (host advances)
                ▼
        PostgreSQL (Prisma)  —  Room · RoomMember · Stream · Vote
```

**Vote ranking** uses a denormalized `Stream.score` adjusted atomically on every vote, so the leaderboard is a simple indexed `ORDER BY`. **Priority** (host "Play next") is a `priorityAt` timestamp that sorts ahead of votes. **Presence** rides on the same poll — each request bumps the member's `lastSeenAt`, which powers both the online dots and idle‑room expiry.

---

##  Tech stack

| Layer | Choice |
|------|--------|
| Framework | **Next.js 14** (App Router) + **React 18** |
| Language | **TypeScript** |
| Auth | **NextAuth v4** + Google provider (`@auth/prisma-adapter`, DB sessions) |
| Database | **PostgreSQL** via **Prisma 5** (works great with [Neon](https://neon.tech)) |
| Styling | **Tailwind CSS** + **shadcn/ui** |
| Player | **react-youtube** (YouTube IFrame API) |
| Realtime | Lightweight **polling** (deploy‑anywhere, no WebSocket server) |
| Hosting | **Vercel** (+ Vercel Cron for cleanup) |

---

##  Getting started

### Prerequisites
- **Node.js 18.17+** (LTS recommended)
- A **PostgreSQL** database — [Neon](https://neon.tech) has a free tier and zero install
- A **Google OAuth client** (free, from the [Google Cloud Console](https://console.cloud.google.com))

### 1. Clone & install
```bash
git clone https://github.com/Gyokuken/Melochorus.git
cd Melochorus
npm install
```

### 2. Create your env file
```bash
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
# generate a NextAuth secret:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Fill in `.env` (see [Environment variables](#-environment-variables) below).

### 3. Set up Google OAuth
In the Google Cloud Console → **APIs & Services → Credentials → Create OAuth client ID → Web application**:
- **Authorized JavaScript origin:** `http://localhost:3000`
- **Authorized redirect URI:** `http://localhost:3000/api/auth/callback/google`

On the **OAuth consent screen**, add your Google account as a **Test user** so you can sign in.

### 4. Push the schema & run
```bash
npm run db:push    # creates the tables in your database
npm run dev        # http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000), create a room, and share the code with a friend (or a second browser).

---

##  Environment variables

Copy `.env.example` to `.env` and fill these in. **Never commit `.env`.**

| Variable | Required | Description |
|----------|:--------:|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string. On Neon, use the **pooled** string (`…-pooler…`) and keep `?sslmode=require`. |
| `NEXTAUTH_URL` | ✅ | App base URL — `http://localhost:3000` in dev, your domain in prod. |
| `NEXTAUTH_SECRET` | ✅ | Random string for signing sessions (generate with the command above). |
| `GOOGLE_CLIENT_ID` | ✅ | From your Google OAuth client. |
| `GOOGLE_CLIENT_SECRET` | ✅ | From your Google OAuth client. |
| `CRON_SECRET` | prod | Authorizes the daily room‑cleanup cron. Set it in production; the cron endpoint is disabled unless it's present. |

---

##  Scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run db:push` | Sync `schema.prisma` to the database (no migration files) |
| `npm run db:migrate` | Create + apply a named migration |
| `npm run db:studio` | Open Prisma Studio to browse the DB |

---

##  Project structure

```
app/
  api/
    auth/[...nextauth]/   NextAuth handler
    rooms/                create · join · [code] (context + end) · members
    streams/              queue, vote, next, play, prioritize
    cron/cleanup/         scheduled abandoned-room sweep
  room/[code]/            audience view (page) + host/ (player + members)
  page.tsx                landing — create or join a room
components/
  ui/                     shadcn primitives (button, card, input, avatar)
  room-launcher · room-header · room-client · members-panel
  host-player · submit-form · queue · stream-card · now-playing
hooks/
  use-streams.ts          room-scoped polling + presence heartbeat
lib/
  prisma · auth · rooms · streams · youtube · http · utils
prisma/
  schema.prisma           Room · RoomMember · Stream · Vote + auth models
```

---

##  Deployment

Melochorus deploys cleanly to **Vercel**:

1. Import the GitHub repo into Vercel (Next.js is auto‑detected; the `build` script already runs `prisma generate`).
2. Add the env vars above (use the Neon **pooled** `DATABASE_URL`; set `NEXTAUTH_URL` to your Vercel domain).
3. Add your production domain to the Google OAuth client (origin + `…/api/auth/callback/google`).
4. The `vercel.json` cron triggers `/api/cron/cleanup` daily — set `CRON_SECRET` so it's authorized.

Every push to `main` auto‑deploys.

---

##  Contributing

Contributions are very welcome — issues, ideas, and PRs all help.

1. **Fork** the repo and create a branch: `git checkout -b feat/your-thing`.
2. Make your change. Before opening a PR, make sure both pass:
   ```bash
   npx tsc --noEmit
   npm run lint
   ```
3. Keep PRs focused, with a clear description of *what* and *why*.

**Good to know:**
- Looking for a place to start? Check the [open issues](https://github.com/Gyokuken/Melochorus/issues) — including a request to design the app's logo. 🎨
- **After any change to `prisma/schema.prisma`,** run `npm run db:push` and **fully restart `npm run dev`** — the Prisma client is a singleton that survives hot‑reloads, so a running server keeps the old client until restarted.
- Code style is enforced by ESLint (`next/core-web-vitals`); the project is fully typed — no `any` shortcuts please.

---

## 📄 License

No license file yet. For a community project like this, **MIT** is a friendly choice — until one is added, default copyright applies (others can view but not freely reuse). Add a `LICENSE` file to make contributions clear.

---

<p align="center">Made for tech clubs, hackathons, and anyone who's ever fought over the aux. 🎶</p>
