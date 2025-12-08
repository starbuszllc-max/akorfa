import { pgTable, uuid, text, decimal, jsonb, timestamp, integer, boolean, unique, date } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  username: text('username').notNull().unique(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  akorfaScore: decimal('akorfa_score', { precision: 10, scale: 2 }).default('0'),
  layerScores: jsonb('layer_scores').default({}),
  metadata: jsonb('metadata').default({}),
  goals: jsonb('goals').default([]),
  onboardingCompleted: boolean('onboarding_completed').default(false),
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  lastActiveDate: date('last_active_date'),
  totalXp: integer('total_xp').default(0),
  level: integer('level').default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const assessments = pgTable('assessments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  layerScores: jsonb('layer_scores').notNull(),
  overallScore: decimal('overall_score', { precision: 10, scale: 2 }).notNull(),
  insights: text('insights'),
  recommendations: jsonb('recommendations').default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  layer: text('layer').default('social'),
  postType: text('post_type').default('post'),
  mediaUrls: jsonb('media_urls').default([]),
  mediaTypes: jsonb('media_types').default([]),
  likeCount: integer('like_count').default(0),
  commentCount: integer('comment_count').default(0),
  viewCount: integer('view_count').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  mediaUrl: text('media_url'),
  mediaType: text('media_type'),
  gifUrl: text('gif_url'),
  isHelpful: boolean('is_helpful').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const reactions = pgTable('reactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  reactionType: text('reaction_type'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const userEvents = pgTable('user_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  pointsEarned: integer('points_earned').notNull(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const challenges = pgTable('challenges', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  layer: text('layer').default('social'),
  durationDays: integer('duration_days').default(7),
  pointsReward: integer('points_reward').default(50),
  createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
  startsAt: timestamp('starts_at', { withTimezone: true }).defaultNow(),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  participantCount: integer('participant_count').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const challengeParticipants = pgTable('challenge_participants', {
  id: uuid('id').defaultRandom().primaryKey(),
  challengeId: uuid('challenge_id').references(() => challenges.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  status: text('status').default('active'),
  progress: integer('progress').default(0),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true })
});

export const badges = pgTable('badges', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon').default('star'),
  layer: text('layer'),
  requirementType: text('requirement_type').notNull(),
  requirementValue: integer('requirement_value').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const userBadges = pgTable('user_badges', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  badgeId: uuid('badge_id').notNull().references(() => badges.id, { onDelete: 'cascade' }),
  earnedAt: timestamp('earned_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  uniqueUserBadge: unique().on(table.userId, table.badgeId)
}));

export const dailyInsights = pgTable('daily_insights', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  insightDate: date('insight_date').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  focusLayer: text('focus_layer'),
  actionItems: jsonb('action_items').default([]),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const userGoals = pgTable('user_goals', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  layer: text('layer'),
  targetDate: date('target_date'),
  progress: integer('progress').default(0),
  status: text('status').default('active'),
  aiSuggested: boolean('ai_suggested').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true })
});

export const groups = pgTable('groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  layer: text('layer'),
  avatarUrl: text('avatar_url'),
  createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
  memberCount: integer('member_count').default(0),
  isPublic: boolean('is_public').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const groupMembers = pgTable('group_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupId: uuid('group_id').references(() => groups.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  role: text('role').default('member'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  uniqueGroupMember: unique().on(table.groupId, table.userId)
}));

export const accountabilityPartners = pgTable('accountability_partners', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  partnerId: uuid('partner_id').references(() => profiles.id, { onDelete: 'cascade' }),
  status: text('status').default('pending'),
  matchScore: integer('match_score'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const stories = pgTable('stories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  content: text('content'),
  mediaUrl: text('media_url'),
  mediaType: text('media_type'),
  layer: text('layer'),
  viewCount: integer('view_count').default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// ============== MONETIZATION TABLES ==============

// User wallets for points and coins
export const wallets = pgTable('wallets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }).unique(),
  pointsBalance: integer('points_balance').default(0),
  coinsBalance: integer('coins_balance').default(0),
  totalEarned: integer('total_earned').default(0),
  totalWithdrawn: decimal('total_withdrawn', { precision: 10, scale: 2 }).default('0'),
  creatorLevel: integer('creator_level').default(1),
  followerCount: integer('follower_count').default(0),
  canMonetize: boolean('can_monetize').default(false),
  stripeAccountId: text('stripe_account_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// Points transaction log
export const pointsLog = pgTable('points_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  action: text('action').notNull(),
  description: text('description'),
  referenceId: uuid('reference_id'),
  referenceType: text('reference_type'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Coin transactions (purchases, tips, etc)
export const coinTransactions = pgTable('coin_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  transactionType: text('transaction_type').notNull(),
  description: text('description'),
  referenceId: uuid('reference_id'),
  stripePaymentId: text('stripe_payment_id'),
  status: text('status').default('completed'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Gifts/Tips between users
export const gifts = pgTable('gifts', {
  id: uuid('id').defaultRandom().primaryKey(),
  senderId: uuid('sender_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  receiverId: uuid('receiver_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'set null' }),
  giftType: text('gift_type').notNull(),
  coinAmount: integer('coin_amount').notNull(),
  message: text('message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Marketplace items (frames, boosts, stickers, etc)
export const marketplaceItems = pgTable('marketplace_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  itemType: text('item_type').notNull(),
  coinPrice: integer('coin_price').notNull(),
  imageUrl: text('image_url'),
  metadata: jsonb('metadata').default({}),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// User purchased items
export const userItems = pgTable('user_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  itemId: uuid('item_id').notNull().references(() => marketplaceItems.id, { onDelete: 'cascade' }),
  isEquipped: boolean('is_equipped').default(false),
  purchasedAt: timestamp('purchased_at', { withTimezone: true }).defaultNow()
});

// Payout requests
export const payouts = pgTable('payouts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  pointsConverted: integer('points_converted').notNull(),
  status: text('status').default('pending'),
  stripeTransferId: text('stripe_transfer_id'),
  paymentMethod: text('payment_method'),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Subscriptions (Akorfa+)
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  planType: text('plan_type').notNull(),
  status: text('status').default('active'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// AI Post quality scores
export const postScores = pgTable('post_scores', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }).unique(),
  qualityScore: integer('quality_score').default(0),
  layerImpact: jsonb('layer_impact').default({}),
  isHelpful: boolean('is_helpful').default(false),
  aiAnalysis: text('ai_analysis'),
  bonusPoints: integer('bonus_points').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Follows (for creator follower counts)
export const follows = pgTable('follows', {
  id: uuid('id').defaultRandom().primaryKey(),
  followerId: uuid('follower_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  followingId: uuid('following_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  uniqueFollow: unique().on(table.followerId, table.followingId)
}));

// Sponsored challenges
export const sponsoredChallenges = pgTable('sponsored_challenges', {
  id: uuid('id').defaultRandom().primaryKey(),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  sponsorName: text('sponsor_name').notNull(),
  sponsorLogo: text('sponsor_logo'),
  totalBudget: decimal('total_budget', { precision: 10, scale: 2 }).notNull(),
  prizePool: decimal('prize_pool', { precision: 10, scale: 2 }),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).default('0.10'),
  status: text('status').default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Notifications
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message'),
  referenceId: uuid('reference_id'),
  referenceType: text('reference_type'),
  actorId: uuid('actor_id').references(() => profiles.id, { onDelete: 'set null' }),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Direct Messages - Conversations
export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  participantOneId: uuid('participant_one_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  participantTwoId: uuid('participant_two_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  uniqueConversation: unique().on(table.participantOneId, table.participantTwoId)
}));

// Direct Messages - Messages
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  content: text('content'),
  messageType: text('message_type').default('text'),
  mediaUrl: text('media_url'),
  audioDuration: integer('audio_duration'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});
