// Deterministic random source. The engine takes a RandomSource so daily runs
// can be fully reproducible (audit M1.1) while endless uses Math.random.

export interface RandomSource {
  next(): number;            // [0, 1)
  nextInt(min: number, max: number): number; // inclusive bounds
}

/** Park–Miller LCG — moved from src/lib/daily/seed.ts so engine + seed share it. */
export class SeededRandom implements RandomSource {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

export const mathRandomSource: RandomSource = {
  next: () => Math.random(),
  nextInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
};
