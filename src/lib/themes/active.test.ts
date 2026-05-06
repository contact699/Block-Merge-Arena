import { describe, it, expect } from '@jest/globals';
import { canApplyTheme } from './active';

describe('canApplyTheme', () => {
  it('allows the free default theme regardless of subscription', () => {
    expect(canApplyTheme('warm', false)).toBe(true);
    expect(canApplyTheme('warm', true)).toBe(true);
  });

  it('blocks locked themes for non-subscribers', () => {
    expect(canApplyTheme('cool', false)).toBe(false);
    expect(canApplyTheme('mono', false)).toBe(false);
    expect(canApplyTheme('neon', false)).toBe(false);
  });

  it('allows locked themes for subscribers', () => {
    expect(canApplyTheme('cool', true)).toBe(true);
    expect(canApplyTheme('mono', true)).toBe(true);
    expect(canApplyTheme('neon', true)).toBe(true);
  });

  it('returns false for unknown theme ids', () => {
    expect(canApplyTheme('unknown' as never, true)).toBe(false);
  });
});
