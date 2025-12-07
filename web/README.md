
# Akorfa Web

Next.js 15 (App Router) scaffold for the Akorfa platform. This folder contains the web UI, API routes, and example pages (assessments, stability, admin, auth).

Environment variables
- Copy `web/.env.local.example` to `web/.env.local` and set values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Local development

```bash
cd web
npm install
# Build shared first (so server imports resolve)
cd ../shared && npm install && npm run build
cd ../web
npm run dev
```

Pages of interest
- `/auth/signup` — create account (Supabase email/password)
- `/auth/login` — sign in
- `/auth/logout` — sign out
- `/assessments` — 7-layer assessment UI
- `/stability` — Stability calculator UI
- `/profile` — view your profile
- `/admin/assessments` — admin view to list/export assessments (publicly readable per MVP RLS)

Notes
- API routes persist to the `assessments` table in Supabase; ensure migrations have been applied.
- Server routes use `SUPABASE_SERVICE_ROLE_KEY` (set in `.env.local`) for writes. Keep it secret.

