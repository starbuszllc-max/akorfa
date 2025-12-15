-- Complete Akorfa database schema
-- Run this in Supabase SQL Editor to create all tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Profiles table (core user data)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  username text NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  cover_url text,
  bio text,
  akorfa_score decimal(10,2) DEFAULT 0,
  layer_scores jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  goals jsonb DEFAULT '[]',
  onboarding_completed boolean DEFAULT false,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_active_date date,
  total_xp integer DEFAULT 0,
  level integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Assessments
CREATE TABLE IF NOT EXISTS public.assessments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  layer_scores jsonb NOT NULL,
  overall_score decimal(10,2) NOT NULL,
  insights text,
  recommendations jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- Posts
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  layer text DEFAULT 'social',
  post_type text DEFAULT 'post',
  media_urls jsonb DEFAULT '[]',
  media_types jsonb DEFAULT '[]',
  video_duration integer,
  video_thumbnail text,
  is_verified boolean DEFAULT false,
  source_url text,
  source_name text,
  like_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Comments
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id uuid,
  content text NOT NULL,
  is_helpful boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Reactions
CREATE TABLE IF NOT EXISTS public.reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type text,
  created_at timestamptz DEFAULT now()
);

-- User Events
CREATE TABLE IF NOT EXISTS public.user_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  points_earned integer NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Challenges
CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  layer text DEFAULT 'social',
  duration_days integer DEFAULT 7,
  points_reward integer DEFAULT 50,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  participant_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Challenge Participants
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id uuid REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'active',
  progress integer DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Badges
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text DEFAULT 'star',
  layer text,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- User Badges
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Daily Insights
CREATE TABLE IF NOT EXISTS public.daily_insights (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  insight_date date NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  focus_layer text,
  action_items jsonb DEFAULT '[]',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- User Goals
CREATE TABLE IF NOT EXISTS public.user_goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  layer text,
  target_date date,
  progress integer DEFAULT 0,
  status text DEFAULT 'active',
  ai_suggested boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Groups
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  layer text,
  avatar_url text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  member_count integer DEFAULT 0,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Group Members
CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Accountability Partners
CREATE TABLE IF NOT EXISTS public.accountability_partners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  partner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  match_score integer,
  created_at timestamptz DEFAULT now()
);

-- Stories
CREATE TABLE IF NOT EXISTS public.stories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text,
  media_url text,
  media_type text,
  layer text,
  view_count integer DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Wallets
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  points_balance integer DEFAULT 0,
  coins_balance integer DEFAULT 0,
  total_earned integer DEFAULT 0,
  total_withdrawn decimal(10,2) DEFAULT 0,
  creator_level integer DEFAULT 1,
  follower_count integer DEFAULT 0,
  can_monetize boolean DEFAULT false,
  stripe_account_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Points Log
CREATE TABLE IF NOT EXISTS public.points_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  action text NOT NULL,
  description text,
  reference_id uuid,
  reference_type text,
  created_at timestamptz DEFAULT now()
);

-- Coin Transactions
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  transaction_type text NOT NULL,
  description text,
  reference_id uuid,
  stripe_payment_id text,
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

-- Gifts
CREATE TABLE IF NOT EXISTS public.gifts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  gift_type text NOT NULL,
  coin_amount integer NOT NULL,
  message text,
  created_at timestamptz DEFAULT now()
);

-- Marketplace Items
CREATE TABLE IF NOT EXISTS public.marketplace_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  item_type text NOT NULL,
  coin_price integer NOT NULL,
  image_url text,
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User Items
CREATE TABLE IF NOT EXISTS public.user_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  is_equipped boolean DEFAULT false,
  purchased_at timestamptz DEFAULT now()
);

-- Payouts
CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  points_converted integer NOT NULL,
  status text DEFAULT 'pending',
  stripe_transfer_id text,
  payment_method text,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type text NOT NULL,
  status text DEFAULT 'active',
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Post Scores
CREATE TABLE IF NOT EXISTS public.post_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL UNIQUE REFERENCES public.posts(id) ON DELETE CASCADE,
  quality_score integer DEFAULT 0,
  layer_impact jsonb DEFAULT '{}',
  is_helpful boolean DEFAULT false,
  ai_analysis text,
  bonus_points integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Follows
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Sponsored Challenges
CREATE TABLE IF NOT EXISTS public.sponsored_challenges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  sponsor_name text NOT NULL,
  sponsor_logo text,
  total_budget decimal(10,2) NOT NULL,
  prize_pool decimal(10,2),
  commission_rate decimal(5,2) DEFAULT 0.10,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  reference_id uuid,
  reference_type text,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Conversations (DM)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_one_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_two_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(participant_one_id, participant_two_id)
);

-- Messages (DM)
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text,
  message_type text DEFAULT 'text',
  media_url text,
  audio_duration integer,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Streaks
CREATE TABLE IF NOT EXISTS public.streaks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  partner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  streak_type text NOT NULL,
  current_count integer DEFAULT 0,
  longest_count integer DEFAULT 0,
  last_activity_at timestamptz DEFAULT now(),
  started_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Daily Challenges
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  difficulty text DEFAULT 'easy',
  points_reward integer DEFAULT 10,
  coin_reward integer DEFAULT 0,
  media_prompt text,
  layer text,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Daily Challenge Completions
CREATE TABLE IF NOT EXISTS public.daily_challenge_completions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  referral_code text NOT NULL UNIQUE,
  status text DEFAULT 'pending',
  reward_claimed boolean DEFAULT false,
  reward_coins integer DEFAULT 50,
  created_at timestamptz DEFAULT now(),
  claimed_at timestamptz
);

-- Learning Tracks
CREATE TABLE IF NOT EXISTS public.learning_tracks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text DEFAULT 'brain',
  color text DEFAULT '#6366f1',
  category text NOT NULL,
  total_lessons integer DEFAULT 0,
  estimated_minutes integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Lessons
CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id uuid NOT NULL REFERENCES public.learning_tracks(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  video_url text,
  order_index integer DEFAULT 0,
  estimated_minutes integer DEFAULT 5,
  key_takeaways jsonb DEFAULT '[]',
  quiz jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- User Learning Progress
CREATE TABLE IF NOT EXISTS public.user_learning_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.learning_tracks(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  status text DEFAULT 'in_progress',
  progress integer DEFAULT 0,
  completed_lessons integer DEFAULT 0,
  quiz_score integer,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(user_id, track_id)
);

-- AI Mentor Sessions
CREATE TABLE IF NOT EXISTS public.ai_mentor_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic text,
  layer text,
  messages jsonb DEFAULT '[]',
  summary text,
  insights_gained jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Locations
CREATE TABLE IF NOT EXISTS public.user_locations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  city text,
  region text,
  country text,
  latitude decimal(10,7),
  longitude decimal(10,7),
  is_visible boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- Community Boards
CREATE TABLE IF NOT EXISTS public.community_boards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  city text,
  region text,
  country text,
  member_count integer DEFAULT 0,
  post_count integer DEFAULT 0,
  is_official boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Community Board Members
CREATE TABLE IF NOT EXISTS public.community_board_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id uuid NOT NULL REFERENCES public.community_boards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(board_id, user_id)
);

-- Credit Scores
CREATE TABLE IF NOT EXISTS public.credit_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  score integer DEFAULT 300,
  payment_history_score integer DEFAULT 0,
  engagement_score integer DEFAULT 0,
  tenure_score integer DEFAULT 0,
  community_score integer DEFAULT 0,
  last_calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Loans
CREATE TABLE IF NOT EXISTS public.loans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  interest_rate decimal(5,2) DEFAULT 0,
  total_due integer NOT NULL,
  amount_paid integer DEFAULT 0,
  status text DEFAULT 'active',
  due_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz
);

-- Loan Repayments
CREATE TABLE IF NOT EXISTS public.loan_repayments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  payment_method text,
  created_at timestamptz DEFAULT now()
);

-- Daily Digests
CREATE TABLE IF NOT EXISTS public.daily_digests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  digest_date date NOT NULL,
  content jsonb NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, digest_date)
);
