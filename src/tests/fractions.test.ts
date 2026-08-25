import { describe, expect, it } from "vitest";
import { F, Fraction } from "../engine/fractions";

describe("Fraction — exact rational arithmetic", () => {
  it("adds classic furud fractions exactly: 1/6 + 1/3 = 1/2", () => {
    expect(F(1, 6).add(F(1, 3)).toString()).toBe("1/2");
  });

  it("subtracts: 1 - 11/24 = 13/24", () => {
    expect(Fraction.ONE.subtract(F(11, 24)).toString()).toBe("13/24");
  });

  it("multiplies: 2/3 × 1/5 = 2/15", () => {
    expect(F(2, 3).multiply(F(1, 5)).toString()).toBe("2/15");
  });

  it("divides: (1/6) ÷ (5/6) = 1/5", () => {
    expect(F(1, 6).divide(F(5, 6)).toString()).toBe("1/5");
  });

  it("simplifies automatically: 2/4 = 1/2, 12/24 = 1/2", () => {
    expect(F(2, 4).toString()).toBe("1/2");
    expect(F(12, 24).equals(F(1, 2))).toBe(true);
  });

  it("compares correctly", () => {
    expect(F(1, 3).lessThan(F(1, 2))).toBe(true);
    expect(F(2, 3).greaterThan(F(1, 2))).toBe(true);
    expect(F(3, 7).compare(F(3, 7))).toBe(0);
    expect(F(4, 6).equals(F(2, 3))).toBe(true);
  });

  it("reciprocal works and throws on zero", () => {
    expect(F(3, 7).reciprocal().toString()).toBe("7/3");
    expect(() => Fraction.ZERO.reciprocal()).toThrow();
  });

  it("rejects zero denominators and division by zero", () => {
    expect(() => F(1, 0)).toThrow();
    expect(() => F(1, 2).divide(Fraction.ZERO)).toThrow();
  });

  it("normalizes signs to the numerator", () => {
    expect(F(-1, -2).toString()).toBe("1/2");
    expect(F(1, -2).toString()).toBe("-1/2");
  });

  it("toDecimal rounds at the requested precision", () => {
    expect(F(1, 3).toDecimal(6)).toBeCloseTo(0.333333, 6);
    expect(F(1, 8).toDecimal(4)).toBe(0.125);
  });

  it("keeps large exact computations exact (awl base 7/6)", () => {
    const total = F(1, 2).add(F(2, 3));
    expect(total.toString()).toBe("7/6");
    const scaled = F(1, 2).multiply(total.reciprocal());
    expect(scaled.toString()).toBe("3/7");
  });

  it("survives JSON round-trip", () => {
    const f = F(13, 24);
    expect(Fraction.fromJSON(f.toJSON()).equals(f)).toBe(true);
  });
});
