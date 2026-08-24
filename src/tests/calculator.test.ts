import { describe, expect, it } from "vitest";
import { calculate } from "../shafii/calculator";
import type { CalculationInput, RelationshipType } from "../engine/models";

function makeInput(relatives: [RelationshipType, number][], gender: "male" | "female" = "male", estate = 1000000): CalculationInput {
  return {
    deceased: { gender, estateValue: estate, currency: "INR", funeralExpenses: 0, debts: 0, bequest: 0 },
    relatives: relatives.map(([relationship, count]) => ({ relationship, count })),
  };
}

function share(input: CalculationInput, rel: RelationshipType) {
  const r = calculate(input);
  const heir = r.heirs.find((h) => h.relationship === rel);
  if (!heir) throw new Error(`heir ${rel} not in result`);
  return heir;
}

describe("Fixed shares — classical cases", () => {
  it("wife + son → wife 1/8, son takes the residue 7/8", () => {
    const input = makeInput([["wife", 1], ["son", 1]]);
    expect(share(input, "wife").groupFraction.toString()).toBe("1/8");
    expect(share(input, "wife").shareType).toBe("FIXED");
    expect(share(input, "son").groupFraction.toString()).toBe("7/8");
    expect(share(input, "son").shareType).toBe("ASABAH_NAFSIHI");
  });

  it("husband + mother + father → Umariyyah: 1/2, 1/6, 1/3", () => {
    const input = makeInput([["husband", 1], ["mother", 1], ["father", 1]], "female");
    expect(share(input, "husband").groupFraction.toString()).toBe("1/2");
    expect(share(input, "mother").groupFraction.toString()).toBe("1/6");
    expect(share(input, "father").groupFraction.toString()).toBe("1/3");
  });

  it("wife + mother + father → Umariyyah: 1/4, 1/4, 1/2", () => {
    const input = makeInput([["wife", 1], ["mother", 1], ["father", 1]]);
    expect(share(input, "wife").groupFraction.toString()).toBe("1/4");
    expect(share(input, "mother").groupFraction.toString()).toBe("1/4");
    expect(share(input, "father").groupFraction.toString()).toBe("1/2");
  });

  it("mother + father + son → 1/6, 1/6, 2/3", () => {
    const input = makeInput([["mother", 1], ["father", 1], ["son", 1]]);
    expect(share(input, "mother").groupFraction.toString()).toBe("1/6");
    expect(share(input, "father").groupFraction.toString()).toBe("1/6");
    expect(share(input, "son").groupFraction.toString()).toBe("2/3");
  });

  it("mother keeps 1/3 with one sibling only (no descendant)", () => {
    const input = makeInput([["mother", 1], ["fullBrother", 1]]);
    expect(share(input, "mother").groupFraction.toString()).toBe("1/3");
    expect(share(input, "fullBrother").groupFraction.toString()).toBe("2/3");
  });

  it("mother drops to 1/6 with two siblings", () => {
    const input = makeInput([["mother", 1], ["fullBrother", 2]]);
    expect(share(input, "mother").groupFraction.toString()).toBe("1/6");
  });

  it("son + daughter → residue 2:1 (son 2/3, daughter 1/3)", () => {
    const input = makeInput([["son", 1], ["daughter", 1]]);
    expect(share(input, "son").groupFraction.toString()).toBe("2/3");
    expect(share(input, "daughter").groupFraction.toString()).toBe("1/3");
    expect(share(input, "daughter").shareType).toBe("ASABAH_GHAYRIHI");
  });

  it("two sons + one daughter → residue over 5 heads (2/5, 2/5, 1/5)", () => {
    const input = makeInput([["son", 2], ["daughter", 1]]);
    expect(share(input, "son").groupFraction.toString()).toBe("4/5");
    expect(share(input, "son").finalFraction.toString()).toBe("2/5");
    expect(share(input, "daughter").groupFraction.toString()).toBe("1/5");
  });

  it("father takes 1/6 + residue with daughters only", () => {
    const input = makeInput([["father", 1], ["daughter", 1]]);
    expect(share(input, "daughter").groupFraction.toString()).toBe("1/2");
    expect(share(input, "father").groupFraction.toString()).toBe("1/2");
  });

  it("full sister takes residue beside a daughter (asabah ma'a al-ghayr)", () => {
    const input = makeInput([["daughter", 1], ["fullSister", 1]]);
    expect(share(input, "daughter").groupFraction.toString()).toBe("1/2");
    expect(share(input, "fullSister").groupFraction.toString()).toBe("1/2");
    expect(share(input, "fullSister").shareType).toBe("ASABAH_MA_GHAYR");
  });

  it("single full sister alone → 1/2 furud + radd = whole estate", () => {
    const input = makeInput([["fullSister", 1]]);
    expect(share(input, "fullSister").groupFraction.toString()).toBe("1");
  });

  it("paternal grandfather inherits as the father (Shafi'i)", () => {
    const input = makeInput([["wife", 1], ["paternalGrandfather", 1]]);
    expect(share(input, "wife").groupFraction.toString()).toBe("1/4");
    expect(share(input, "paternalGrandfather").groupFraction.toString()).toBe("3/4");
  });

  it("grandmothers share one sixth equally", () => {
    const input = makeInput([["paternalGrandmother", 1], ["maternalGrandmother", 1], ["son", 1]]);
    expect(share(input, "paternalGrandmother").groupFraction.toString()).toBe("1/12");
    expect(share(input, "maternalGrandmother").groupFraction.toString()).toBe("1/12");
  });

  it("maternal siblings: one takes 1/6, two or more share 1/3 equally (male = female)", () => {
    const one = makeInput([["maternalHalfBrother", 1], ["fullBrother", 1]]);
    expect(share(one, "maternalHalfBrother").groupFraction.toString()).toBe("1/6");

    const two = makeInput([["maternalHalfBrother", 1], ["maternalHalfSister", 1], ["fullBrother", 1]]);
    expect(share(two, "maternalHalfBrother").groupFraction.toString()).toBe("1/6");
    expect(share(two, "maternalHalfSister").groupFraction.toString()).toBe("1/6");
    expect(share(two, "fullBrother").groupFraction.toString()).toBe("2/3");
  });

  it("son's daughter takes the 1/6 complement with one daughter", () => {
    const input = makeInput([["daughter", 1], ["sonsDaughter", 1]]);
    expect(share(input, "daughter").groupFraction.toString()).toBe("1/2");
    expect(share(input, "sonsDaughter").groupFraction.toString()).toBe("1/6");
  });
});

describe("Awl — العول", () => {
  it("husband + two full sisters → awl base 7: 3/7 and 4/7", () => {
    const input = makeInput([["husband", 1], ["fullSister", 2]], "female");
    const r = calculate(input);
    expect(r.awl.applied).toBe(true);
    expect(share(input, "husband").groupFraction.toString()).toBe("3/7");
    expect(share(input, "fullSister").groupFraction.toString()).toBe("4/7");
  });

  it("does not apply awl when shares fit", () => {
    const r = calculate(makeInput([["wife", 1], ["son", 1]]));
    expect(r.awl.applied).toBe(false);
  });
});

describe("Radd — الرد (Shafi'i: spouses excluded)", () => {
  it("mother alone → 1/3 + radd = whole estate", () => {
    const input = makeInput([["mother", 1]]);
    expect(share(input, "mother").groupFraction.toString()).toBe("1");
  });

  it("daughter alone → 1/2 + radd = whole estate", () => {
    const input = makeInput([["daughter", 1]]);
    expect(share(input, "daughter").groupFraction.toString()).toBe("1");
  });

  it("husband + mother → husband 1/2, mother 1/3 + radd 1/6 = 1/2", () => {
    const input = makeInput([["husband", 1], ["mother", 1]], "female");
    const r = calculate(input);
    expect(r.radd.applied).toBe(true);
    expect(share(input, "husband").groupFraction.toString()).toBe("1/2");
    expect(share(input, "mother").groupFraction.toString()).toBe("1/2");
  });

  it("daughter + son's daughter → proportional radd (3/4, 1/4)", () => {
    const input = makeInput([["daughter", 1], ["sonsDaughter", 1]]);
    expect(share(input, "daughter").groupFraction.toString()).toBe("3/4");
    expect(share(input, "sonsDaughter").groupFraction.toString()).toBe("1/4");
  });

  it("husband alone → 1/2, remainder to bayt al-mal (no radd to spouses)", () => {
    const input = makeInput([["husband", 1]], "female");
    const r = calculate(input);
    expect(share(input, "husband").groupFraction.toString()).toBe("1/2");
    expect(r.baytAlMal?.fraction.toString()).toBe("1/2");
  });

  it("no heirs at all → whole estate to bayt al-mal", () => {
    const input = makeInput([["maternalGrandfather", 1]]);
    const r = calculate(input);
    expect(r.baytAlMal?.fraction.toString()).toBe("1");
  });
});

describe("Hajb in the full pipeline", () => {
  it("spec example: wife, mother, father, 2 sons, 1 daughter, full brother", () => {
    const input = makeInput([["wife", 1], ["mother", 1], ["father", 1], ["son", 2], ["daughter", 1], ["fullBrother", 1]]);
    const r = calculate(input);

    expect(share(input, "wife").groupFraction.toString()).toBe("1/8");
    expect(share(input, "mother").groupFraction.toString()).toBe("1/6");
    expect(share(input, "father").groupFraction.toString()).toBe("1/6");

    const brother = r.heirs.find((h) => h.relationship === "fullBrother");
    expect(brother?.status).toBe("BLOCKED");
    expect(brother?.blockedBy).toContain("son");

    // residue 13/24 over 5 heads
    const son = share(input, "son");
    expect(son.finalFraction.toString()).toBe("13/60");
    expect(share(input, "daughter").finalFraction.toString()).toBe("13/120");
  });

  it("mushtarakah: husband, mother, 2 maternal siblings, 2 full brothers share the third equally", () => {
    const input = makeInput([["husband", 1], ["mother", 1], ["maternalHalfBrother", 1], ["maternalHalfSister", 1], ["fullBrother", 2]], "female");
    expect(share(input, "husband").groupFraction.toString()).toBe("1/2");
    expect(share(input, "mother").groupFraction.toString()).toBe("1/6");
    expect(share(input, "maternalHalfBrother").groupFraction.toString()).toBe("1/12");
    expect(share(input, "maternalHalfSister").groupFraction.toString()).toBe("1/12");
    expect(share(input, "fullBrother").groupFraction.toString()).toBe("1/6");
  });
});

describe("Percentages and money", () => {
  it("computes exact INR amounts (wife 1/8 of 1,000,000 = 125,000)", () => {
    const input = makeInput([["wife", 1], ["son", 1]], "male", 1000000);
    expect(share(input, "wife").amount).toBe(125000);
    expect(share(input, "wife").percentage).toBeCloseTo(12.5, 4);
    expect(share(input, "son").amount).toBe(875000);
  });

  it("rounds money to two decimals and distributes the whole estate", () => {
    const input = makeInput([["son", 1], ["daughter", 1]], "male", 1000000);
    const r = calculate(input);
    const son = share(input, "son");
    const daughter = share(input, "daughter");
    expect(son.amount).toBeCloseTo(666666.67, 2);
    expect(daughter.amount).toBeCloseTo(333333.33, 2);
    expect(r.distributedTotal).toBeCloseTo(1000000, 1);
  });

  it("per-person division for groups (two wives share the 1/8)", () => {
    const input = makeInput([["wife", 2], ["son", 1]], "male", 1000000);
    const wives = share(input, "wife");
    expect(wives.groupFraction.toString()).toBe("1/8");
    expect(wives.finalFraction.toString()).toBe("1/16");
    expect(wives.amount).toBe(62500);
  });
});
