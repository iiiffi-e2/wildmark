import { evaluateMilestones, explorerRank } from '@/src/domain/milestones/evaluate';
import type { Taxon } from '@/src/domain/taxa/types';
import type { UserTaxon } from '@/src/domain/observations/types';

const cardinal: Taxon = {
  id: 'taxon-northern-cardinal',
  canonicalId: 'cardinalis-cardinalis',
  rank: 'species',
  parentTaxonId: null,
  commonName: 'Northern Cardinal',
  scientificName: 'Cardinalis cardinalis',
  kingdom: 'Animalia',
  phylum: 'Chordata',
  className: 'Aves',
  orderName: 'Passeriformes',
  family: 'Cardinalidae',
  genus: 'Cardinalis',
  species: 'cardinalis',
  category: 'bird',
  conservationStatus: 'leastConcern',
  habitat: 'backyard',
  nocturnal: false,
  pollinator: false,
  cachedAt: '2026-08-29T00:00:00.000Z',
};

function owned(count: number, categoryTaxon: Taxon = cardinal): UserTaxon[] {
  return Array.from({ length: count }, (_, index) => ({
    userId: 'user-1',
    taxonId: index === 0 ? categoryTaxon.id : `taxon-${index}`,
    firstObservationId: `obs-${index}`,
    firstSeenAt: '2026-08-29T12:00:00.000Z',
    lastSeenAt: '2026-08-29T12:00:00.000Z',
    observationCount: 1,
    favorite: false,
    verifiedStatus: 'userConfirmed' as const,
  }));
}

describe('milestone engine', () => {
  test('unlocks First Wildmark once on the first species', () => {
    const taxaById = new Map([[cardinal.id, cardinal]]);
    const first = evaluateMilestones({
      isNewWildmark: true,
      taxon: cardinal,
      userTaxa: owned(1),
      taxaById,
      collectionDeltas: [],
      alreadyUnlocked: new Set(),
      now: '2026-08-29T12:00:00.000Z',
    });
    expect(first.map((item) => item.id)).toContain('ms-first-wildmark');
    expect(first.map((item) => item.id)).toContain('ms-first-bird');

    const second = evaluateMilestones({
      isNewWildmark: true,
      taxon: cardinal,
      userTaxa: owned(1),
      taxaById,
      collectionDeltas: [],
      alreadyUnlocked: new Set(first.map((item) => item.id)),
      now: '2026-08-29T13:00:00.000Z',
    });
    expect(second).toHaveLength(0);
  });

  test('unlocks First Five at five unique taxa and not before', () => {
    const four = evaluateMilestones({
      isNewWildmark: true,
      taxon: cardinal,
      userTaxa: owned(4),
      taxaById: new Map([[cardinal.id, cardinal]]),
      collectionDeltas: [],
      alreadyUnlocked: new Set(['ms-first-wildmark', 'ms-first-bird']),
      now: '2026-08-29T12:00:00.000Z',
    });
    expect(four.map((item) => item.id)).not.toContain('ms-first-five');

    const five = evaluateMilestones({
      isNewWildmark: true,
      taxon: cardinal,
      userTaxa: owned(5),
      taxaById: new Map([[cardinal.id, cardinal]]),
      collectionDeltas: [],
      alreadyUnlocked: new Set(['ms-first-wildmark', 'ms-first-bird']),
      now: '2026-08-29T12:00:00.000Z',
    });
    expect(five.map((item) => item.id)).toContain('ms-first-five');
  });

  test('collection completion milestone fires only when newly completed', () => {
    const unlocked = evaluateMilestones({
      isNewWildmark: true,
      taxon: cardinal,
      userTaxa: owned(3),
      taxaById: new Map([[cardinal.id, cardinal]]),
      collectionDeltas: [
        {
          collectionId: 'col-birds',
          collectionName: 'Birds',
          previousCount: 2,
          discoveredCount: 3,
          totalCount: 3,
          newlyCompleted: true,
        },
      ],
      alreadyUnlocked: new Set(),
      now: '2026-08-29T12:00:00.000Z',
    }, [
      { id: 'ms-birds-complete', name: 'Birds complete', kind: 'collectionComplete', collectionId: 'col-birds' },
    ]);
    expect(unlocked.map((item) => item.id)).toEqual(['ms-birds-complete']);
  });

  test('explorer rank stays thematic and ungated', () => {
    expect(explorerRank(0).name).toBe('Observer');
    expect(explorerRank(5).name).toBe('Scout');
    expect(explorerRank(50).name).toBe('Wayfinder');
  });
});
