// Converts engine events into an ordered beat timeline (spec §6).
// Pure (testable) buildTimeline + an I/O player that fires haptics/sfx.
// I/O imports (expo-haptics, cascade, sfx) are deferred inside playTimeline
// so this module is testable without native module mocks.
import type { EngineEvent } from '@/lib/game/engine';
import { motion } from '@/lib/design/tokens';

export type BeatKind = 'settle' | 'sweep' | 'gemDrop' | 'merge' | 'scoreRoll';

export interface Beat {
  kind: BeatKind;
  startMs: number;
  durationMs: number;
  event: EngineEvent;
  haptic?: 'light' | 'medium' | 'success';
  sfx?: 'place' | 'clear' | 'merge';
}

const DURATIONS: Record<BeatKind, number> = {
  settle: motion.instant,  // 80
  sweep: 240,
  gemDrop: 180,
  merge: motion.base,      // 220
  scoreRoll: motion.base,  // 220
};

export function buildTimeline(
  events: EngineEvent[],
  opts: { reduceMotion: boolean }
): Beat[] {
  const beats: Beat[] = [];
  let cursor = 0;

  const push = (
    kind: BeatKind,
    event: EngineEvent,
    haptic?: Beat['haptic'],
    sfx?: Beat['sfx'],
  ) => {
    const durationMs = opts.reduceMotion ? DURATIONS[kind] / 2 : DURATIONS[kind];
    beats.push({ kind, startMs: cursor, durationMs, event, haptic, sfx });
    cursor += durationMs;
  };

  for (const e of events) {
    if (e.type === 'piecePlaced') push('settle', e, 'light', 'place');
    if (e.type === 'linesCleared') push('sweep', e, 'medium', 'clear');
    if (e.type === 'gemsDropped') push('gemDrop', e);
    if (e.type === 'mergeFormed') push('merge', e, 'success', 'merge');
    if (e.type === 'scoreAwarded') push('scoreRoll', e);
  }

  return beats;
}

/** Fire haptics/sfx on schedule. Visual beats are consumed elsewhere (the
 *  board canvas effect layers key off the same Beat list). Returns total ms
 *  and timeout ids so the caller can clear them on unmount (no setState-after-unmount).
 *
 *  Haptic wiring (all via lazy require so this module is testable without native mocks):
 *    'light'   → expo-haptics impactAsync(Light)        — piecePlaced settle beat
 *    'medium'  → expo-haptics impactAsync(Medium)       — linesCleared sweep beat
 *    'success' → fireMergeHaptic(multiplier) [cascade]  — mergeFormed beat (multiplier-patterned)
 *
 *  SFX wiring:
 *    'merge'   → playMergeSound(multiplier) [sfx.ts]    — mergeFormed beat
 *    'place' / 'clear' → no dedicated sound assets yet (reserved for T16); skipped
 */
export function playTimeline(
  beats: Beat[],
  onBeat: (beat: Beat) => void,
): {
  totalMs: number;
  timeouts: ReturnType<typeof setTimeout>[];
} {
  // Lazy require keeps native deps out of module parse — buildTimeline stays testable.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Haptics = require('expo-haptics') as typeof import('expo-haptics');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { fireMergeHaptic } = require('@/lib/haptics/cascade') as typeof import('@/lib/haptics/cascade');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { playMergeSound } = require('@/lib/audio/sfx') as typeof import('@/lib/audio/sfx');

  const timeouts: ReturnType<typeof setTimeout>[] = [];

  for (const beat of beats) {
    timeouts.push(
      setTimeout(() => {
        onBeat(beat);

        // Haptics — non-critical, swallow errors
        if (beat.haptic) {
          try {
            if (beat.haptic === 'success' && beat.event.type === 'mergeFormed') {
              // Use cascade module which patterns the haptic intensity by merge multiplier
              void fireMergeHaptic(beat.event.multiplier);
            } else if (beat.haptic === 'light') {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } else if (beat.haptic === 'medium') {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          } catch {
            // best-effort
          }
        }

        // SFX — only merge has loaded sound assets (sfx.ts covers merge-Nx.m4a)
        if (beat.sfx === 'merge' && beat.event.type === 'mergeFormed') {
          try {
            void playMergeSound(beat.event.multiplier);
          } catch {
            // best-effort
          }
        }
        // 'place' and 'clear' sfx cues reserved for future sound assets (T16)
      }, beat.startMs),
    );
  }

  const last = beats[beats.length - 1];
  return {
    totalMs: last ? last.startMs + last.durationMs : 0,
    timeouts,
  };
}

export async function isReduceMotion(): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AccessibilityInfo } = require('react-native') as typeof import('react-native');
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch {
    return false;
  }
}
