import type { Counts, EligibilityStatus, RelationshipType, RuleVerificationStatus } from "../engine/models";

/**
 * ═══════════════════════════════════════════════════════════════════
 *  SPECIAL ASABAH / RESIDUE RULES — قواعد العصبة الخاصة
 * ───────────────────────────────────────────────────────────────────
 *  Cases where an apparently problematic fixed-share combination is
 *  resolved through an applicable Asabah/residue rule INSTEAD of Awl.
 *
 *  Pipeline guarantee: these rules are evaluated AFTER hajb, fixed
 *  shares and the asabah analysis, and BEFORE any Awl consideration.
 *  Awl is applied only when no applicable residue rule resolves the
 *  case (see awl.ts → shouldApplyAwl).
 *
 *  RELIGIOUS SAFETY: the rule below is supplied for this project and
 *  remains PENDING_SCHOLAR_VERIFICATION. It is NOT generalized: it
 *  applies only when its exact conditions hold, and Awl remains fully
 *  operational for every other case.
 * ═══════════════════════════════════════════════════════════════════
 */

/** Exact Arabic report — preserved verbatim as supplied to this project. */
export const SPECIAL_RULE_SOURCE_TEXT =
  "للإبنة النصف ولابنة الابن السدس تكملة للثلثين ، وما بقي فللأخت";

export interface SpecialAsabahRuleDefinition {
  id: string;
  /** Id of the matching entry in the central Shafi'i rule register. */
  registerRuleId: string;
  madhhab: "Shafii";
  category: "SPECIAL_ASABAH";
  priority: "HIGH";
  sourceText: string;
  interpretation: { ar: string; en: string };
  /** i18n keys of the exact conditions (all must pass). */
  conditions: string[];
  fixedShares: { daughter: string; sonsDaughter: string };
  residueRecipient: RelationshipType;
  residueType: "ASABAH";
  awl: boolean;
  verificationStatus: "PENDING_SCHOLAR_VERIFICATION";
}

export const SPECIAL_ASABAH_RULE: SpecialAsabahRuleDefinition = {
  id: "SHAFII_SPECIAL_ASABAH_REMAINDER_DAUGHTER_GRANDDAUGHTER_SISTER",
  registerRuleId: "R-SPECIAL-ASABAH-01",
  madhhab: "Shafii",
  category: "SPECIAL_ASABAH",
  priority: "HIGH",
  sourceText: SPECIAL_RULE_SOURCE_TEXT,
  interpretation: {
    ar: "للبنت النصف فرضًا، ولابنة الابن السدس تكملة الثلثين، وما بقي فللأخت الشقيقة عصبةً؛ فلا يُطبَّق العول في هذه الصورة.",
    en: "The daughter takes 1/2, the son's daughter takes 1/6 completing 2/3, and the full sister takes the remainder as asabah; awl is therefore excluded.",
  },
  conditions: [
    "specialCond.oneDaughter",
    "specialCond.sonsDaughter",
    "specialCond.fullSister",
    "specialCond.noMaleResiduary",
  ],
  fixedShares: { daughter: "1/2", sonsDaughter: "1/6" },
  residueRecipient: "fullSister",
  residueType: "ASABAH",
  awl: false,
  verificationStatus: "PENDING_SCHOLAR_VERIFICATION",
};

export interface SpecialAsabahCheckResult {
  matched: boolean;
  /** Per-condition evaluation — exposed in reviewer mode for audit. */
  evaluation: { conditionKey: string; passed: boolean }[];
}

export interface SpecialAsabahContext {
  counts: Counts;
  /** Eligibility statuses AFTER hajb has been applied. */
  statuses: Map<RelationshipType, EligibilityStatus>;
}

/**
 * Checks every special asabah/residue rule against the family context.
 * Currently one rule is specified: daughter + son's daughter + sister.
 * New verified rules are added here — never hard-coded in the UI.
 */
export function checkSpecialAsabahRules(ctx: SpecialAsabahContext): SpecialAsabahCheckResult {
  const { counts, statuses } = ctx;
  const eligible = (r: RelationshipType) => (counts[r] ?? 0) > 0 && statuses.get(r) === "ELIGIBLE";

  const evaluation: { conditionKey: string; passed: boolean }[] = [
    // Exactly one daughter (two daughters exhaust 2/3 and block the son's daughter).
    { conditionKey: "specialCond.oneDaughter", passed: eligible("daughter") && counts.daughter === 1 },
    // At least one son's daughter who is not blocked.
    { conditionKey: "specialCond.sonsDaughter", passed: eligible("sonsDaughter") },
    // At least one full sister who is not blocked (الأخت in the report).
    { conditionKey: "specialCond.fullSister", passed: eligible("fullSister") },
    // No male residuary who would take the residue instead of the sister.
    {
      conditionKey: "specialCond.noMaleResiduary",
      passed:
        !eligible("son") &&
        !eligible("sonsSon") &&
        !eligible("father") &&
        !eligible("paternalGrandfather") &&
        !eligible("fullBrother") &&
        !eligible("paternalHalfBrother"),
    },
  ];

  return { matched: evaluation.every((c) => c.passed), evaluation };
}

/* ───────────────────────────────────────────────────────────────────
 *  FEMALE HEIRS AS ASABAH — explicit rules table (review §7)
 *  Female heir → condition → asabah type → who causes it → residue.
 *  No generic statement; each row is a separate verified rule.
 * ─────────────────────────────────────────────────────────────────── */

export interface FemaleAsabahRule {
  heir: RelationshipType;
  conditionKey: string;
  asabahType: "ASABAH_GHAYRIHI" | "ASABAH_MA_GHAYR";
  causedByKey: string;
  residueKey: string;
  ruleId: string;
  verificationStatus: RuleVerificationStatus;
}

export const FEMALE_ASABAH_TABLE: FemaleAsabahRule[] = [
  {
    heir: "daughter",
    conditionKey: "femAsabah.daughter.cond",
    asabahType: "ASABAH_GHAYRIHI",
    causedByKey: "femAsabah.daughter.causedBy",
    residueKey: "femAsabah.daughter.residue",
    ruleId: "R-ASABAH-2TO1-01",
    verificationStatus: "VERIFIED",
  },
  {
    heir: "sonsDaughter",
    conditionKey: "femAsabah.sonsDaughter.cond",
    asabahType: "ASABAH_GHAYRIHI",
    causedByKey: "femAsabah.sonsDaughter.causedBy",
    residueKey: "femAsabah.sonsDaughter.residue",
    ruleId: "R-ASABAH-2TO1-01",
    verificationStatus: "VERIFIED",
  },
  {
    heir: "fullSister",
    conditionKey: "femAsabah.fullSister.cond",
    asabahType: "ASABAH_MA_GHAYR",
    causedByKey: "femAsabah.fullSister.causedBy",
    residueKey: "femAsabah.fullSister.residue",
    ruleId: "R-ASABAH-MAGHAYR-01",
    verificationStatus: "VERIFIED",
  },
  {
    heir: "paternalHalfSister",
    conditionKey: "femAsabah.paternalHalfSister.cond",
    asabahType: "ASABAH_MA_GHAYR",
    causedByKey: "femAsabah.paternalHalfSister.causedBy",
    residueKey: "femAsabah.paternalHalfSister.residue",
    ruleId: "R-ASABAH-MAGHAYR-01",
    verificationStatus: "VERIFIED",
  },
];
