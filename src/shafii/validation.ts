import type { CalculationInput } from "../engine/models";

export interface ValidationError {
  key: string;
}

/** Input validation — i18n keys are rendered by the UI. */
export function validateInput(input: CalculationInput): ValidationError[] {
  const errors: ValidationError[] = [];
  const d = input.deceased;

  if (d.estateValue === null || d.estateValue === undefined || Number.isNaN(d.estateValue)) {
    errors.push({ key: "error.estateRequired" });
  } else if (d.estateValue < 0) {
    errors.push({ key: "error.estateNegative" });
  }

  for (const rel of input.relatives) {
    if (!Number.isInteger(rel.count) || rel.count <= 0) {
      errors.push({ key: "error.countPositive" });
    }
    if (rel.relationship === "wife" && rel.count > 4) {
      errors.push({ key: "error.maxWives" });
    }
    if (rel.relationship === "husband" && rel.count > 1) {
      errors.push({ key: "error.maxHusbands" });
    }
  }

  if (input.relatives.length === 0) {
    errors.push({ key: "error.atLeastOne" });
  }

  const has = (r: string) => input.relatives.some((x) => x.relationship === r);
  if (has("husband") && d.gender === "male") errors.push({ key: "error.husbandForFemale" });
  if (has("wife") && d.gender === "female") errors.push({ key: "error.wifeForMale" });

  // duplicates are merged by the calculator; guard against structural impossibilities
  if (has("husband") && has("wife")) errors.push({ key: "error.bothSpouses" });

  return errors;
}
