import { describe, expect, it } from "vitest";
import { emptyCounts, type RelationshipType } from "../engine/models";
import { applyEligibility } from "../shafii/eligibility";
import { applyHajb } from "../shafii/hajb";

function decisions(present: [RelationshipType, number][]) {
  const counts = emptyCounts();
  for (const [rel, n] of present) counts[rel] = n;
  const eligibility = applyEligibility(counts, "male");
  return { counts, hajb: applyHajb(counts, eligibility) };
}

const blockedBy = (present: [RelationshipType, number][], rel: RelationshipType) => {
  const { hajb } = decisions(present);
  const d = hajb.get(rel);
  return d?.blocked ? d.blockedBy : null;
};

describe("Hajb engine — Shafi'i blocking table", () => {
  it("son blocks son's son, son's daughter and brothers", () => {
    const present: [RelationshipType, number][] = [["son", 1], ["sonsSon", 1], ["sonsDaughter", 1], ["fullBrother", 1], ["paternalHalfBrother", 1]];
    expect(blockedBy(present, "sonsSon")).toContain("son");
    expect(blockedBy(present, "sonsDaughter")).toContain("son");
    expect(blockedBy(present, "fullBrother")).toContain("son");
    expect(blockedBy(present, "paternalHalfBrother")).toContain("son");
  });

  it("father blocks all siblings and grandmothers", () => {
    const present: [RelationshipType, number][] = [
      ["father", 1], ["fullBrother", 1], ["fullSister", 1],
      ["paternalHalfBrother", 1], ["paternalHalfSister", 1],
      ["maternalHalfBrother", 1], ["maternalHalfSister", 1],
      ["paternalGrandmother", 1], ["maternalGrandmother", 1],
    ];
    for (const rel of ["fullBrother", "fullSister", "paternalHalfBrother", "paternalHalfSister", "maternalHalfBrother", "maternalHalfSister", "paternalGrandmother", "maternalGrandmother"] as RelationshipType[]) {
      expect(blockedBy(present, rel)).toContain("father");
    }
  });

  it("grandfather blocks siblings (Shafi'i: grandfather stands in the father's place)", () => {
    const present: [RelationshipType, number][] = [["paternalGrandfather", 1], ["fullBrother", 2], ["paternalHalfSister", 1]];
    expect(blockedBy(present, "fullBrother")).toContain("paternalGrandfather");
    expect(blockedBy(present, "paternalHalfSister")).toContain("paternalGrandfather");
  });

  it("any descendant blocks maternal siblings", () => {
    expect(blockedBy([["daughter", 1], ["maternalHalfBrother", 1]], "maternalHalfBrother")).toContain("daughter");
    expect(blockedBy([["sonsDaughter", 1], ["maternalHalfSister", 1]], "maternalHalfSister")).toContain("sonsDaughter");
  });

  it("mother blocks both grandmothers", () => {
    expect(blockedBy([["mother", 1], ["paternalGrandmother", 1]], "paternalGrandmother")).toContain("mother");
    expect(blockedBy([["mother", 1], ["maternalGrandmother", 1]], "maternalGrandmother")).toContain("mother");
  });

  it("two daughters block the son's daughter unless a son's son exists", () => {
    expect(blockedBy([["daughter", 2], ["sonsDaughter", 1]], "sonsDaughter")).toContain("daughter");
    expect(blockedBy([["daughter", 2], ["sonsSon", 1], ["sonsDaughter", 1]], "sonsDaughter")).toBeNull();
  });

  it("two full sisters block the paternal half-sister unless a paternal half-brother exists", () => {
    expect(blockedBy([["fullSister", 2], ["paternalHalfSister", 1]], "paternalHalfSister")).toContain("fullSister");
    expect(blockedBy([["fullSister", 2], ["paternalHalfBrother", 1], ["paternalHalfSister", 1]], "paternalHalfSister")).toBeNull();
  });

  it("full brother blocks paternal half-siblings", () => {
    expect(blockedBy([["fullBrother", 1], ["paternalHalfBrother", 1], ["paternalHalfSister", 1]], "paternalHalfSister")).toContain("fullBrother");
  });

  it("a blocked heir does not block others (المحجوب لا يحجب)", () => {
    // son blocks the full brother; the paternal half-brother is blocked by the son, not by the blocked full brother
    const { hajb } = decisions([["son", 1], ["fullBrother", 1], ["paternalHalfBrother", 1]]);
    const d = hajb.get("paternalHalfBrother");
    expect(d?.blocked).toBe(true);
    expect(d?.blockedBy).not.toContain("fullBrother");
  });

  it("maternal grandfather is ineligible (dhawu al-arham), not merely blocked", () => {
    const counts = emptyCounts();
    counts.maternalGrandfather = 1;
    counts.son = 1;
    const eligibility = applyEligibility(counts, "male");
    expect(eligibility.get("maternalGrandfather")?.status).toBe("INELIGIBLE");
    expect(eligibility.get("maternalGrandfather")?.reasonRuleId).toBe("R-ELIG-ARHAM-01");
  });
});
