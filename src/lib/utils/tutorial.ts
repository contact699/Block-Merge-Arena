// src/lib/utils/tutorial.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'block-merge:welcome-complete';

export async function hasCompletedWelcome(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEY)) === '1';
}

export async function markWelcomeComplete(): Promise<void> {
  await AsyncStorage.setItem(KEY, '1');
}
