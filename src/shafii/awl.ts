import { Fraction } from "../engine/fractions";
import type { RelationshipType, SharePart } from "../engine/models";
import { sumParts } from "./fixedShares";

export interface AwlOutcome {
  applied: boolean;
  /** The new common base (مجموع السهام) when awl applies. */
  baseTotal: Fraction;
  parts: Map<RelationshipType, SharePart[]>;
}

/**
 * AWL ENGINE — العول
 * Detected strictly after furud assignment: if the fixed shares exceed
 * the estate, every fixed share is scaled by the common denominator
 * (the sum of the share numerators over the raised base).
 * Spouses participate in awl — R-AWL-01.
 */
export function applyAwl(parts: Map<RelationshipType, SharePart[]>): AwlOutcome {
  const total = sumParts(parts);
  if (!total.greaterThan(Fraction.ONE)) {
    return { applied: false, baseTotal: total, parts };
  }

  const factor = total.reciprocal(); // multiply each share by 1/total
  const scaled = new Map<RelationshipType, SharePart[]>();
  for (const [rel, list] of parts.entries()) {
    scaled.set(
      rel,
      list.map((p) => ({ ...p, fraction: p.fraction.multiply(factor) }))
    );
  }
  return { applied: true, baseTotal: total, parts: scaled };
}
