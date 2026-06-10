import { SeededRandom, mathRandomSource } from './rng';

describe('SeededRandom', () => {
  it('same seed produces identical sequences', () => {
    const a = new SeededRandom(20260610);
    const b = new SeededRandom(20260610);
    const seqA = Array.from({ length: 50 }, () => a.nextInt(0, 999));
    const seqB = Array.from({ length: 50 }, () => b.nextInt(0, 999));
    expect(seqA).toEqual(seqB);
  });

  it('different seeds diverge', () => {
    const a = new SeededRandom(1);
    const b = new SeededRandom(2);
    const seqA = Array.from({ length: 10 }, () => a.nextInt(0, 999));
    const seqB = Array.from({ length: 10 }, () => b.nextInt(0, 999));
    expect(seqA).not.toEqual(seqB);
  });

  it('nextInt stays within bounds inclusive', () => {
    const r = new SeededRandom(42);
    for (let i = 0; i < 1000; i++) {
      const v = r.nextInt(3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
    }
  });

  it('mathRandomSource satisfies the interface', () => {
    const v = mathRandomSource.nextInt(0, 5);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(5);
  });
});
