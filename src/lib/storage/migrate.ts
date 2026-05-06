// src/lib/storage/migrate.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const MIGRATION_MARKER = '@block_merge:_migrated_v1';

const KEY_MAP: Record<string, string> = {
  '@block_merge_arena:currency':           '@block_merge:currency',
  '@block_merge_arena:transactions':       '@block_merge:transactions',
  '@block_merge_arena:achievements':       '@block_merge:achievements',
  '@block_merge_arena:achievement_unlocks':'@block_merge:achievement_unlocks',
  '@block_merge_arena:replays':            '@block_merge:replays',
  '@block_merge_arena:inventory':          '@block_merge:inventory',
  '@block_merge_arena:settings':           '@block_merge:settings',
  '@block_merge_arena:leaderboard':        '@block_merge:leaderboard',
  '@block_merge_arena:user_id':            '@block_merge:user_id',
  'block-merge:welcome-complete':          '@block_merge:welcome-complete',
};

export async function migrateStorageKeys(): Promise<void> {
  const marker = await AsyncStorage.getItem(MIGRATION_MARKER);
  if (marker === '1') return;

  for (const [oldKey, newKey] of Object.entries(KEY_MAP)) {
    const existingNew = await AsyncStorage.getItem(newKey);
    if (existingNew !== null) continue; // don't overwrite already-migrated data
    const existingOld = await AsyncStorage.getItem(oldKey);
    if (existingOld === null) continue; // nothing to copy
    await AsyncStorage.setItem(newKey, existingOld);
  }
  await AsyncStorage.setItem(MIGRATION_MARKER, '1');
}
