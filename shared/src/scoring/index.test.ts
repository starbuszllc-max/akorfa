import {calculateAkorfaScore, calculateStability} from './index';

test('calculateAkorfaScore: basic activity', () => {
  const score = calculateAkorfaScore({
    postsCreated: 2,
    commentsMade: 4,
    reactionsReceived: 10,
    helpfulMarked: 1,
    assessmentCompletions: 1,
    scoreImprovement: 2,
    consistencyStreak: 3,
    challengesJoined: 1,
    challengesCompleted: 0,
    usersHelped: 2,
    contentShared: 1,
    invitationsSent: 0
  });
  expect(typeof score).toBe('number');
  expect(score).toBeGreaterThan(0);
});

test('calculateStability: sample metrics', () => {
  const s = calculateStability({R: 100, L: 6, G: 7, C: 2, A: 0.5, n: 2});
  expect(typeof s).toBe('number');
  expect(s).toBeGreaterThan(0);
});
