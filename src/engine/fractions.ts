/**
 * Exact rational arithmetic for Faraid calculation.
 * All share computation stays in exact fractions until the final
 * monetary conversion — never in floating point.
 */
export class Fraction {
  readonly n: bigint;
  readonly d: bigint;

  constructor(numerator: bigint | number, denominator: bigint | number = 1n) {
    let n = BigInt(numerator);
    let d = BigInt(denominator);
    if (d === 0n) throw new RangeError("Fraction: denominator cannot be zero");
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = Fraction.gcd(n < 0n ? -n : n, d);
    this.n = n / g;
    this.d = d / g;
  }

  private static gcd(a: bigint, b: bigint): bigint {
    while (b !== 0n) {
      const t = a % b;
      a = b;
      b = t;
    }
    return a === 0n ? 1n : a;
  }

  static of(n: bigint | number, d: bigint | number = 1n): Fraction {
    return new Fraction(n, d);
  }

  static readonly ZERO = new Fraction(0n, 1n);
  static readonly ONE = new Fraction(1n, 1n);

  add(other: Fraction): Fraction {
    return new Fraction(this.n * other.d + other.n * this.d, this.d * other.d);
  }

  subtract(other: Fraction): Fraction {
    return new Fraction(this.n * other.d - other.n * this.d, this.d * other.d);
  }

  multiply(other: Fraction): Fraction {
    return new Fraction(this.n * other.n, this.d * other.d);
  }

  divide(other: Fraction): Fraction {
    if (other.n === 0n) throw new RangeError("Fraction: division by zero");
    return new Fraction(this.n * other.d, this.d * other.n);
  }

  neg(): Fraction {
    return new Fraction(-this.n, this.d);
  }

  reciprocal(): Fraction {
    if (this.n === 0n) throw new RangeError("Fraction: reciprocal of zero");
    return new Fraction(this.d, this.n);
  }

  simplify(): Fraction {
    return new Fraction(this.n, this.d);
  }

  compare(other: Fraction): number {
    const left = this.n * other.d;
    const right = other.n * this.d;
    return left < right ? -1 : left > right ? 1 : 0;
  }

  equals(other: Fraction): boolean {
    return this.compare(other) === 0;
  }
  greaterThan(other: Fraction): boolean {
    return this.compare(other) > 0;
  }
  lessThan(other: Fraction): boolean {
    return this.compare(other) < 0;
  }
  greaterThanOrEqual(other: Fraction): boolean {
    return this.compare(other) >= 0;
  }
  lessThanOrEqual(other: Fraction): boolean {
    return this.compare(other) <= 0;
  }

  isZero(): boolean {
    return this.n === 0n;
  }
  isNegative(): boolean {
    return this.n < 0n;
  }
  isOne(): boolean {
    return this.n === this.d;
  }

  /** Exact decimal string is impossible for many rationals; this returns a rounded float. */
  toDecimal(precision = 12): number {
    const scaled = (this.n * 10n ** BigInt(precision)) / this.d;
    return Number(scaled) / 10 ** precision;
  }

  toPercentage(precision = 4): number {
    return Math.round(this.toDecimal(12) * 100 * 10 ** precision) / 10 ** precision;
  }

  toString(): string {
    if (this.d === 1n) return `${this.n}`;
    return `${this.n}/${this.d}`;
  }

  toJSON(): { n: string; d: string } {
    return { n: this.n.toString(), d: this.d.toString() };
  }

  static fromJSON(v: { n: string; d: string }): Fraction {
    return new Fraction(BigInt(v.n), BigInt(v.d));
  }
}

export const F = (n: bigint | number, d: bigint | number = 1n): Fraction => new Fraction(n, d);
