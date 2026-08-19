import { getBestHeight, getBestBombs } from './storage.js';

// Achievement definitions. The `check` predicate receives a context object
// with the player's persistent stats and decides whether it is earned.
// New achievements can be added here and will appear automatically in the
// Achievements scene.
export const ACHIEVEMENTS = [
  {
    id: 'reach_500',
    name: 'First Heights',
    description: 'Reach 500 m in a run',
    check: (ctx) => ctx.best >= 500,
  },
  {
    id: 'reach_1000',
    name: 'Kilometer Club',
    description: 'Reach 1000 m in a run',
    check: (ctx) => ctx.best >= 1000,
  },
  {
    id: 'reach_2500',
    name: 'High Flyer',
    description: 'Reach 2500 m in a run',
    check: (ctx) => ctx.best >= 2500,
  },
  {
    id: 'reach_4000',
    name: 'Sky Titan',
    description: 'Reach 4000 m in a run',
    check: (ctx) => ctx.best >= 4000,
  },
  {
    id: 'bombs_1',
    name: 'Bomb Buster',
    description: 'Destroy 1 bomb in a run',
    check: (ctx) => ctx.bombs >= 1,
  },
  {
    id: 'bombs_4',
    name: 'Dynamite Dodger',
    description: 'Destroy 4 bombs in a run',
    check: (ctx) => ctx.bombs >= 4,
  },
  {
    id: 'bombs_10',
    name: 'Demolition Expert',
    description: 'Destroy 10 bombs in a run',
    check: (ctx) => ctx.bombs >= 10,
  },
];

function getContext() {
  return { best: getBestHeight(), bombs: getBestBombs() };
}

export function getAchievements() {
  const ctx = getContext();
  return ACHIEVEMENTS.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    unlocked: a.check(ctx),
  }));
}

export function getUnlockedIds() {
  const ctx = getContext();
  return ACHIEVEMENTS.filter((a) => a.check(ctx)).map((a) => a.id);
}

export function getAchievementById(id) {
  return ACHIEVEMENTS.find((a) => a.id === id) || null;
}
