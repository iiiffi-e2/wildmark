import { evaluateQuestProgress } from '@/src/domain/quests/evaluate';
import { leaksIdentity, revealMystery } from '@/src/domain/taxa/mystery';
import type { Taxon } from '@/src/domain/taxa/types';
import type { Quest } from '@/src/domain/quests/types';
import { mapConfidenceToKind } from '@/src/domain/identification/confidence';
import { identificationSafetyDisclaimer, safetyNotice } from '@/src/domain/safety/copy';
import { isAtLeastRank } from '@/src/domain/taxa/rank';

const cardinal: Taxon = {
  id: 'taxon-cardinal',
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

describe('quest evaluation', () => {
  test('completes First Five after five unique taxa', () => {
    const quest: Quest = {
      id: 'quest-first-five',
      name: 'First Five',
      description: 'Mark five species',
      requirements: [{ kind: 'uniqueTaxa', count: 5 }],
    };
    const userTaxa = ['a', 'b', 'c', 'd', 'e'].map((taxonId) => ({
      userId: 'user-1',
      taxonId,
      firstObservationId: `obs-${taxonId}`,
      firstSeenAt: '2026-08-29T12:00:00.000Z',
      lastSeenAt: '2026-08-29T12:00:00.000Z',
      observationCount: 1,
      favorite: false,
      verifiedStatus: 'userConfirmed' as const,
    }));

    const progress = evaluateQuestProgress(quest, {
      userId: 'user-1',
      userTaxa,
      taxaById: new Map(),
      collectionTaxonIdsByQuest: new Map(),
      observations: [],
      now: '2026-08-29T12:00:00.000Z',
    });

    expect(progress.current).toBe(5);
    expect(progress.completedAt).toBe('2026-08-29T12:00:00.000Z');
  });

  test('counts only birds toward Backyard Birds', () => {
    const quest: Quest = {
      id: 'quest-birds',
      name: 'Backyard Birds',
      description: 'Find three birds',
      requirements: [{ kind: 'category', category: 'bird', count: 3 }],
    };
    const monarch: Taxon = { ...cardinal, id: 'taxon-monarch', category: 'insect', commonName: 'Monarch' };
    const progress = evaluateQuestProgress(quest, {
      userId: 'user-1',
      userTaxa: [
        {
          userId: 'user-1',
          taxonId: cardinal.id,
          firstObservationId: 'obs-1',
          firstSeenAt: '2026-08-29T12:00:00.000Z',
          lastSeenAt: '2026-08-29T12:00:00.000Z',
          observationCount: 1,
          favorite: false,
          verifiedStatus: 'userConfirmed',
        },
        {
          userId: 'user-1',
          taxonId: monarch.id,
          firstObservationId: 'obs-2',
          firstSeenAt: '2026-08-29T12:00:00.000Z',
          lastSeenAt: '2026-08-29T12:00:00.000Z',
          observationCount: 1,
          favorite: false,
          verifiedStatus: 'userConfirmed',
        },
      ],
      taxaById: new Map([
        [cardinal.id, cardinal],
        [monarch.id, monarch],
      ]),
      collectionTaxonIdsByQuest: new Map(),
      observations: [],
      now: '2026-08-29T12:00:00.000Z',
    });

    expect(progress.current).toBe(1);
    expect(progress.completedAt).toBeNull();
  });
});

describe('mystery reveal', () => {
  test('does not leak identity in silhouette or clue levels', () => {
    for (const level of ['silhouette', 'basicClue', 'detailedClue'] as const) {
      const reveal = revealMystery(cardinal, level);
      expect(leaksIdentity(reveal, cardinal)).toBe(false);
    }
  });
});

describe('confidence mapping', () => {
  test('keeps close swallowtails as candidates instead of inventing certainty', () => {
    const kind = mapConfidenceToKind(
      {
        taxonId: 'tiger',
        confidence: 0.51,
        commonName: 'Eastern Tiger Swallowtail',
        scientificName: 'Papilio glaucus',
      },
      [
        {
          taxonId: 'giant',
          confidence: 0.37,
          commonName: 'Giant Swallowtail',
          scientificName: 'Papilio cresphontes',
        },
      ],
    );
    expect(kind).toBe('candidate');
  });

  test('treats family-level rank as valid', () => {
    expect(isAtLeastRank('family', 'species')).toBe(false);
    expect(isAtLeastRank('species', 'family')).toBe(true);
  });
});

describe('safety copy', () => {
  test('never claims an organism is safe to eat or handle', () => {
    expect(identificationSafetyDisclaimer().toLowerCase()).toContain('never');
    expect(safetyNotice('poisonous')).not.toMatch(/safe to eat/i);
    expect(safetyNotice('doNotHandle')).toMatch(/do not handle/i);
  });
});
