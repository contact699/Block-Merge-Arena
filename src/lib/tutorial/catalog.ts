// Tutorial Catalog - Predefined tutorial flows

import type { TutorialFlow } from '@/lib/types/tutorial';

/**
 * Welcome Tutorial - First-time user onboarding
 */
export const WELCOME_TUTORIAL: TutorialFlow = {
  id: 'welcome',
  name: 'Welcome to Block Merge Arena',
  description: 'Learn the basics and get started',
  icon: '👋',
  steps: [
    {
      id: 'welcome_1',
      title: 'Welcome!',
      description: 'Welcome to Block Merge Arena! Let\'s learn how to play.',
      position: 'center',
      action: 'tap',
      nextStep: 'welcome_2',
    },
    {
      id: 'welcome_2',
      title: 'The Goal',
      description: 'Place block pieces on the board to clear lines and earn points. The more you clear, the higher your score!',
      position: 'center',
      action: 'tap',
      nextStep: 'welcome_3',
    },
    {
      id: 'welcome_3',
      title: 'The Innovation',
      description: 'But here\'s the twist: cleared blocks drop gems that merge for MASSIVE score multipliers!',
      position: 'center',
      action: 'tap',
      nextStep: 'welcome_4',
    },
    {
      id: 'welcome_4',
      title: 'Compete Daily',
      description: 'Join daily tournaments where everyone gets the same pieces. Prove you\'re the best strategist!',
      position: 'center',
      action: 'tap',
      nextStep: null,
    },
  ],
  rewards: {
    coins: 100,
    gems: 10,
  },
};

/**
 * Basic Gameplay Tutorial
 */
export const BASIC_GAMEPLAY_TUTORIAL: TutorialFlow = {
  id: 'basic_gameplay',
  name: 'Basic Gameplay',
  description: 'Learn how to place blocks and clear lines',
  icon: '🎮',
  steps: [
    {
      id: 'basic_1',
      title: 'Select a Piece',
      description: 'Tap on one of the block pieces below to select it.',
      targetElement: 'pieces-selector',
      position: 'top',
      action: 'tap',
      nextStep: 'basic_2',
    },
    {
      id: 'basic_2',
      title: 'Place the Piece',
      description: 'Now tap on the board where you want to place it. The piece must fit completely!',
      targetElement: 'game-board',
      position: 'top',
      action: 'tap',
      nextStep: 'basic_3',
    },
    {
      id: 'basic_3',
      title: 'Clear Lines',
      description: 'When you fill a complete row or column, it clears! Try to clear multiple lines at once for bigger combos.',
      position: 'center',
      action: 'tap',
      nextStep: 'basic_4',
    },
    {
      id: 'basic_4',
      title: 'Keep Playing',
      description: 'Keep placing pieces until the board is full. The game ends when no more pieces can fit!',
      position: 'center',
      action: 'tap',
      nextStep: null,
    },
  ],
  rewards: {
    coins: 50,
  },
};

/**
 * Gem Merge Tutorial
 */
export const GEM_MERGE_TUTORIAL: TutorialFlow = {
  id: 'gem_merge',
  name: 'Gem Merge System',
  description: 'Learn how to merge gems for multipliers',
  icon: '💎',
  steps: [
    {
      id: 'gem_1',
      title: 'Gems Drop!',
      description: 'When you clear lines, colored gems drop onto the board where blocks were cleared.',
      position: 'center',
      action: 'tap',
      nextStep: 'gem_2',
    },
    {
      id: 'gem_2',
      title: 'Gems Merge',
      description: 'When 2+ gems of the SAME COLOR touch, they merge into a larger gem!',
      position: 'center',
      action: 'tap',
      nextStep: 'gem_3',
    },
    {
      id: 'gem_3',
      title: 'Multipliers!',
      description: 'Larger gems give you score multipliers:\n\n• Small (2 gems): 1x\n• Medium (3 gems): 2x\n• Large (4 gems): 3x\n• Mega (5+ gems): 5x',
      position: 'center',
      action: 'tap',
      nextStep: 'gem_4',
    },
    {
      id: 'gem_4',
      title: 'Strategic Play',
      description: 'Should you clear now, or wait to merge more gems first? Master this decision to dominate!',
      position: 'center',
      action: 'tap',
      nextStep: null,
    },
  ],
  rewards: {
    coins: 75,
    gems: 5,
  },
};

/**
 * Power-Ups Tutorial
 */
export const POWERUPS_TUTORIAL: TutorialFlow = {
  id: 'powerups',
  name: 'Power-Ups',
  description: 'Learn about strategic power-ups',
  icon: '⚡',
  steps: [
    {
      id: 'power_1',
      title: 'Power-Ups',
      description: 'Power-ups give you strategic advantages during gameplay. You can pick 2 before starting a match!',
      position: 'center',
      action: 'tap',
      nextStep: 'power_2',
    },
    {
      id: 'power_2',
      title: '🔄 Reroll',
      description: 'Swap one piece for a different random shape. Perfect when you get stuck!',
      position: 'center',
      action: 'tap',
      nextStep: 'power_3',
    },
    {
      id: 'power_3',
      title: '💣 Blast',
      description: 'Clear a 3x3 area on the board. Great for making emergency space!',
      position: 'center',
      action: 'tap',
      nextStep: 'power_4',
    },
    {
      id: 'power_4',
      title: '⏱️ Freeze',
      description: 'Pause the timer in tournament mode. Buy yourself thinking time!',
      position: 'center',
      action: 'tap',
      nextStep: 'power_5',
    },
    {
      id: 'power_5',
      title: '🎯 Target',
      description: 'AI suggests the best placement. Use it when you need guidance!',
      position: 'center',
      action: 'tap',
      nextStep: 'power_6',
    },
    {
      id: 'power_6',
      title: 'Earn Power-Ups',
      description: 'Win power-ups from tournaments, achievements, and the shop!',
      position: 'center',
      action: 'tap',
      nextStep: null,
    },
  ],
  rewards: {
    coins: 100,
  },
};

/**
 * Tournament Tutorial
 */
export const TOURNAMENT_TUTORIAL: TutorialFlow = {
  id: 'tournament',
  name: 'Daily Tournaments',
  description: 'Compete against players worldwide',
  icon: '🏆',
  steps: [
    {
      id: 'tournament_1',
      title: 'Daily Tournaments',
      description: 'Every day, a new tournament starts with the same starting pieces for EVERYONE worldwide!',
      position: 'center',
      action: 'tap',
      nextStep: 'tournament_2',
    },
    {
      id: 'tournament_2',
      title: '5-Minute Rounds',
      description: 'You have 5 minutes to score as high as possible. Make every move count!',
      position: 'center',
      action: 'tap',
      nextStep: 'tournament_3',
    },
    {
      id: 'tournament_3',
      title: 'Fair Competition',
      description: 'Everyone gets the same pieces in the same order. Pure skill determines the winner!',
      position: 'center',
      action: 'tap',
      nextStep: 'tournament_4',
    },
    {
      id: 'tournament_4',
      title: 'Climb the Ranks',
      description: 'Earn rewards, unlock achievements, and see your name on the global leaderboard!',
      position: 'center',
      action: 'tap',
      nextStep: null,
    },
  ],
  rewards: {
    coins: 150,
    gems: 10,
  },
};

/**
 * All tutorial flows
 */
export const ALL_TUTORIALS: TutorialFlow[] = [
  WELCOME_TUTORIAL,
  BASIC_GAMEPLAY_TUTORIAL,
  GEM_MERGE_TUTORIAL,
  POWERUPS_TUTORIAL,
  TOURNAMENT_TUTORIAL,
];

/**
 * Get tutorial by ID
 */
export function getTutorialById(id: string): TutorialFlow | undefined {
  return ALL_TUTORIALS.find((tutorial) => tutorial.id === id);
}

/**
 * Get next recommended tutorial
 */
export function getNextTutorial(completedTutorials: string[]): TutorialFlow | null {
  for (const tutorial of ALL_TUTORIALS) {
    if (!completedTutorials.includes(tutorial.id)) {
      return tutorial;
    }
  }
  return null; // All tutorials completed
}
