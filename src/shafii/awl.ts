import { Fraction } from "../engine/fractions";
import type { RelationshipType, SharePart } from "../engine/models";

export interface AwlResult {
  applied: boolean;
  baseTotal: Fraction;
  parts: Map<RelationshipType, SharePart[]>;
}

export interface AwlDecisionContext {
  furudTotal: Fraction;
  residue: Fraction;
  /** True when the asabah analysis assigned the residue to a residuary. */
  asabahTookResidue: boolean;
  /** True when a special asabah/residue rule resolved the case. */
  specialRuleResolved: boolean;
  specialRuleId?: string;
}

export interface AwlDecision {
  applies: boolean;
  reasonKey: string;
  ruleId?: string;
}

/**
 * AWL ENGINE — العول
 *
 * Ordering contract: this module must run ONLY after
 *   fixed shares determined → hajb determined → asabah analysis
 *   completed → special asabah/residue rules checked.
 *
 * The engine never decides "shares exceed 1 → immediately apply awl".
 * Before `applies: true` is returned, it confirms that no applicable
 * asabah/residue rule resolves the case — an apparent excess caused by
 * a fixed-share interpretation that a residue rule resolves is NOT awl.
 */
export function shouldApplyAwl(ctx: AwlDecisionContext): AwlDecision {
  // 1 — a special asabah/residue rule resolves the case → never awl.
  if (ctx.specialRuleResolved) {
    return {
      applies: false,
      reasonKey: "step.entry.awlNotAppliedSpecial",
      ruleId: ctx.specialRuleId ?? "R-SPECIAL-ASABAH-01",
    };
  }
  // 2 — the asabah analysis already assigned the residue → never awl.
  if (ctx.asabahTookResidue) {
    return { applies: false, reasonKey: "step.entry.awlNotAppliedAsabah", ruleId: "R-AWL-02" };
  }
  // 3 — only now: apparent fixed shares exceed the estate → awl.
  if (ctx.furudTotal.greaterThan(Fraction.ONE)) {
    return { applies: true, reasonKey: "step.entry.awlRequired", ruleId: "R-AWL-01" };
  }
  // 4 — shares fit within the estate → no adjustment.
  return { applies: false, reasonKey: "step.entry.awlNotApplied", ruleId: "R-AWL-02" };
}

/**
 * Proportional reduction of every share part over the awl base
 * (R-AWL-01). Called only when shouldApplyAwl returned applies: true.
 */
export function applyAwl(parts: Map<RelationshipType, SharePart[]>): AwlResult {
  let total = Fraction.ZERO;
  for (const list of parts.values()) {
    for (const p of list) total = total.add(p.fraction);
  }

  if (total.lessThan(Fraction.ONE) || total.equals(Fraction.ONE)) {
    return { applied: false, baseTotal: total, parts };
  }

  const scaled = new Map<RelationshipType, SharePart[]>();
  for (const [rel, list] of parts.entries()) {
    scaled.set(
      rel,
      list.map((p) => ({ ...p, fraction: p.fraction.divide(total) }))
    );
  }
  return { applied: true, baseTotal: total, parts: scaled };
}
