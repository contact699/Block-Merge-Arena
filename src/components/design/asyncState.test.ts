import { asyncState } from './asyncState';

describe('asyncState', () => {
  it('returns loading when loading is true (regardless of others)', () => {
    expect(asyncState({ loading: true, error: null, isEmpty: true })).toBe('loading');
  });
  it('returns error when not loading and error is set', () => {
    expect(asyncState({ loading: false, error: 'boom', isEmpty: true })).toBe('error');
  });
  it('returns empty when not loading, no error, and empty', () => {
    expect(asyncState({ loading: false, error: null, isEmpty: true })).toBe('empty');
  });
  it('returns content when not loading, no error, not empty', () => {
    expect(asyncState({ loading: false, error: null, isEmpty: false })).toBe('content');
  });
});
