import type { OccurrenceClass } from '@/src/services/occurrence/mock';
import type { Taxon } from '../taxa/types';
import type { ContextualRarity, PersonalRecord } from './types';
import type { UserTaxon } from '../observations/types';
import type { Observation } from '../observations/types';

export function rarityFromOccurrence(occurrenceClass?: OccurrenceClass, taxon?: Taxon | null): ContextualRarity | null {
  if (taxon?.habitat === 'roadside' && taxon.category === 'plant') {
    return 'seasonal';
  }
  if (!occurrenceClass) {
    return null;
  }
  switch (occurrenceClass) {
    case 'veryLikely':
      return 'commonNearby';
    case 'possible':
      return 'uncommon';
    case 'rare':
      return 'rareFind';
  }
}

export function rarityLabel(rarity: ContextualRarity | null): string | null {
  switch (rarity) {
    case 'veryCommon':
      return 'Very common';
    case 'commonNearby':
      return 'Common nearby';
    case 'uncommon':
      return 'Uncommon';
    case 'rareFind':
      return 'Rare find';
    case 'seasonal':
      return 'Seasonal';
    case 'migratory':
      return 'Migratory';
    case 'occasionalVisitor':
      return 'Occasional visitor';
    case null:
      return null;
  }
}

export function personalRecordsFor(input: {
  isNewWildmark: boolean;
  taxon: Taxon | null;
  userTaxa: UserTaxon[];
  previousUserTaxa: UserTaxon[];
  taxaById: Map<string, Taxon>;
  observations: Observation[];
}): PersonalRecord[] {
  const records: PersonalRecord[] = [];
  if (!input.taxon || !input.isNewWildmark) {
    return records;
  }
  const previousInCategory = input.previousUserTaxa.filter(
    (item) => input.taxaById.get(item.taxonId)?.category === input.taxon?.category,
  ).length;
  if (previousInCategory === 0) {
    records.push({ kind: 'firstInCategory', label: `First ${input.taxon.category}` });
    records.push({ kind: 'newCategory', label: 'New category' });
  }
  if (input.taxon.nocturnal) {
    const previousNight = input.previousUserTaxa.filter((item) => input.taxaById.get(item.taxonId)?.nocturnal).length;
    if (previousNight === 0) {
      records.push({ kind: 'firstNocturnal', label: 'First night discovery' });
    }
  }
  if (input.userTaxa.length === 100) {
    records.push({ kind: 'speciesCount', label: 'Your 100th species' });
  }
  const year = new Date().getFullYear();
  const earlierYears = input.observations.some((item) => new Date(item.observedAt).getFullYear() < year);
  if (earlierYears) {
    records.push({ kind: 'firstThisYear', label: "First one you've seen this year" });
  }
  return records;
}

export function repeatSightingContext(input: {
  userTaxon: UserTaxon;
  observations: Observation[];
  localityLabel?: string | null;
}): import('./types').RepeatSightingContext {
  const year = new Date(input.userTaxon.lastSeenAt).getFullYear();
  const earlierThisTaxon = input.observations.filter(
    (item) => item.taxonId === input.userTaxon.taxonId && new Date(item.observedAt).getFullYear() < year,
  );
  const localities = new Set(
    input.observations
      .filter((item) => item.taxonId === input.userTaxon.taxonId && item.localityLabel)
      .map((item) => item.localityLabel),
  );
  return {
    observationCount: input.userTaxon.observationCount,
    firstSeenAt: input.userTaxon.firstSeenAt,
    lastSeenAt: input.userTaxon.lastSeenAt,
    isFirstThisYear: earlierThisTaxon.length > 0,
    newLocality: Boolean(input.localityLabel && !localities.has(input.localityLabel)),
  };
}
