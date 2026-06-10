export type AsyncPhase = 'loading' | 'error' | 'empty' | 'content';

export function asyncState(s: { loading: boolean; error: string | null; isEmpty: boolean }): AsyncPhase {
  if (s.loading) return 'loading';
  if (s.error) return 'error';
  if (s.isEmpty) return 'empty';
  return 'content';
}
