export const TAXON_SAFETY_FLAGS = [
  'venomous',
  'poisonous',
  'toxic',
  'irritant',
  'dangerousWildlife',
  'doNotHandle',
  'protected',
  'sensitiveLocation',
] as const;

export type TaxonSafetyFlag = (typeof TAXON_SAFETY_FLAGS)[number];
