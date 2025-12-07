import { pgTable, uuid, text, decimal, jsonb, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

// Profiles table (extends auth.users)
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  username: text('username').notNull().unique(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  akorfaScore: decimal('akorfa_score', { precision: 10, scale: 2 }).default('0'),
  layerScores: jsonb('layer_scores').default({}),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// Assessments table
export const assessments = pgTable('assessments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  layerScores: jsonb('layer_scores').notNull(),
  overallScore: decimal('overall_score', { precision: 10, scale: 2 }).notNull(),
  insights: text('insights'),
  recommendations: jsonb('recommendations').default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Posts table
export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  layer: text('layer').default('social'),
  postType: text('post_type').default('post'),
  likeCount: integer('like_count').default(0),
  commentCount: integer('comment_count').default(0),
  viewCount: integer('view_count').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// Comments table
export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  isHelpful: boolean('is_helpful').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Reactions table
export const reactions = pgTable('reactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  reactionType: text('reaction_type'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// User events table
export const userEvents = pgTable('user_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  pointsEarned: integer('points_earned').notNull(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Challenges table
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

// Challenge participants table
export const challengeParticipants = pgTable('challenge_participants', {
  id: uuid('id').defaultRandom().primaryKey(),
  challengeId: uuid('challenge_id').references(() => challenges.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  status: text('status').default('active'),
  progress: integer('progress').default(0),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true })
});
