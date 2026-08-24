import { F, Fraction } from "../engine/fractions";
import {
  RELATIONSHIP_ORDER,
  emptyCounts,
  type CalculationInput,
  type CalculationResult,
  type CalculationStep,
  type Counts,
  type EligibilityStatus,
  type HeirResult,
  type RelationshipType,
  type SharePart,
  type ShareType,
} from "../engine/models";
import { validateInput } from "./validation";
import { applyEligibility } from "./eligibility";
import { applyHajb } from "./hajb";
import { computeFixedShares, sumParts } from "./fixedShares";
import { computeAsabah } from "./asabah";
import { applyAwl } from "./awl";
import { applyRadd } from "./radd";

export interface CalculateOptions {
  currencyFormatter?: (value: number) => string;
}

/**
 * FARAI'D CALCULATION PIPELINE — Shafi'i school
 * USER INPUT → VALIDATE → FAMILY STRUCTURE → ELIGIBILITY → HAJB →
 * DHAWU AL-FURUD → ASABAH → RESIDUE → AWL → RADD → NORMALIZE →
 * PERCENTAGES → MONEY → EXPLANATION STEPS
 *
 * Pure and deterministic: no I/O, no UI logic.
 */
export function calculate(input: CalculationInput): CalculationResult {
  const steps: CalculationStep[] = [];

  // 1 — validate
  const errors = validateInput(input);
  if (errors.length > 0) {
    throw new Error(`Invalid input: ${errors.map((e) => e.key).join(", ")}`);
  }

  // 2 — build family structure
  const counts: Counts = emptyCounts();
  for (const rel of input.relatives) counts[rel.relationship] += rel.count;

  steps.push({
    id: 1,
    titleKey: "step.input",
    entries: (Object.keys(counts) as RelationshipType[])
      .filter((r) => counts[r] > 0)
      .map((r) => ({ relationship: r, count: counts[r], textKey: "step.entry.familyMember" })),
  });

  // 3 — eligibility
  const eligibility = applyEligibility(counts, input.deceased.gender);
  const statuses = new Map<RelationshipType, EligibilityStatus>();
  for (const rel of RELATIONSHIP_ORDER) {
    if (counts[rel] <= 0) continue;
    const e = eligibility.get(rel);
    statuses.set(rel, e?.status === "INELIGIBLE" ? "INELIGIBLE" : "ELIGIBLE");
  }
  const ineligibleEntries = [...eligibility.values()]
    .filter((d) => d.status === "INELIGIBLE")
    .map((d) => ({
      relationship: d.relationship,
      count: counts[d.relationship],
      textKey: d.reasonKey ?? "step.entry.ineligible",
      ruleId: d.reasonRuleId,
    }));
  steps.push({
    id: 2,
    titleKey: "step.eligibility",
    entries:
      ineligibleEntries.length > 0
        ? ineligibleEntries
        : [{ textKey: "step.entry.allEligible" }],
  });

  // 4 — hajb
  const hajb = applyHajb(counts, eligibility);
  for (const [rel, decision] of hajb.entries()) {
    if (decision.blocked && statuses.get(rel) !== "INELIGIBLE") statuses.set(rel, "BLOCKED");
  }
  steps.push({
    id: 3,
    titleKey: "step.hajb",
    entries:
      [...hajb.values()].filter((d) => d.blocked).length > 0
        ? [...hajb.values()]
            .filter((d) => d.blocked)
            .map((d) => ({
              relationship: d.relationship,
              count: counts[d.relationship],
              textKey: "step.entry.blocked",
              ruleId: d.ruleId,
              fraction: d.blockedBy.join(","),
            }))
        : [{ textKey: "step.entry.noHajb" }],
  });

  // 5 — dhawu al-furud
  const { parts: furudParts, meta } = computeFixedShares(counts, statuses, input.deceased.gender);
  steps.push({
    id: 4,
    titleKey: "step.furud",
    entries:
      furudParts.size > 0
        ? [...furudParts.entries()].flatMap(([rel, list]) =>
            list.map((p) => ({
              relationship: rel,
              count: counts[rel],
              textKey: p.labelKey,
              fraction: p.fraction.toString(),
              ruleId: p.ruleId,
            }))
          )
        : [{ textKey: "step.entry.noFurud" }],
  });

  // 6 — residue + asabah
  const furudTotal = sumParts(furudParts);
  const residue = Fraction.ONE.subtract(furudTotal);
  const asabah = computeAsabah(counts, statuses, meta, residue);

  const mergedParts = new Map<RelationshipType, SharePart[]>();
  for (const [rel, list] of furudParts.entries()) mergedParts.set(rel, [...list]);
  for (const [rel, list] of asabah.parts.entries()) {
    mergedParts.set(rel, [...(mergedParts.get(rel) ?? []), ...list]);
  }

  steps.push({
    id: 5,
    titleKey: "step.residue",
    entries: [
      { textKey: "step.entry.residueValue", fraction: residue.toString() },
      ...(asabah.parts.size > 0
        ? [...asabah.parts.entries()].map(([rel, list]) => ({
            relationship: rel,
            count: counts[rel],
            textKey: list[0]?.labelKey ?? "part.asabah",
            fraction: list.reduce((acc, p) => acc.add(p.fraction), Fraction.ZERO).toString(),
            ruleId: list[0]?.ruleId,
          }))
        : []),
      ...(asabah.parts.size === 0 && residue.greaterThan(Fraction.ZERO)
        ? [{ textKey: "step.entry.noAsabah" }]
        : []),
    ],
  });

  // 7 — awl
  const awl = applyAwl(mergedParts);
  let workingParts = awl.parts;
  if (awl.applied) {
    steps.push({
      id: 6,
      titleKey: "step.awl",
      entries: [
        { textKey: "step.entry.awlBase", fraction: awl.baseTotal.toString(), ruleId: "R-AWL-01" },
        ...[...awl.parts.entries()].map(([rel, list]) => ({
          relationship: rel,
          count: counts[rel],
          textKey: "step.entry.awlAdjusted",
          fraction: list.reduce((acc, p) => acc.add(p.fraction), Fraction.ZERO).toString(),
          ruleId: "R-AWL-01",
        })),
      ],
    });
  }

  // 8 — radd (only when no residuary took the residue)
  const asabahTook = asabah.parts.size > 0;
  const effectiveResidue = asabahTook ? Fraction.ZERO : residue;
  const radd = applyRadd(workingParts, effectiveResidue);
  workingParts = radd.parts;
  if (radd.applied) {
    steps.push({
      id: 7,
      titleKey: "step.radd",
      entries: [
        ...[...radd.parts.entries()].flatMap(([rel, list]) =>
          list
            .filter((p) => p.labelKey === "part.radd")
            .map((p) => ({
              relationship: rel,
              count: counts[rel],
              textKey: "step.entry.raddAdded",
              fraction: p.fraction.toString(),
              ruleId: "R-RADD-01",
            }))
        ),
      ],
    });
  } else if (!radd.baytResidue.isZero()) {
    steps.push({
      id: 7,
      titleKey: "step.radd",
      entries: [
        {
          textKey: radd.baytRuleId === "R-RADD-02" ? "step.entry.raddSpouseExcluded" : "step.entry.baytAll",
          fraction: radd.baytResidue.toString(),
          ruleId: radd.baytRuleId,
        },
      ],
    });
  }

  // 9 — normalize into group shares (per-person division for shared groups)
  const groupShareFor = (rel: RelationshipType): Fraction => {
    const partSum = (r: RelationshipType) =>
      (workingParts.get(r) ?? []).reduce((acc, p) => acc.add(p.fraction), Fraction.ZERO);

    if (meta.mushtarakahApplied && meta.maternalAnchor) {
      const pool = partSum(meta.maternalAnchor);
      if (rel === meta.maternalAnchor)
        return pool.multiply(F(meta.maternalCount, meta.mushtarakahHeads));
      if (rel === "fullBrother")
        return pool.multiply(F(counts.fullBrother, meta.mushtarakahHeads));
      // every other heir keeps their own assigned parts
    }
    if (
      meta.grandmotherAnchor &&
      (rel === "paternalGrandmother" || rel === "maternalGrandmother")
    ) {
      const pool = partSum(meta.grandmotherAnchor);
      if (meta.grandmotherCount === 0) return Fraction.ZERO;
      return pool.multiply(F(counts[rel], meta.grandmotherCount));
    }
    if (meta.maternalAnchor && (rel === "maternalHalfBrother" || rel === "maternalHalfSister")) {
      const pool = partSum(meta.maternalAnchor);
      if (meta.maternalCount === 0) return Fraction.ZERO;
      return pool.multiply(F(counts[rel], meta.maternalCount));
    }
    return partSum(rel);
  };

  const baytFraction = radd.baytResidue;

  // 10 — heir results, percentages, money
  const heirs: HeirResult[] = [];
  const est = input.deceased.estateValue;
  const money = (f: Fraction) => Math.round(est * f.toDecimal(12) * 100) / 100;

  for (const rel of RELATIONSHIP_ORDER) {
    if (counts[rel] <= 0) continue;
    const status = statuses.get(rel) ?? "ELIGIBLE";
    const hajbDecision = hajb.get(rel);
    const eligDecision = eligibility.get(rel);

    const groupFraction = status === "ELIGIBLE" ? groupShareFor(rel) : Fraction.ZERO;
    const finalFraction = groupFraction.multiply(F(1, counts[rel]));
    const parts = status === "ELIGIBLE" ? workingParts.get(rel) ?? [] : [];

    let shareType: ShareType = "NONE";
    if (status === "ELIGIBLE" && !groupFraction.isZero()) {
      const hasAsabah = parts.some((p) => p.labelKey === "part.asabah");
      const hasMaGhayr = parts.some((p) => p.labelKey === "part.asabahMaghayr");
      if (hasMaGhayr) shareType = "ASABAH_MA_GHAYR";
      else if (hasAsabah)
        shareType = rel === "daughter" || rel === "sonsDaughter" || rel === "fullSister" || rel === "paternalHalfSister"
          ? "ASABAH_GHAYRIHI"
          : "ASABAH_NAFSIHI";
      else shareType = "FIXED";
    }

    heirs.push({
      id: rel,
      relationship: rel,
      count: counts[rel],
      gender: genderOf(rel),
      alive: true,
      status,
      shareType,
      blockedBy: hajbDecision?.blockedBy ?? [],
      reasonRuleId: hajbDecision?.blocked ? hajbDecision.ruleId : eligDecision?.reasonRuleId,
      reasonKey: hajbDecision?.blocked ? "reason.blockedBy" : eligDecision?.reasonKey,
      parts,
      finalFraction,
      groupFraction,
      percentage: groupFraction.toPercentage(4),
      amount: money(finalFraction),
      groupAmount: money(groupFraction),
    });
  }

  // Final distribution step
  steps.push({
    id: 8,
    titleKey: "step.final",
    entries: [
      ...heirs
        .filter((h) => h.status === "ELIGIBLE")
        .map((h) => ({
          relationship: h.relationship,
          count: h.count,
          textKey: "step.entry.finalShare",
          fraction: h.groupFraction.toString(),
        })),
      ...(!baytFraction.isZero()
        ? [{ textKey: "step.entry.baytFinal", fraction: baytFraction.toString(), ruleId: radd.baytRuleId }]
        : []),
    ],
  });
  steps.push({
    id: 9,
    titleKey: "step.money",
    entries: [
      ...heirs
        .filter((h) => h.status === "ELIGIBLE" && !h.groupFraction.isZero())
        .map((h) => ({
          relationship: h.relationship,
          count: h.count,
          textKey: "step.entry.amount",
        })),
      { textKey: "step.entry.totalEstate" },
    ],
  });

  const eligibleHeirs = heirs.filter((h) => h.status === "ELIGIBLE");
  const distributedTotal =
    Math.round((eligibleHeirs.reduce((s, h) => s + h.groupAmount, 0) + (baytFraction.isZero() ? 0 : money(baytFraction))) * 100) / 100;

  return {
    input,
    heirs,
    eligibleHeirs,
    blockedHeirs: heirs.filter((h) => h.status === "BLOCKED"),
    ineligibleHeirs: heirs.filter((h) => h.status === "INELIGIBLE"),
    baytAlMal: baytFraction.isZero()
      ? null
      : { fraction: baytFraction, amount: money(baytFraction), ruleId: radd.baytRuleId },
    awl: { applied: awl.applied, baseTotal: awl.baseTotal.toString() },
    radd: { applied: radd.applied, residue: effectiveResidue.toString() },
    steps,
    estateValue: est,
    distributable: est,
    distributedTotal,
    generatedAt: new Date().toISOString(),
  };
}

function genderOf(rel: RelationshipType): "male" | "female" | null {
  const male: RelationshipType[] = [
    "husband", "son", "sonsSon", "father", "paternalGrandfather", "maternalGrandfather",
    "fullBrother", "paternalHalfBrother", "maternalHalfBrother",
  ];
  const female: RelationshipType[] = [
    "wife", "daughter", "sonsDaughter", "mother", "paternalGrandmother", "maternalGrandmother",
    "fullSister", "paternalHalfSister", "maternalHalfSister",
  ];
  if (male.includes(rel)) return "male";
  if (female.includes(rel)) return "female";
  return null;
}
