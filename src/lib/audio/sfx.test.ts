import { describe, it, expect } from '@jest/globals';
import { tierForMultiplier, AudioTier } from './sfx';

jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn(),
    Sound: { createAsync: jest.fn() },
  },
}));

describe('tierForMultiplier', () => {
  it.each([
    [1, null],
    [2, '2x'],
    [3, '3x'],
    [4, '3x'],
    [5, '5x'],
    [6, '5x'],
    [7, '7x'],
    [12, '7x'],
  ] as [number, AudioTier | null][])('multiplier %i → tier %s', (mult, expected) => {
    expect(tierForMultiplier(mult)).toBe(expected);
  });
});
