// Tutorial & Onboarding Types

export type TutorialStep = {
  id: string;
  title: string;
  description: string;
  targetElement?: string; // ID of element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'tap' | 'drag' | 'wait'; // Required action to proceed
  nextStep?: string; // ID of next step (null = end of tutorial)
};

export type TutorialFlow = {
  id: string;
  name: string;
  description: string;
  icon: string;
  steps: TutorialStep[];
  rewards?: {
    coins?: number;
    gems?: number;
  };
};

export type TutorialProgress = {
  completedTutorials: string[]; // List of completed tutorial IDs
  currentTutorial?: string; // Current tutorial being played
  currentStep?: string; // Current step in tutorial
  skippedTutorials: string[]; // List of skipped tutorial IDs
  showTutorialPrompts: boolean; // Whether to show tutorial prompts
};

export const DEFAULT_TUTORIAL_PROGRESS: TutorialProgress = {
  completedTutorials: [],
  currentTutorial: undefined,
  currentStep: undefined,
  skippedTutorials: [],
  showTutorialPrompts: true,
};
