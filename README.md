# Akorfa (monorepo)

This repository contains an initial scaffold for the Akorfa platform (web + mobile + supabase + shared packages).

Contents
- `shared/`: TypeScript shared package with scoring logic and unit tests.
- `web/`: Next.js 15 App Router scaffold (TypeScript + Tailwind) with basic auth, assessment and stability UIs.
- `mobile/`: minimal Expo TypeScript app scaffold.
- `supabase/migrations/`: SQL migrations (initial schema + auth/RLS templates).

Quickstart (local)

1. Install dependencies from repo root:

```bash
npm install
```

2. Build and test the shared package (required so web server imports work):

```bash
cd shared
npm install
npm run build
npm run test
```

3. Run the web app:

```bash
cd ../web
npm install
cp .env.local.example .env.local
# Fill in SUPABASE keys in .env.local
npm run dev
```

4. Optional: Run mobile app (requires Expo CLI / EAS):

```bash
cd ../mobile
npm install
npm start
```

Applying Supabase migrations

- Use the Supabase dashboard SQL editor or Supabase CLI to apply files in `supabase/migrations/`.
- Ensure you add `SUPABASE_SERVICE_ROLE_KEY` to `web/.env.local` for server-side writes (keep secret).

Notes
- API routes use the `@akorfa/shared` scoring module. Build `shared` before running the web server.
- For production, store secrets securely and avoid committing `.env` files.
