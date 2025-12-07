-- SQL function to increment post like_count safely
create or replace function public.increment_post_like_count(p_post_id uuid)
returns void as $$
begin
  update public.posts set like_count = coalesce(like_count,0) + 1, updated_at = now() where id = p_post_id;
end;
$$ language plpgsql security definer;

-- SQL function to atomically increment user profile akorfa_score
create or replace function public.increment_user_score(p_user_id uuid, p_delta numeric)
returns void as $$
begin
  update public.profiles set akorfa_score = coalesce(akorfa_score,0) + p_delta, updated_at = now() where id = p_user_id;
end;
$$ language plpgsql security definer;

-- Note: To allow RPC from service role, ensure functions are defined as security definer.
