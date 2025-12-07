export type LayerKey =
  | 'environment'
  | 'bio'
  | 'internal'
  | 'cultural'
  | 'social'
  | 'conscious'
  | 'existential';

export interface StabilityMetrics {
  R: number; // Resource throughput (size of the pie)
  L: number; // Local OS coherence (0-10)
  G: number; // Global OS efficiency (0-10)
  C: number; // Coupling coefficient (0.1-10)
  A: number; // Conscious Agreement (0-1)
  n: number; // Scaling exponent (1-3)
}

export interface AkorfaActivityInput {
  postsCreated?: number;
  commentsMade?: number;
  reactionsReceived?: number;
  helpfulMarked?: number;
  assessmentCompletions?: number;
  scoreImprovement?: number; // numeric improvement delta
  consistencyStreak?: number;
  challengesJoined?: number;
  challengesCompleted?: number;
  progressConsistency?: number;
  usersHelped?: number;
  contentShared?: number;
  invitationsSent?: number;
}
