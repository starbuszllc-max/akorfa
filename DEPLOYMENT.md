# Akorfa Deployment Checklist

Complete this checklist before deploying to production.

## 1. Supabase Setup

- [ ] Create a Supabase project (https://supabase.com)
- [ ] Copy Project URL and anon key from Settings → API
- [ ] Enable email/password authentication in Auth → Providers
- [ ] Set custom email auth redirect URL: `https://yourdomain.com/auth/callback`
- [ ] Configure CORS: Settings → API → CORS allowed origins → add your Vercel domain

## 2. Run Migrations

In your Supabase dashboard SQL Editor, execute these migrations in order:

- [ ] `supabase/migrations/001_schema.sql` — creates profiles and assessments tables
- [ ] `supabase/migrations/002_auth_and_rls.sql` — sets up auth trigger and RLS policies
- [ ] `supabase/migrations/003_social.sql` — creates posts, reactions, comments, user_events tables
- [ ] `supabase/migrations/004_post_triggers.sql` — adds RPC functions for atomic score updates

**Verify migrations:**
```sql
-- Check tables
select table_name from information_schema.tables where table_schema = 'public' order by table_name;

-- Check functions
select proname from pg_proc where pronamespace = (select oid from pg_namespace where nspname = 'public');
```

## 3. Local Build & Test

```bash
# Install all dependencies
npm install

# Build shared package
npm run build:shared

# Run shared tests (should pass)
npm run test:shared

# Build web app
cd web && npm run build && cd ..

# Run dev server locally
cd web && npm run dev
```

**Test all features:**

- [ ] Sign up with a new email
- [ ] Log in and verify profile page loads
- [ ] Create an assessment (all 7 layers)
- [ ] Calculate stability (verify equation works)
- [ ] View feed (refresh to load posts)
- [ ] Create a post (verify post appears in feed)
- [ ] Like a post (verify like count increments and user score increases)
- [ ] Admin page: `/admin/assessments` (should show CSV export button)

## 4. Vercel Deployment

### Via CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

### Via GitHub Integration
1. Push code to GitHub
2. Go to https://vercel.com → Import Project
3. Select your GitHub repository
4. Framework preset: Next.js
5. Set environment variables (see step 5 below)
6. Deploy

## 5. Environment Variables

In Vercel dashboard, set these variables for your production deployment:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (from Settings → API → Service Role Secret) |

**Note:** Only the `NEXT_PUBLIC_*` variables are sent to the browser; others are server-only.

## 6. Post-Deployment Verification

After deployment to Vercel, test these flows on your production domain:

- [ ] Sign up works (check email verification)
- [ ] Login redirects to feed/profile
- [ ] Create assessment and verify score saved to Supabase
- [ ] Create a post and verify it appears for other users
- [ ] Like a post and verify:
  - Like count increments immediately
  - User's akorfa_score in profiles table increases
  - user_events row created with event_type='reaction_given'
- [ ] Admin panel loads with assessment list
- [ ] Check Supabase logs for RLS or function errors

## 7. Production Hardening

- [ ] **Enable HTTPS:** Vercel auto-enables; verify via browser (lock icon in address bar)
- [ ] **Custom domain:** Vercel Dashboard → Domains → add your domain
- [ ] **Database backups:** Supabase Dashboard → Backups → set retention policy
- [ ] **RLS enforcement:** Verify all policies are active (Settings → SQL → Policies)
- [ ] **Rate limiting:** Consider adding middleware to `/api/posts` and `/api/reactions` to prevent abuse
- [ ] **Monitoring:**
  - Monitor Supabase logs: Database → Logs
  - Monitor Vercel logs: Deployments → select deployment → Logs
- [ ] **Secrets rotation:** Schedule regular rotation of Supabase API keys
- [ ] **Email configuration:** Configure custom SMTP in Supabase Auth settings (optional for scale)

## 8. Common Issues

| Issue | Solution |
|-------|----------|
| "Cannot find module @akorfa/shared" | Ensure `npm run build:shared` ran in vercel.json buildCommand |
| RLS policy errors on posts/reactions | Verify 003_social.sql migration applied; check RLS policies in Supabase |
| increment_user_score RPC fails | Ensure 004_post_triggers.sql applied; check function exists: `select proname from pg_proc where proname='increment_user_score'` |
| Auth redirect loops | Verify custom email redirect URL in Supabase Auth Settings matches your domain |
| Posts not appearing in feed | Check Supabase RLS policies allow public select on posts table |

## Rollback Plan

If deployment fails:

1. Revert code on GitHub to last known good commit
2. Vercel will auto-redeploy from that commit
3. If database is corrupted, restore from Supabase backup: Database → Backups → Restore

---

**Deployed by:** [Your name]  
**Deployment date:** [Today's date]  
**Production URL:** https://yourdomain.com  
**Supabase project:** [Project name]
