import { describe, it, expect } from '@jest/globals';
import { hapticTierFor } from './cascade';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

describe('hapticTierFor', () => {
  it.each([
    [1, 'none'],
    [2, 'light'],
    [3, 'medium'],
    [4, 'medium'],
    [5, 'heavy-double'],
    [6, 'heavy-double'],
    [7, 'heavy-triple'],
    [10, 'heavy-triple'],
  ] as [number, string][])('multiplier %i → %s', (mult, expected) => {
    expect(hapticTierFor(mult)).toBe(expected);
  });
});
