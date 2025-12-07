Feed & Social

This document describes the new feed features and how to test them locally.

Migrations
- Apply `supabase/migrations/003_social.sql` and `004_post_triggers.sql` in your Supabase project.

API routes
- `POST /api/posts` accepts `{content, layer, user_id}` and creates a post and user_event.
- `POST /api/reactions` accepts `{post_id, reaction_type, user_id}` and creates a reaction and user_event.

Testing locally
1. Ensure migrations applied in Supabase.
2. Start web dev server.
3. Visit `/feed` to create posts and see the feed.

Notes
- The server routes use the `@akorfa/shared` scoring module to compute a simple delta — it's a placeholder for more sophisticated incremental scoring.
- For production, implement atomic score recalculation or incremental SQL updates rather than placeholders.
