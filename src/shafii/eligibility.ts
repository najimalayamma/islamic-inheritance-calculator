import type { Counts, EligibilityStatus, Gender, RelationshipType } from "../engine/models";

export interface EligibilityDecision {
  relationship: RelationshipType;
  status: EligibilityStatus;
  reasonKey?: string;
  reasonRuleId?: string;
}

/**
 * Eligibility precedes hajb: it answers "can this relative inherit from
 * this deceased at all?" independently of who else survives.
 */
export function applyEligibility(counts: Counts, deceasedGender: Gender): Map<RelationshipType, EligibilityDecision> {
  const decisions = new Map<RelationshipType, EligibilityDecision>();
  const decide = (relationship: RelationshipType, status: EligibilityStatus, reasonKey?: string, reasonRuleId?: string) => {
    decisions.set(relationship, { relationship, status, reasonKey, reasonRuleId });
  };

  if (counts.husband > 0) {
    decide("husband", deceasedGender === "female" ? "ELIGIBLE" : "INELIGIBLE",
      deceasedGender === "female" ? undefined : "reason.spouseGenderMismatch", "R-ELIG-SPOUSE-01");
  }
  if (counts.wife > 0) {
    decide("wife", deceasedGender === "male" ? "ELIGIBLE" : "INELIGIBLE",
      deceasedGender === "male" ? undefined : "reason.spouseGenderMismatch", "R-ELIG-SPOUSE-01");
  }
  // Maternal grandfather: dhawu al-arham — does not inherit in the Shafi'i school.
  if (counts.maternalGrandfather > 0) {
    decide("maternalGrandfather", "INELIGIBLE", "reason.dhawuAlArham", "R-ELIG-ARHAM-01");
  }

  return decisions;
}
