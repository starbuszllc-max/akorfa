import {AkorfaActivityInput, StabilityMetrics} from '../types';

/**
 * Calculates the Stability value S using the Stability Equation:
 * S = R * (L + G) / (|L - G| + C - (A * n))
 */
export function calculateStability(metrics: StabilityMetrics): number {
  const {R, L, G, C, A, n} = metrics;
  const numerator = R * (L + G);
  const denominator = Math.abs(L - G) + C - A * n;
  if (denominator <= 0) return numerator > 0 ? Number.POSITIVE_INFINITY : 0;
  return numerator / denominator;
}

/**
 * Akorfa scoring rules and weights implemented deterministically.
 * Returns a numeric score (unbounded) — caller may map to Level/Badge tiers.
 */
export function calculateAkorfaScore(input: AkorfaActivityInput): number {
  const rules = {
    postCreated: 5,
    commentAdded: 2,
    reactionReceived: 1,
    reactionGiven: 0.5,
    assessmentCompleted: 10,
    challengeJoined: 3,
    challengeCompleted: 15,
    helpfulContent: 8,
    streakBonus: (streak = 0) => Math.min(streak * 2, 20),
    layerBalanceBonus: (balance = 0) => balance * 5
  } as const;

  // Activity score
  const activityScore =
    (input.postsCreated || 0) * rules.postCreated +
    (input.commentsMade || 0) * rules.commentAdded +
    (input.reactionsReceived || 0) * rules.reactionReceived +
    (input.helpfulMarked || 0) * rules.helpfulContent;

  // Assessment score
  const assessmentScore =
    (input.assessmentCompletions || 0) * rules.assessmentCompleted +
    (input.scoreImprovement || 0) * 15 +
    (input.consistencyStreak || 0) * 5;

  // Challenge score
  const challengeScore =
    (input.challengesJoined || 0) * rules.challengeJoined +
    (input.challengesCompleted || 0) * rules.challengeCompleted +
    (input.progressConsistency || 0) * 10;

  // Community score
  const communityScore =
    (input.usersHelped || 0) * 8 +
    (input.contentShared || 0) * 3 +
    (input.invitationsSent || 0) * 5;

  const streakBonus = rules.streakBonus(input.consistencyStreak || 0);
  // layerBalance is domain-specific; pass 0 by default
  const layerBalanceBonus = rules.layerBalanceBonus(0);

  const finalScore =
    activityScore * 0.4 +
    assessmentScore * 0.3 +
    challengeScore * 0.2 +
    communityScore * 0.1 +
    streakBonus +
    layerBalanceBonus;

  return Number(finalScore.toFixed(2));
}

export default {
  calculateStability,
  calculateAkorfaScore
};
