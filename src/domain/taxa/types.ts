export const TAXONOMIC_RANKS = [
  'kingdom',
  'phylum',
  'class',
  'order',
  'family',
  'genus',
  'species',
] as const;

export type TaxonomicRank = (typeof TAXONOMIC_RANKS)[number];

export const ORGANISM_CATEGORIES = [
  'bird',
  'insect',
  'plant',
  'fungi',
  'reptile',
  'mammal',
  'amphibian',
  'aquatic',
] as const;

export type OrganismCategory = (typeof ORGANISM_CATEGORIES)[number];

export type ConservationStatus =
  | 'unknown'
  | 'leastConcern'
  | 'nearThreatened'
  | 'vulnerable'
  | 'endangered'
  | 'criticallyEndangered';

export type Taxon = {
  id: string;
  canonicalId: string;
  rank: TaxonomicRank;
  parentTaxonId: string | null;
  commonName: string;
  scientificName: string;
  kingdom: string | null;
  phylum: string | null;
  className: string | null;
  orderName: string | null;
  family: string | null;
  genus: string | null;
  species: string | null;
  category: OrganismCategory;
  conservationStatus: ConservationStatus;
  habitat: string | null;
  nocturnal: boolean;
  pollinator: boolean;
  cachedAt: string;
};

export type TaxonName = {
  id: string;
  taxonId: string;
  name: string;
  locale: string;
  kind: 'common' | 'scientific' | 'alternate';
};

export type TaxonomyTrailItem = {
  rank: TaxonomicRank | 'informal';
  label: string;
};
