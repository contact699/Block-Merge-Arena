// In-game toast surfaced when an achievement unlocks. Replaces Phase 2's
// console.log placeholder. Multiple unlocks are staggered so each is visible.
import * as Burnt from 'burnt';
import { DEFAULT_ACHIEVEMENTS } from '@/lib/utils/achievements';

export function showAchievementToast(achievementId: string): void {
  const meta = DEFAULT_ACHIEVEMENTS.find((a) => a.id === achievementId);
  if (!meta) return;
  Burnt.alert({
    title: 'Achievement unlocked',
    message: meta.name,
    preset: 'done',
    duration: 2.5,
  });
}

export function showAchievementsToasts(ids: string[]): void {
  ids.forEach((id, i) => {
    setTimeout(() => showAchievementToast(id), i * 1500);
  });
}
