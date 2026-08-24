import { F, Fraction } from "../engine/fractions";
import type { Counts, RelationshipType, SharePart } from "../engine/models";
import type { FurudMeta } from "./fixedShares";

export interface AsabahOutcome {
  parts: Map<RelationshipType, SharePart[]>;
  /** Description key for the calculation steps. */
  takerKey: string | null;
  maGhayr: "full" | "paternal" | null;
}

/**
 * ASABAH ENGINE — العصبة
 * Determines which residuary class takes the residue and how it is
 * distributed. The 2:1 male/female proportion is applied ONLY inside a
 * verified residuary pair — never as a universal rule.
 */
export function computeAsabah(
  counts: Counts,
  statuses: Map<RelationshipType, "ELIGIBLE" | "BLOCKED" | "INELIGIBLE">,
  meta: FurudMeta,
  residue: Fraction
): AsabahOutcome {
  const parts = new Map<RelationshipType, SharePart[]>();
  const add = (r: RelationshipType, fraction: Fraction, ruleId: string, labelKey: string) => {
    const list = parts.get(r) ?? [];
    list.push({ labelKey, fraction, ruleId });
    parts.set(r, list);
  };
  const live = (r: RelationshipType) => (counts[r] ?? 0) > 0 && statuses.get(r) === "ELIGIBLE";

  if (residue.isZero() || residue.isNegative()) return { parts, takerKey: null, maGhayr: null };

  /** Distribute residue to a male/female residuary pair (2:1). */
  const distributePair = (
    male: RelationshipType,
    female: RelationshipType,
    ruleIdPair: string,
    ruleIdSolo: string
  ) => {
    const males = live(male) ? counts[male] : 0;
    const females = live(female) ? counts[female] : 0;
    const heads = males * 2 + females;
    if (males > 0) {
      const maleGroup = residue.multiply(F(2 * males, heads));
      add(male, maleGroup, females > 0 ? ruleIdPair : ruleIdSolo, "part.asabah");
    }
    if (females > 0) {
      const femaleGroup = residue.multiply(F(females, heads));
      add(female, femaleGroup, ruleIdPair, "part.asabah");
    }
  };

  // Nearest residuary class first — R-ASABAH-ORDER-01
  if (live("son")) {
    distributePair("son", "daughter", "R-ASABAH-2TO1-01", "R-ASABAH-ORDER-01");
    return { parts, takerKey: "step.taker.son", maGhayr: null };
  }
  if (live("sonsSon")) {
    distributePair("sonsSon", "sonsDaughter", "R-ASABAH-2TO1-01", "R-ASABAH-ORDER-01");
    return { parts, takerKey: "step.taker.sonsSon", maGhayr: null };
  }
  if (meta.fatherFigure && live(meta.fatherFigure)) {
    // Father: 1/6 + residue (female descendants) or pure residuary — both
    // modes collapse here; the 1/6 furud part was already assigned.
    add(
      meta.fatherFigure,
      residue,
      meta.fatherMode === "FEMALE_DESC" ? "R-FURUD-FATHER-02" : "R-FURUD-FATHER-03",
      "part.asabah"
    );
    return { parts, takerKey: "step.taker.father", maGhayr: null };
  }
  if (live("fullBrother")) {
    distributePair("fullBrother", "fullSister", "R-ASABAH-2TO1-01", "R-ASABAH-ORDER-01");
    return { parts, takerKey: "step.taker.fullBrother", maGhayr: null };
  }
  if (live("paternalHalfBrother")) {
    distributePair("paternalHalfBrother", "paternalHalfSister", "R-ASABAH-2TO1-01", "R-ASABAH-ORDER-01");
    return { parts, takerKey: "step.taker.paternalHalfBrother", maGhayr: null };
  }

  // Asabah ma‘a al-ghayr — a sister beside a female descendant — R-ASABAH-MAGHAYR-01
  const femaleDesc = live("daughter") || live("sonsDaughter");
  if (femaleDesc) {
    if (live("fullSister")) {
      add("fullSister", residue, "R-ASABAH-MAGHAYR-01", "part.asabahMaghayr");
      return { parts, takerKey: "step.taker.fullSisterMaGhayr", maGhayr: "full" };
    }
    if (live("paternalHalfSister")) {
      add("paternalHalfSister", residue, "R-ASABAH-MAGHAYR-01", "part.asabahMaghayr");
      return { parts, takerKey: "step.taker.paternalSisterMaGhayr", maGhayr: "paternal" };
    }
  }

  // Residue remains with no residuary → the radd stage handles it.
  return { parts, takerKey: null, maGhayr: null };
}
