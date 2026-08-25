import type { Fraction } from "./fractions";

export type Gender = "male" | "female";

/**
 * Relationship vocabulary. The model is intentionally extensible:
 * sonsSon / sonsDaughter are part of the engine vocabulary so further
 * relatives can be added later behind the same verified Shafi'i rule set.
 */
export type RelationshipType =
  | "husband"
  | "wife"
  | "son"
  | "daughter"
  | "sonsSon"
  | "sonsDaughter"
  | "father"
  | "mother"
  | "paternalGrandfather"
  | "paternalGrandmother"
  | "maternalGrandfather"
  | "maternalGrandmother"
  | "fullBrother"
  | "fullSister"
  | "paternalHalfBrother"
  | "paternalHalfSister"
  | "maternalHalfBrother"
  | "maternalHalfSister";

export type RelativeCategory = "immediate" | "grandparents" | "siblings";

export interface RelativeInput {
  relationship: RelationshipType;
  count: number;
}

export interface DeceasedInfo {
  gender: Gender;
  estateValue: number;
  currency: string;
  funeralExpenses: number;
  debts: number;
  bequest: number;
}

export interface CalculationInput {
  deceased: DeceasedInfo;
  relatives: RelativeInput[];
}

export type EligibilityStatus = "ELIGIBLE" | "BLOCKED" | "INELIGIBLE";

export type ShareType =
  | "NONE"
  | "FIXED"
  | "ASABAH_NAFSIHI"
  | "ASABAH_GHAYRIHI"
  | "ASABAH_MA_GHAYR"
  | "BAYT_AL_MAL";

export type RuleVerificationStatus = "VERIFIED" | "PENDING_REVIEW" | "NEEDS_REVISION";

export interface RuleReference {
  source: string;
  location: string;
}

export interface ShafiiRule {
  id: string;
  madhhab: "shafii";
  category: "ELIGIBILITY" | "HAJB" | "FURUD" | "ASABAH" | "AWL" | "RADD" | "BAYT_AL_MAL" | "SPECIAL_ASABAH";
  /** Verbatim source text of the rule's report, where supplied. */
  sourceText?: string;
  description: { ar: string; en: string; ml: string };
  conditions: { ar: string; en: string };
  result: { ar: string; en: string };
  priority: number;
  references: RuleReference[];
  verificationStatus: RuleVerificationStatus;
}

/** One additive piece of an heir's final share (furud, residue, radd…). */
export interface SharePart {
  labelKey: string;
  fraction: Fraction;
  ruleId: string;
}

export interface HeirResult {
  id: string;
  relationship: RelationshipType;
  count: number;
  gender: Gender | null;
  alive: boolean;
  status: EligibilityStatus;
  shareType: ShareType;
  blockedBy: RelationshipType[];
  reasonRuleId?: string;
  reasonKey?: string;
  parts: SharePart[];
  /** Share per single person of this relationship group. */
  finalFraction: Fraction;
  /** Group total share (finalFraction * count). */
  groupFraction: Fraction;
  percentage: number;
  /** Per-person amount. */
  amount: number;
  groupAmount: number;
}

export interface BaytAlMalResult {
  fraction: Fraction;
  amount: number;
  ruleId: string;
}

export interface StepEntry {
  relationship?: RelationshipType;
  textKey: string;
  fraction?: string;
  ruleId?: string;
  count?: number;
}

export interface CalculationStep {
  id: number;
  titleKey: string;
  entries: StepEntry[];
}

/** Why the engine did or did not apply Awl (reviewer-auditable). */
export interface AwlDecision {
  applies: boolean;
  reasonKey: string;
  ruleId?: string;
}

/** The special asabah/residue rule matched for this calculation, if any. */
export interface SpecialAsabahRuleMatch {
  ruleId: string;
  sourceText: string;
  fixedShares: { daughter: string; sonsDaughter: string };
  residueRecipient: RelationshipType;
  residueType: "ASABAH";
  awl: boolean;
  verificationStatus: "PENDING_SCHOLAR_VERIFICATION" | RuleVerificationStatus;
}

export interface SpecialAsabahConditionCheck {
  conditionKey: string;
  passed: boolean;
}

/** Full Awl-vs-Asabah decision trail for developer/reviewer mode. */
export interface AwlDebugInfo {
  furudTotal: string;
  potentialResidue: string;
  potentialAsabah: RelationshipType[];
  specialRuleId: string | null;
  specialAsabahEvaluation: SpecialAsabahConditionCheck[];
  awlCandidate: boolean;
  finalDecision: "ASABAH_RESIDUE" | "AWL" | "NO_ADJUSTMENT";
  ruleId?: string;
}

/** Compact distribution summary shown on the result screen. */
export interface DistributionSummary {
  fixedTotal: string;
  residue: string;
  asabahRecipients: RelationshipType[];
}

export interface CalculationResult {
  input: CalculationInput;
  heirs: HeirResult[];
  eligibleHeirs: HeirResult[];
  blockedHeirs: HeirResult[];
  ineligibleHeirs: HeirResult[];
  baytAlMal: BaytAlMalResult | null;
  awl: { applied: boolean; baseTotal: string; decision: AwlDecision };
  specialAsabah: SpecialAsabahRuleMatch | null;
  awlDebug: AwlDebugInfo;
  summary: DistributionSummary;
  radd: { applied: boolean; residue: string };
  steps: CalculationStep[];
  estateValue: number;
  distributable: number;
  distributedTotal: number;
  generatedAt: string;
}

export interface HistoryEntry {
  id: string;
  savedAt: string;
  label: string;
  input: CalculationInput;
}

export type Counts = Record<RelationshipType, number>;

export const RELATIONSHIP_ORDER: RelationshipType[] = [
  "husband",
  "wife",
  "father",
  "mother",
  "son",
  "daughter",
  "sonsSon",
  "sonsDaughter",
  "paternalGrandfather",
  "paternalGrandmother",
  "maternalGrandfather",
  "maternalGrandmother",
  "fullBrother",
  "fullSister",
  "paternalHalfBrother",
  "paternalHalfSister",
  "maternalHalfBrother",
  "maternalHalfSister",
];

export function emptyCounts(): Counts {
  const c = {} as Counts;
  for (const r of RELATIONSHIP_ORDER) c[r] = 0;
  return c;
}
