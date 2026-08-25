import { F, Fraction } from "../engine/fractions";
import type { Counts, Gender, RelationshipType, SharePart } from "../engine/models";

export type FatherMode = "MALE_DESC" | "FEMALE_DESC" | "ASABAH_ONLY" | null;

export interface FurudMeta {
  fatherFigure: RelationshipType | null;
  fatherMode: FatherMode;
  grandmotherCount: number;
  grandmotherAnchor: RelationshipType | null;
  maternalCount: number;
  maternalAnchor: RelationshipType | null;
  umariApplied: boolean;
  mushtarakahApplied: boolean;
  mushtarakahHeads: number;
  spouseShare: Fraction;
  hasDesc: boolean;
  liveSiblings: number;
}

export interface FurudOutcome {
  parts: Map<RelationshipType, SharePart[]>;
  meta: FurudMeta;
}

const SIBLINGS: RelationshipType[] = [
  "fullBrother",
  "fullSister",
  "paternalHalfBrother",
  "paternalHalfSister",
  "maternalHalfBrother",
  "maternalHalfSister",
];

/**
 * DHAWU AL-FURUD ENGINE — أصحاب الفروض
 * Assigns fixed shares from the COMPLETE family configuration
 * (never from relationship alone), per the Shafi'i rule registry.
 * Group shares are stored; per-person division happens in the calculator.
 */
export function computeFixedShares(
  counts: Counts,
  statuses: Map<RelationshipType, "ELIGIBLE" | "BLOCKED" | "INELIGIBLE">,
  deceasedGender: Gender
): FurudOutcome {
  const parts = new Map<RelationshipType, SharePart[]>();
  const add = (r: RelationshipType, fraction: Fraction, ruleId: string, labelKey: string) => {
    const list = parts.get(r) ?? [];
    list.push({ labelKey, fraction, ruleId });
    parts.set(r, list);
  };

  const live = (r: RelationshipType) => (counts[r] ?? 0) > 0 && statuses.get(r) === "ELIGIBLE";

  const maleDesc = live("son") || live("sonsSon");
  const femaleDesc = live("daughter") || live("sonsDaughter");
  const hasDesc = maleDesc || femaleDesc;
  const liveSiblings = SIBLINGS.reduce((s, r) => s + (live(r) ? counts[r] : 0), 0);

  const meta: FurudMeta = {
    fatherFigure: null,
    fatherMode: null,
    grandmotherCount: 0,
    grandmotherAnchor: null,
    maternalCount: 0,
    maternalAnchor: null,
    umariApplied: false,
    mushtarakahApplied: false,
    mushtarakahHeads: 0,
    spouseShare: Fraction.ZERO,
    hasDesc,
    liveSiblings,
  };

  // ── Spouses ──────────────────────────────────────────────────────
  if (live("husband")) {
    const share = hasDesc ? F(1, 4) : F(1, 2);
    add("husband", share, hasDesc ? "R-FURUD-HUSBAND-02" : "R-FURUD-HUSBAND-01", "part.furud");
    meta.spouseShare = share;
  }
  if (live("wife")) {
    const share = hasDesc ? F(1, 8) : F(1, 4);
    add("wife", share, hasDesc ? "R-FURUD-WIFE-02" : "R-FURUD-WIFE-01", "part.furud");
    meta.spouseShare = share;
  }

  // ── Father figure (father; grandfather in the father's place — Shafi'i) ──
  const fatherFigure: RelationshipType | null = counts.father > 0 ? "father" : counts.paternalGrandfather > 0 ? "paternalGrandfather" : null;
  const isGrandfather = fatherFigure === "paternalGrandfather";
  if (fatherFigure && live(fatherFigure)) {
    meta.fatherFigure = fatherFigure;
    if (maleDesc) {
      meta.fatherMode = "MALE_DESC";
      add(fatherFigure, F(1, 6), "R-FURUD-FATHER-01", "part.furud");
    } else if (femaleDesc) {
      meta.fatherMode = "FEMALE_DESC";
      add(fatherFigure, F(1, 6), "R-FURUD-FATHER-02", "part.furud");
    } else {
      meta.fatherMode = "ASABAH_ONLY";
    }
  }

  // ── Mother (incl. Umariyyatain) ─────────────────────────────────
  if (live("mother")) {
    const eligibleSet: RelationshipType[] = (Object.keys(counts) as RelationshipType[]).filter(
      (r) => counts[r] > 0 && statuses.get(r) === "ELIGIBLE"
    );
    const spouse = live("husband") ? "husband" : live("wife") ? "wife" : null;
    const umari =
      !hasDesc &&
      liveSiblings === 0 &&
      spouse !== null &&
      fatherFigure !== null &&
      eligibleSet.every((r) => r === spouse || r === "mother" || r === fatherFigure);

    if (hasDesc) {
      add("mother", F(1, 6), "R-FURUD-MOTHER-01", "part.furud");
    } else if (liveSiblings >= 2) {
      add("mother", F(1, 6), "R-FURUD-MOTHER-02", "part.furud");
    } else if (umari) {
      const motherShare = Fraction.ONE.subtract(meta.spouseShare).multiply(F(1, 3));
      add("mother", motherShare, spouse === "husband" ? "R-UMARI-01" : "R-UMARI-02", "part.umari");
      meta.umariApplied = true;
    } else {
      add("mother", F(1, 3), "R-FURUD-MOTHER-03", "part.furud");
    }
  }

  // ── Grandmothers: one shared 1/6 ─────────────────────────────────
  const pgb = live("paternalGrandmother");
  const mgb = live("maternalGrandmother");
  if (pgb || mgb) {
    meta.grandmotherCount = (pgb ? counts.paternalGrandmother : 0) + (mgb ? counts.maternalGrandmother : 0);
    meta.grandmotherAnchor = pgb ? "paternalGrandmother" : "maternalGrandmother";
    add(meta.grandmotherAnchor, F(1, 6), "R-FURUD-GRANDMOTHER-01", "part.furud.grandmothers");
  }

  // ── Daughters ────────────────────────────────────────────────────
  if (live("daughter") && !maleDesc) {
    if (counts.daughter === 1) add("daughter", F(1, 2), "R-FURUD-DAUGHTER-01", "part.furud");
    else add("daughter", F(2, 3), "R-FURUD-DAUGHTER-02", "part.furud");
  }

  // ── Son's daughters ──────────────────────────────────────────────
  if (live("sonsDaughter")) {
    if (live("sonsSon")) {
      // asabah with her son's son — handled by the asabah engine
    } else if (live("daughter")) {
      if (counts.daughter === 1) add("sonsDaughter", F(1, 6), "R-FURUD-SONSDAUGHTER-02", "part.complement");
      // else blocked (R-HAJB-DAUGHTERS-01, decided in hajb engine)
    } else {
      if (counts.sonsDaughter === 1) add("sonsDaughter", F(1, 2), "R-FURUD-SONSDAUGHTER-01", "part.furud");
      else add("sonsDaughter", F(2, 3), "R-FURUD-SONSDAUGHTER-01", "part.furud");
    }
  }

  // ── Full sisters ─────────────────────────────────────────────────
  if (live("fullSister") && !live("fullBrother") && !femaleDesc) {
    if (counts.fullSister === 1) add("fullSister", F(1, 2), "R-FURUD-FULLSIS-01", "part.furud");
    else add("fullSister", F(2, 3), "R-FURUD-FULLSIS-01", "part.furud");
  }

  // ── Paternal half-sisters ────────────────────────────────────────
  if (live("paternalHalfSister") && !live("paternalHalfBrother")) {
    const fullSisterTookHalf = live("fullSister") && counts.fullSister === 1 && !femaleDesc;
    if (live("fullSister")) {
      if (fullSisterTookHalf) add("paternalHalfSister", F(1, 6), "R-FURUD-PATSIS-01", "part.complement");
      // otherwise the full sister is residuary-with-other or the paternal
      // half-sister is blocked (R-HAJB-FULLSIS-01) — nothing to assign
    } else if (!femaleDesc) {
      if (counts.paternalHalfSister === 1) add("paternalHalfSister", F(1, 2), "R-FURUD-PATSIS-01", "part.furud");
      else add("paternalHalfSister", F(2, 3), "R-FURUD-PATSIS-01", "part.furud");
    }
  }

  // ── Maternal siblings (incl. Mushtarakah) ────────────────────────
  const matBro = live("maternalHalfBrother") ? counts.maternalHalfBrother : 0;
  const matSis = live("maternalHalfSister") ? counts.maternalHalfSister : 0;
  const matTotal = matBro + matSis;
  if (matTotal > 0) {
    meta.maternalCount = matTotal;
    const grandmotherPresent = pgb || mgb;
    const mushtarakah =
      live("husband") &&
      (live("mother") || grandmotherPresent) &&
      matTotal >= 2 &&
      live("fullBrother") &&
      !live("fullSister") &&
      !live("paternalHalfBrother") &&
      !live("paternalHalfSister") &&
      !hasDesc;

    const anchor: RelationshipType = matBro > 0 ? "maternalHalfBrother" : "maternalHalfSister";
    meta.maternalAnchor = anchor;
    if (mushtarakah) {
      // One shared pool of 1/3 across maternal siblings + full brothers — R-MUSHTARAKAH-01
      meta.mushtarakahApplied = true;
      meta.mushtarakahHeads = matTotal + counts.fullBrother;
      add(anchor, F(1, 3), "R-MUSHTARAKAH-01", "part.mushtarakah");
    } else if (matTotal === 1) {
      add(anchor, F(1, 6), "R-FURUD-MATSIB-01", "part.furud");
    } else {
      add(anchor, F(1, 3), "R-FURUD-MATSIB-02", "part.furud");
    }
  }

  return { parts, meta };
}

export function sumParts(parts: Map<RelationshipType, SharePart[]>): Fraction {
  let total = Fraction.ZERO;
  for (const list of parts.values()) for (const p of list) total = total.add(p.fraction);
  return total;
}
