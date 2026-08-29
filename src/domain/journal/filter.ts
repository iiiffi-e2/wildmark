import type { Observation } from '../observations/types';
import type { OrganismCategory, Taxon } from '../taxa/types';

export type JournalStatusFilter = 'all' | 'identified' | 'unidentified' | 'favorite';

export type JournalFilter = {
  query: string;
  category: OrganismCategory | 'all';
  status: JournalStatusFilter;
};

export function defaultJournalFilter(): JournalFilter {
  return { query: '', category: 'all', status: 'all' };
}

export function filterObservations(
  observations: Observation[],
  taxaById: Map<string, Taxon>,
  filter: JournalFilter,
): Observation[] {
  const query = filter.query.trim().toLowerCase();
  return observations.filter((observation) => {
    const taxon = observation.taxonId ? taxaById.get(observation.taxonId) : undefined;
    if (filter.category !== 'all' && taxon?.category !== filter.category) {
      return false;
    }
    if (filter.status === 'favorite' && !observation.favorite) {
      return false;
    }
    if (filter.status === 'identified' && observation.identificationStatus !== 'identified') {
      return false;
    }
    if (
      filter.status === 'unidentified' &&
      (observation.identificationStatus === 'identified' || observation.taxonId)
    ) {
      return false;
    }
    if (!query) {
      return true;
    }
    const haystack =
      `${taxon?.commonName ?? ''} ${taxon?.scientificName ?? ''} ${observation.notes ?? ''} ${observation.localityLabel ?? ''} unidentified`.toLowerCase();
    return haystack.includes(query);
  });
}

export function privacySafePlaces(observations: Observation[]): string[] {
  return [
    ...new Set(
      observations
        .map((item) => item.localityLabel)
        .filter((value): value is string => Boolean(value)),
    ),
  ];
}
