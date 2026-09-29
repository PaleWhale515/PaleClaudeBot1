# Wyrmhold

A mobile-first, Torn-style text RPG: survive a dragon war college, win a
wyrm's bond, and choose your life. Runs on Cloudflare Workers + D1.

- **Design:** [`docs/DESIGN.md`](docs/DESIGN.md)
- **AI art prompts:** [`docs/ART_PROMPTS.md`](docs/ART_PROMPTS.md)

## What's in the prototype

- Accounts (username + password, 18+ confirmation), unique character names
- Energy / Nerve / Health bars that refill in real time
- Training, four jobs, six real-time courses, six Night Errands
- Year One Act I: six story chapters with d20 checks, ending at the Claiming
- Four companions with Affection, talk cooldowns, and fade-to-black romance arcs
- Player duels, a leaderboard, and an event feed
- Patron's Seal store screen (payments not live yet)

## Project layout

```
public/            the game client (plain HTML/CSS/JS, no build step)
  art.js           drawn SVG scenes and portraits
  art/             drop AI images here + list them in manifest.json
src/
  worker.js        API routes, auth, persistence
  engine.js        pure game rules (bars, checks, actions, duels)
  auth.js          PBKDF2 passwords, session tokens
  content/story.js all story chapters and companions
migrations/        D1 schema
test/              rules + story-graph tests
```

## Run locally

```bash
npm install
npm run dev        # applies the schema locally, serves http://localhost:8787
npm test
```

## Deploy (Cloudflare)

The D1 database `wyrmhold` already exists in your Cloudflare account and has
the schema applied; its id is in `wrangler.jsonc`.

**Easiest: connect the GitHub repo in the Cloudflare dashboard**

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Import a repository**.
2. Pick the GitHub repo. If the game still lives inside `PaleClaudeBot1`, set
   **Root directory** to `wyrmhold` and pick the branch with the game on it.
3. Build command: *(leave empty)*. Deploy command: `npx wrangler deploy`.
4. Deploy. You get a `*.workers.dev` URL; add a custom domain later under
   the Worker's **Settings → Domains & Routes**.

Every push to that branch redeploys automatically.

**Or from a terminal:** `npx wrangler login && npm run deploy`.

### Secrets (optional)

- `ADMIN_TOKEN`: enables `POST /api/admin/patron` for granting Seals by hand
  while payments are off. Set with `npx wrangler secret put ADMIN_TOKEN`.
- `STRIPE_SECRET_KEY`: set when Stripe Checkout is wired up.

## Adding AI art

1. Generate images with the prompts in `docs/ART_PROMPTS.md`.
2. Save them in `public/art/` with the listed filenames (`gate.jpg`, `dax.jpg`, ...).
3. Add each filename to `public/art/manifest.json`. The game uses them in
   place of the drawn scenes automatically.
