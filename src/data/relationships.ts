import type { Gender, RelativeCategory, RelationshipType } from "../engine/models";

export interface RelationshipMeta {
  type: RelationshipType;
  category: RelativeCategory;
  gender: Gender | null;
  /** Display priority inside its category. */
  order: number;
  /** Maximum count a user may enter. */
  max: number;
}

export const RELATIONSHIPS: RelationshipMeta[] = [
  { type: "husband", category: "immediate", gender: "male", order: 1, max: 1 },
  { type: "wife", category: "immediate", gender: "female", order: 2, max: 4 },
  { type: "son", category: "immediate", gender: "male", order: 3, max: 20 },
  { type: "daughter", category: "immediate", gender: "female", order: 4, max: 20 },
  { type: "father", category: "immediate", gender: "male", order: 5, max: 1 },
  { type: "mother", category: "immediate", gender: "female", order: 6, max: 1 },
  { type: "paternalGrandfather", category: "grandparents", gender: "male", order: 1, max: 1 },
  { type: "paternalGrandmother", category: "grandparents", gender: "female", order: 2, max: 2 },
  { type: "maternalGrandfather", category: "grandparents", gender: "male", order: 3, max: 1 },
  { type: "maternalGrandmother", category: "grandparents", gender: "female", order: 4, max: 2 },
  { type: "fullBrother", category: "siblings", gender: "male", order: 1, max: 20 },
  { type: "fullSister", category: "siblings", gender: "female", order: 2, max: 20 },
  { type: "paternalHalfBrother", category: "siblings", gender: "male", order: 3, max: 20 },
  { type: "paternalHalfSister", category: "siblings", gender: "female", order: 4, max: 20 },
  { type: "maternalHalfBrother", category: "siblings", gender: "male", order: 5, max: 20 },
  { type: "maternalHalfSister", category: "siblings", gender: "female", order: 6, max: 20 },
];

export function getRelationshipMeta(type: RelationshipType): RelationshipMeta {
  return RELATIONSHIPS.find((r) => r.type === type) ?? RELATIONSHIPS[0];
}
