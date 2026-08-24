import type { Counts, RelationshipType } from "../engine/models";
import type { EligibilityDecision } from "./eligibility";

export interface HajbDecision {
  relationship: RelationshipType;
  blocked: boolean;
  blockedBy: RelationshipType[];
  ruleId?: string;
}

/**
 * HAJB ENGINE — الحجب
 * Determines حجب الحرمان (complete exclusion) for every relationship present,
 * according to the verified Shafi'i blocking table.
 *
 * Principle: a blocked heir does not block others (المحجوب لا يحجب) — blocking
 * is therefore computed in dependency order from unblocked blockers.
 */
export function applyHajb(
  counts: Counts,
  eligibility: Map<RelationshipType, EligibilityDecision>
): Map<RelationshipType, HajbDecision> {
  const c = (r: RelationshipType) => counts[r] ?? 0;
  const results = new Map<RelationshipType, HajbDecision>();

  const isIneligible = (r: RelationshipType) => eligibility.get(r)?.status === "INELIGIBLE";

  const blockMap = new Map<RelationshipType, { by: RelationshipType[]; rule: string }>();
  const block = (r: RelationshipType, by: RelationshipType, rule: string) => {
    const existing = blockMap.get(r);
    if (existing) {
      if (!existing.by.includes(by)) existing.by.push(by);
    } else {
      blockMap.set(r, { by: [by], rule });
    }
  };

  const son = c("son");
  const sonsSon = c("sonsSon");
  const daughter = c("daughter");
  const sonsDaughter = c("sonsDaughter");
  const father = c("father");
  const pgf = c("paternalGrandfather");
  const mother = c("mother");

  const anyDescendant = son + sonsSon + daughter + sonsDaughter;
  const maleDescendant = son + sonsSon;

  // — Son blocks grandchildren and brothers — R-HAJB-SON-01
  if (son > 0) {
    block("sonsSon", "son", "R-HAJB-SON-01");
    block("sonsDaughter", "son", "R-HAJB-SON-01");
    block("fullBrother", "son", "R-HAJB-SON-01");
    block("paternalHalfBrother", "son", "R-HAJB-SON-01");
  }

  // — Son's son (when unblocked) blocks brothers — R-HAJB-SONSSON-01
  if (sonsSon > 0 && son === 0) {
    block("fullBrother", "sonsSon", "R-HAJB-SONSSON-01");
    block("paternalHalfBrother", "sonsSon", "R-HAJB-SONSSON-01");
  }

  // — Any descendant blocks maternal siblings — R-HAJB-DESC-01
  if (anyDescendant > 0) {
    const descendantRep: RelationshipType = son > 0 ? "son" : sonsSon > 0 ? "sonsSon" : daughter > 0 ? "daughter" : "sonsDaughter";
    block("maternalHalfBrother", descendantRep, "R-HAJB-DESC-01");
    block("maternalHalfSister", descendantRep, "R-HAJB-DESC-01");
  }

  // — Father blocks all siblings and grandmothers — R-HAJB-FATHER-01
  if (father > 0) {
    block("fullBrother", "father", "R-HAJB-FATHER-01");
    block("fullSister", "father", "R-HAJB-FATHER-01");
    block("paternalHalfBrother", "father", "R-HAJB-FATHER-01");
    block("paternalHalfSister", "father", "R-HAJB-FATHER-01");
    if (anyDescendant === 0) {
      // maternal siblings already blocked by father (included in "all siblings")
      block("maternalHalfBrother", "father", "R-HAJB-FATHER-01");
      block("maternalHalfSister", "father", "R-HAJB-FATHER-01");
    }
    block("paternalGrandmother", "father", "R-HAJB-FATHER-01");
    block("maternalGrandmother", "father", "R-HAJB-FATHER-01");
  } else if (pgf > 0) {
    // — Grandfather = father's place in Shafi'i school — R-HAJB-GRANDFATHER-01
    block("fullBrother", "paternalGrandfather", "R-HAJB-GRANDFATHER-01");
    block("fullSister", "paternalGrandfather", "R-HAJB-GRANDFATHER-01");
    block("paternalHalfBrother", "paternalGrandfather", "R-HAJB-GRANDFATHER-01");
    block("paternalHalfSister", "paternalGrandfather", "R-HAJB-GRANDFATHER-01");
    if (anyDescendant === 0) {
      block("maternalHalfBrother", "paternalGrandfather", "R-HAJB-GRANDFATHER-01");
      block("maternalHalfSister", "paternalGrandfather", "R-HAJB-GRANDFATHER-01");
    }
    block("paternalGrandmother", "paternalGrandfather", "R-HAJB-GRANDFATHER-01");
    block("maternalGrandmother", "paternalGrandfather", "R-HAJB-GRANDFATHER-01");
  }

  // — Mother blocks grandmothers — R-HAJB-MOTHER-01
  if (mother > 0) {
    block("paternalGrandmother", "mother", "R-HAJB-MOTHER-01");
    block("maternalGrandmother", "mother", "R-HAJB-MOTHER-01");
  }

  // — Full brother (unblocked) blocks paternal half-siblings — R-HAJB-FULLBRO-01
  const fullBrotherBlocked = blockMap.has("fullBrother") || isIneligible("fullBrother");
  if (c("fullBrother") > 0 && !fullBrotherBlocked) {
    block("paternalHalfBrother", "fullBrother", "R-HAJB-FULLBRO-01");
    block("paternalHalfSister", "fullBrother", "R-HAJB-FULLBRO-01");
  }

  // — Two+ full sisters (unblocked) block paternal half-sister — R-HAJB-FULLSIS-01
  const fullSisterBlocked = blockMap.has("fullSister") || isIneligible("fullSister");
  if (c("fullSister") >= 2 && !fullSisterBlocked && c("paternalHalfBrother") === 0) {
    block("paternalHalfSister", "fullSister", "R-HAJB-FULLSIS-01");
  }

  // — Two+ daughters block son's daughter unless a son's son exists — R-HAJB-DAUGHTERS-01
  if (daughter >= 2 && sonsSon === 0 && son === 0) {
    block("sonsDaughter", "daughter", "R-HAJB-DAUGHTERS-01");
  }

  // Finalize decisions for every present relationship
  for (const [rel, count] of Object.entries(counts) as [RelationshipType, number][]) {
    if (count <= 0) continue;
    const blockedEntry = blockMap.get(rel);
    results.set(rel, {
      relationship: rel,
      blocked: !!blockedEntry,
      blockedBy: blockedEntry?.by ?? [],
      ruleId: blockedEntry?.rule,
    });
  }

  return results;
}

/** True when there is a male inheriting descendant. */
export function hasMaleDescendant(counts: Counts): boolean {
  return (counts.son ?? 0) + (counts.sonsSon ?? 0) > 0;
}
