import { describe, expect, it } from "vitest";
import { calculate } from "../shafii/calculator";
import { SPECIAL_RULE_SOURCE_TEXT } from "../shafii/specialAsabah";
import type { CalculationInput, RelationshipType } from "../engine/models";

function makeInput(relatives: [RelationshipType, number][], gender: "male" | "female" = "male", estate = 900000): CalculationInput {
  return {
    deceased: { gender, estateValue: estate, currency: "INR", funeralExpenses: 0, debts: 0, bequest: 0 },
    relatives: relatives.map(([relationship, count]) => ({ relationship, count })),
  };
}

describe("Special Asabah rule — للإبنة النصف ولابنة الابن السدس تكملة للثلثين ، وما بقي فللأخت", () => {
  it("Test 1: daughter + son's daughter + sister → 1/2, 1/6, 1/3 with NO awl", () => {
    const input = makeInput([["daughter", 1], ["sonsDaughter", 1], ["fullSister", 1]]);
    const r = calculate(input);
    const heir = (rel: RelationshipType) => r.heirs.find((h) => h.relationship === rel)!;

    expect(heir("daughter").groupFraction.toString()).toBe("1/2");
    expect(heir("sonsDaughter").groupFraction.toString()).toBe("1/6");
    expect(heir("fullSister").groupFraction.toString()).toBe("1/3");
    expect(heir("fullSister").shareType).toBe("ASABAH_MA_GHAYR");

    // Awl is NOT applied; the residue resolves through the special asabah rule.
    expect(r.awl.applied).toBe(false);
    expect(r.awlDebug.finalDecision).toBe("ASABAH_RESIDUE");
    expect(r.specialAsabah).not.toBeNull();
    expect(r.specialAsabah?.ruleId).toBe("R-SPECIAL-ASABAH-01");
    expect(r.specialAsabah?.sourceText).toBe(SPECIAL_RULE_SOURCE_TEXT);
    expect(r.specialAsabah?.verificationStatus).toBe("PENDING_SCHOLAR_VERIFICATION");

    // The exact Arabic report is preserved verbatim.
    expect(SPECIAL_RULE_SOURCE_TEXT).toBe("للإبنة النصف ولابنة الابن السدس تكملة للثلثين ، وما بقي فللأخت");

    // Shares sum to the whole estate.
    expect(r.distributedTotal).toBeCloseTo(900000, 0);
  });

  it("Test 2: an irrelevant blocked heir does not affect the result", () => {
    // Maternal half-brother is blocked by the daughter (R-HAJB-DESC-01)
    // and must not change shares nor disable the special rule.
    const input = makeInput([["daughter", 1], ["sonsDaughter", 1], ["fullSister", 1], ["maternalHalfBrother", 1]]);
    const r = calculate(input);
    const heir = (rel: RelationshipType) => r.heirs.find((h) => h.relationship === rel)!;

    expect(heir("maternalHalfBrother").status).toBe("BLOCKED");
    expect(heir("maternalHalfBrother").blockedBy).toContain("daughter");

    expect(heir("daughter").groupFraction.toString()).toBe("1/2");
    expect(heir("sonsDaughter").groupFraction.toString()).toBe("1/6");
    expect(heir("fullSister").groupFraction.toString()).toBe("1/3");
    expect(r.specialAsabah).not.toBeNull();
    expect(r.awl.applied).toBe(false);
  });

  it("Test 3: when the sister is blocked, the special rule must NOT apply", () => {
    // The father blocks the full sister (R-HAJB-FATHER-01) and is himself a
    // male residuary — the special rule's conditions fail.
    const input = makeInput([["daughter", 1], ["sonsDaughter", 1], ["fullSister", 1], ["father", 1]]);
    const r = calculate(input);
    const heir = (rel: RelationshipType) => r.heirs.find((h) => h.relationship === rel)!;

    expect(heir("fullSister").status).toBe("BLOCKED");
    expect(heir("fullSister").blockedBy).toContain("father");
    expect(r.specialAsabah).toBeNull();
    expect(r.awlDebug.specialRuleId).not.toBe("R-SPECIAL-ASABAH-01");

    // Classical result instead: father takes 1/6 + residue.
    expect(heir("daughter").groupFraction.toString()).toBe("1/2");
    expect(heir("sonsDaughter").groupFraction.toString()).toBe("1/6");
    expect(heir("father").groupFraction.toString()).toBe("1/3");
    expect(r.awl.applied).toBe(false);
  });

  it("Test 4: a genuine awl case still applies awl (rule must not disable awl globally)", () => {
    const input = makeInput([["husband", 1], ["fullSister", 2]], "female");
    const r = calculate(input);
    const heir = (rel: RelationshipType) => r.heirs.find((h) => h.relationship === rel)!;

    expect(r.awl.applied).toBe(true);
    expect(r.awlDebug.finalDecision).toBe("AWL");
    expect(r.awlDebug.awlCandidate).toBe(true);
    expect(r.specialAsabah).toBeNull();
    expect(heir("husband").groupFraction.toString()).toBe("3/7");
    expect(heir("fullSister").groupFraction.toString()).toBe("4/7");
  });

  it("awl decision trail reports the special rule as the reason awl was excluded", () => {
    const input = makeInput([["daughter", 1], ["sonsDaughter", 1], ["fullSister", 1]]);
    const r = calculate(input);
    expect(r.awl.decision.applies).toBe(false);
    expect(r.awl.decision.ruleId).toBe("R-SPECIAL-ASABAH-01");
    expect(r.awlDebug.awlCandidate).toBe(false);
    expect(r.awlDebug.specialAsabahEvaluation.every((c) => c.passed)).toBe(true);
    expect(r.summary.fixedTotal).toBe("2/3");
    expect(r.summary.residue).toBe("1/3");
    expect(r.summary.asabahRecipients).toContain("fullSister");
  });
});
