# 🏔️ Colorado Family Picks

A community map where Colorado families share and discover the best local activities.

## Features
- 🗺️ Community map of all public spots
- 👤 Personal pages (e.g. `yoursite.com/james`)  
- 🔒 Per-spot privacy: public or private
- 📝 Notes with their own public/private toggle
- 🏷️ Categories: Hiking, Swimming, Skiing, Camping, Wildlife, Museums, Attractions, Family Dining

---

## Setup (one-time, ~15 minutes)

### 1. Supabase — Database & Auth (free)

1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a name and region (US West is close to Colorado)
3. Once created, go to **SQL Editor → New Query**
4. Paste the entire contents of `supabase/schema.sql` and click **Run**
5. Go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon` / `public` key

### 2. Local setup

```bash
# Clone / download this project, then:
npm install

# Copy the env file and fill it in
cp .env.local.example .env.local
# Open .env.local and paste your Supabase URL and anon key

# Run locally to test
npm run dev
# Open http://localhost:3000
```

### 3. Deploy to Vercel (free)

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → Add New Project → import your repo
3. In Vercel project settings → **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon key
4. Click **Deploy** — Vercel gives you a URL like `yourproject.vercel.app`
5. Buy a domain (Namecheap, Google Domains ~$12/yr) and point it to Vercel in their dashboard

---

## Costs

| Service | Cost |
|---------|------|
| Vercel  | Free (Hobby tier) |
| Supabase | Free (up to 50,000 users) |
| Domain name | ~$10–15/year |

---

## Project structure

```
app/
  page.js           → Community map homepage
  login/page.js     → Login
  signup/page.js    → Sign up
  dashboard/page.js → User's private spot manager
  [username]/page.js→ Public profile (e.g. /james)
components/
  Navbar.js         → Navigation bar
  MapClient.js      → Leaflet map (client-only)
  SpotModal.js      → Add / edit spot form
lib/
  supabaseClient.js → Supabase singleton
supabase/
  schema.sql        → Run this in Supabase SQL Editor
```
