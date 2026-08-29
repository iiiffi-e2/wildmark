import { SEED_TAXA } from '@/src/data/seed';

export type OccurrenceClass = 'veryLikely' | 'possible' | 'rare';

export type OccurrenceResult = {
  taxonId: string;
  likelihood: number;
  occurrenceClass: OccurrenceClass;
};

export type OccurrenceQuery = {
  date?: string;
  category?: string;
  discoveredTaxonIds?: string[];
};

export interface OccurrenceService {
  getLikelyTaxa(query: OccurrenceQuery): Promise<OccurrenceResult[]>;
}

export class MockOccurrenceService implements OccurrenceService {
  async getLikelyTaxa(query: OccurrenceQuery): Promise<OccurrenceResult[]> {
    const discovered = new Set(query.discoveredTaxonIds ?? []);
    return SEED_TAXA.filter((taxon) => (query.category ? taxon.category === query.category : true))
      .map((taxon, index) => {
        const likelihood = taxon.habitat === 'backyard' || taxon.habitat === 'lawn' ? 0.82 : 0.48 - index * 0.01;
        return {
          taxonId: taxon.id,
          likelihood,
          occurrenceClass: (likelihood > 0.7 ? 'veryLikely' : likelihood > 0.4 ? 'possible' : 'rare') as OccurrenceClass,
        };
      })
      .sort((a, b) => b.likelihood - a.likelihood)
      .filter((item) => !discovered.has(item.taxonId) || true)
      .slice(0, 24);
  }
}
