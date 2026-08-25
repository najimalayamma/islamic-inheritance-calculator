import { Fraction } from "../engine/fractions";
import type { RelationshipType, SharePart } from "../engine/models";

export interface RaddOutcome {
  applied: boolean;
  residue: Fraction;
  parts: Map<RelationshipType, SharePart[]>;
  /** Residue that goes to the bayt al-mal (no radd-eligible heir). */
  baytResidue: Fraction;
  baytRuleId: string;
}

const SPOUSES: RelationshipType[] = ["husband", "wife"];

/**
 * RADD ENGINE — الرد
 * Applied only when a residue remains AND no residuary (asabah) exists.
 * The residue returns to the fixed heirs in proportion to their shares,
 * EXCLUDING the spouses — the established Shafi'i position. If no
 * radd-eligible heir exists, the residue goes to the bayt al-mal.
 */
export function applyRadd(
  parts: Map<RelationshipType, SharePart[]>,
  residue: Fraction
): RaddOutcome {
  if (residue.isZero() || residue.isNegative()) {
    return { applied: false, residue, parts, baytResidue: Fraction.ZERO, baytRuleId: "R-BAYT-01" };
  }

  let nonSpouseTotal = Fraction.ZERO;
  for (const [rel, list] of parts.entries()) {
    if (SPOUSES.includes(rel)) continue;
    for (const p of list) nonSpouseTotal = nonSpouseTotal.add(p.fraction);
  }

  // No radd-eligible heir: residue → bayt al-mal — R-RADD-02 / R-BAYT-01
  if (nonSpouseTotal.isZero()) {
    return {
      applied: false,
      residue,
      parts,
      baytResidue: residue,
      baytRuleId: parts.size > 0 ? "R-RADD-02" : "R-BAYT-01",
    };
  }

  const result = new Map<RelationshipType, SharePart[]>();
  for (const [rel, list] of parts.entries()) {
    const copied = [...list];
    if (!SPOUSES.includes(rel)) {
      for (const p of list) {
        // proportional return: share_i + residue * share_i / Σ shares
        const increment = p.fraction.multiply(residue).divide(nonSpouseTotal);
        copied.push({ labelKey: "part.radd", fraction: increment, ruleId: "R-RADD-01" });
      }
    }
    result.set(rel, copied);
  }

  return { applied: true, residue, parts: result, baytResidue: Fraction.ZERO, baytRuleId: "R-BAYT-01" };
}
