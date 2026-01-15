// Tutorial Progress Management

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TutorialProgress, TutorialFlow } from '@/lib/types/tutorial';
import { DEFAULT_TUTORIAL_PROGRESS } from '@/lib/types/tutorial';
import { ALL_TUTORIALS, getNextTutorial as getNextTutorialFromCatalog } from '@/lib/tutorial/catalog';
import { addCurrency } from './currency';

const TUTORIAL_PROGRESS_KEY = '@block_merge_arena:tutorial_progress';

/**
 * Get tutorial progress
 */
export async function getTutorialProgress(): Promise<TutorialProgress> {
  try {
    const data = await AsyncStorage.getItem(TUTORIAL_PROGRESS_KEY);
    if (data) {
      return { ...DEFAULT_TUTORIAL_PROGRESS, ...JSON.parse(data) };
    }
    return DEFAULT_TUTORIAL_PROGRESS;
  } catch (error) {
    console.error('Error loading tutorial progress:', error);
    return DEFAULT_TUTORIAL_PROGRESS;
  }
}

/**
 * Save tutorial progress
 */
export async function saveTutorialProgress(progress: TutorialProgress): Promise<void> {
  try {
    await AsyncStorage.setItem(TUTORIAL_PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving tutorial progress:', error);
  }
}

/**
 * Check if tutorial is completed
 */
export async function isTutorialCompleted(tutorialId: string): Promise<boolean> {
  const progress = await getTutorialProgress();
  return progress.completedTutorials.includes(tutorialId);
}

/**
 * Check if user has completed welcome tutorial
 */
export async function hasCompletedWelcome(): Promise<boolean> {
  return await isTutorialCompleted('welcome');
}

/**
 * Start a tutorial
 */
export async function startTutorial(tutorialId: string): Promise<TutorialProgress> {
  const progress = await getTutorialProgress();

  // Get tutorial from catalog
  const tutorial = ALL_TUTORIALS.find((t) => t.id === tutorialId);
  if (!tutorial) {
    throw new Error(`Tutorial not found: ${tutorialId}`);
  }

  progress.currentTutorial = tutorialId;
  progress.currentStep = tutorial.steps[0]?.id;

  await saveTutorialProgress(progress);
  console.log(`📚 Started tutorial: ${tutorialId}`);

  return progress;
}

/**
 * Complete current step and move to next
 */
export async function completeStep(stepId: string): Promise<{
  nextStep: string | null;
  tutorialComplete: boolean;
}> {
  const progress = await getTutorialProgress();

  if (!progress.currentTutorial) {
    return { nextStep: null, tutorialComplete: false };
  }

  // Find current tutorial
  const tutorial = ALL_TUTORIALS.find((t) => t.id === progress.currentTutorial);
  if (!tutorial) {
    return { nextStep: null, tutorialComplete: false };
  }

  // Find current step
  const currentStepIndex = tutorial.steps.findIndex((s) => s.id === stepId);
  if (currentStepIndex === -1) {
    return { nextStep: null, tutorialComplete: false };
  }

  const currentStep = tutorial.steps[currentStepIndex];

  // Check if there's a next step
  if (currentStep.nextStep) {
    progress.currentStep = currentStep.nextStep;
    await saveTutorialProgress(progress);
    return { nextStep: currentStep.nextStep, tutorialComplete: false };
  } else {
    // Tutorial complete!
    return await completeTutorial(progress.currentTutorial);
  }
}

/**
 * Complete a tutorial and award rewards
 */
export async function completeTutorial(tutorialId: string): Promise<{
  nextStep: null;
  tutorialComplete: true;
  rewards?: { coins?: number; gems?: number };
}> {
  const progress = await getTutorialProgress();

  // Add to completed list
  if (!progress.completedTutorials.includes(tutorialId)) {
    progress.completedTutorials.push(tutorialId);
  }

  // Clear current tutorial
  progress.currentTutorial = undefined;
  progress.currentStep = undefined;

  await saveTutorialProgress(progress);

  // Award rewards
  const tutorial = ALL_TUTORIALS.find((t) => t.id === tutorialId);
  if (tutorial && tutorial.rewards) {
    await addCurrency({
      coins: tutorial.rewards.coins || 0,
      gems: tutorial.rewards.gems || 0,
    });
    console.log(`🎁 Tutorial rewards awarded: ${tutorial.rewards.coins || 0} coins, ${tutorial.rewards.gems || 0} gems`);
  }

  console.log(`✅ Tutorial completed: ${tutorialId}`);

  return {
    nextStep: null,
    tutorialComplete: true,
    rewards: tutorial?.rewards,
  };
}

/**
 * Skip current tutorial
 */
export async function skipTutorial(tutorialId: string): Promise<TutorialProgress> {
  const progress = await getTutorialProgress();

  if (!progress.skippedTutorials.includes(tutorialId)) {
    progress.skippedTutorials.push(tutorialId);
  }

  progress.currentTutorial = undefined;
  progress.currentStep = undefined;

  await saveTutorialProgress(progress);
  console.log(`⏭️ Tutorial skipped: ${tutorialId}`);

  return progress;
}

/**
 * Get next recommended tutorial
 */
export async function getNextTutorial(): Promise<TutorialFlow | null> {
  const progress = await getTutorialProgress();
  return getNextTutorialFromCatalog(progress.completedTutorials);
}

/**
 * Reset all tutorial progress (for testing)
 */
export async function resetTutorialProgress(): Promise<void> {
  await AsyncStorage.removeItem(TUTORIAL_PROGRESS_KEY);
  console.log('🔄 Tutorial progress reset');
}

/**
 * Disable tutorial prompts
 */
export async function disableTutorialPrompts(): Promise<void> {
  const progress = await getTutorialProgress();
  progress.showTutorialPrompts = false;
  await saveTutorialProgress(progress);
  console.log('🔕 Tutorial prompts disabled');
}

/**
 * Enable tutorial prompts
 */
export async function enableTutorialPrompts(): Promise<void> {
  const progress = await getTutorialProgress();
  progress.showTutorialPrompts = true;
  await saveTutorialProgress(progress);
  console.log('🔔 Tutorial prompts enabled');
}

/**
 * Get tutorial completion percentage
 */
export async function getTutorialCompletionPercentage(): Promise<number> {
  const progress = await getTutorialProgress();
  const totalTutorials = ALL_TUTORIALS.length;
  const completedCount = progress.completedTutorials.length;

  return Math.round((completedCount / totalTutorials) * 100);
}

/**
 * Get tutorial stats
 */
export async function getTutorialStats(): Promise<{
  total: number;
  completed: number;
  remaining: number;
  percentage: number;
}> {
  const progress = await getTutorialProgress();
  const total = ALL_TUTORIALS.length;
  const completed = progress.completedTutorials.length;
  const remaining = total - completed;
  const percentage = await getTutorialCompletionPercentage();

  return { total, completed, remaining, percentage };
}
