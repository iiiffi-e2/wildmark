import { getRecommendations, nearCompletions } from '@/src/domain/progression/next-discovery';
import { monthlyRecap } from '@/src/domain/progression/recap';
import { personalRecordsFor, rarityFromOccurrence, rarityLabel } from '@/src/domain/progression/rarity';
import type { Taxon } from '@/src/domain/taxa/types';

const monarch: Taxon = {
  id: 'taxon-monarch',
  canonicalId: 'danaus-plexippus',
  rank: 'species',
  parentTaxonId: null,
  commonName: 'Monarch Butterfly',
  scientificName: 'Danaus plexippus',
  kingdom: 'Animalia',
  phylum: 'Arthropoda',
  className: 'Insecta',
  orderName: 'Lepidoptera',
  family: 'Nymphalidae',
  genus: 'Danaus',
  species: 'plexippus',
  category: 'insect',
  conservationStatus: 'leastConcern',
  habitat: 'meadow',
  nocturnal: false,
  pollinator: true,
  cachedAt: '2026-08-29T00:00:00.000Z',
};

describe('near completions and recommendations', () => {
  test('surfaces one-more collection and quest goals', () => {
    const close = nearCompletions({
      collections: [
        {
          collectionId: 'col-pollinators',
          collectionName: 'Pollinators',
          previousCount: 3,
          discoveredCount: 4,
          totalCount: 5,
          newlyCompleted: false,
        },
      ],
      quests: [
        {
          questId: 'quest-first-five',
          questName: 'First Five',
          current: 4,
          target: 5,
          newlyCompleted: false,
        },
      ],
      speciesCount: 4,
    });
    expect(close.some((item) => item.title.includes('Pollinators') && item.remaining === 1)).toBe(true);
    expect(close.some((item) => item.title.includes('First Five'))).toBe(true);
  });

  test('prioritizes a close quest over filler', () => {
    const recommendations = getRecommendations({
      nearby: [{ taxonId: 'taxon-dandelion', likelihood: 0.9, occurrenceClass: 'veryLikely' }],
      discoveredIds: new Set(),
      taxaById: new Map([[monarch.id, monarch]]),
      collections: [],
      quests: [{ questId: 'quest-first-five', questName: 'The First Five', current: 4, target: 5, newlyCompleted: false }],
      userTaxa: [],
      hour: 10,
    });
    expect(recommendations[0]?.kind).toBe('nearQuest');
    expect(recommendations[0]?.title.toLowerCase()).toContain('one more');
  });
});

describe('rarity', () => {
  test('maps occurrence class without inventing percentages', () => {
    expect(rarityFromOccurrence('veryLikely')).toBe('commonNearby');
    expect(rarityFromOccurrence('rare')).toBe('rareFind');
    expect(rarityLabel('rareFind')).toBe('Rare find');
    expect(rarityLabel('rareFind')).not.toMatch(/%/);
  });

  test('records a first insect as a personal first-in-category', () => {
    const records = personalRecordsFor({
      isNewWildmark: true,
      taxon: monarch,
      userTaxa: [
        {
          userId: 'user-1',
          taxonId: monarch.id,
          firstObservationId: 'obs-1',
          firstSeenAt: '2026-08-29T12:00:00.000Z',
          lastSeenAt: '2026-08-29T12:00:00.000Z',
          observationCount: 1,
          favorite: false,
          verifiedStatus: 'userConfirmed',
        },
      ],
      previousUserTaxa: [],
      taxaById: new Map([[monarch.id, monarch]]),
      observations: [],
    });
    expect(records.some((item) => item.kind === 'firstInCategory')).toBe(true);
  });
});

describe('monthly recap', () => {
  test('counts new species and observations in the month', () => {
    const recap = monthlyRecap({
      month: new Date('2026-08-15T12:00:00.000Z'),
      observations: [
        {
          id: 'obs-1',
          remoteId: null,
          userId: 'user-1',
          observedAt: '2026-08-16T12:00:00.000Z',
          taxonId: monarch.id,
          identificationStatus: 'identified',
          confidence: 0.9,
          latitude: null,
          longitude: null,
          locationAccuracy: null,
          localityLabel: 'Allen, Texas',
          notes: null,
          favorite: false,
          createdAt: '2026-08-16T12:00:00.000Z',
          updatedAt: '2026-08-16T12:00:00.000Z',
          syncState: 'pending',
        },
      ],
      userTaxa: [
        {
          userId: 'user-1',
          taxonId: monarch.id,
          firstObservationId: 'obs-1',
          firstSeenAt: '2026-08-16T12:00:00.000Z',
          lastSeenAt: '2026-08-16T12:00:00.000Z',
          observationCount: 1,
          favorite: false,
          verifiedStatus: 'userConfirmed',
        },
      ],
      taxaById: new Map([[monarch.id, monarch]]),
      collections: [
        {
          collectionId: 'col-pollinators',
          collectionName: 'Pollinators',
          previousCount: 0,
          discoveredCount: 1,
          totalCount: 4,
          newlyCompleted: false,
        },
      ],
      nearby: [],
    });
    expect(recap.newSpecies).toBe(1);
    expect(recap.observations).toBe(1);
    expect(recap.places).toBe(1);
    expect(recap.closestGoal).toContain('Pollinators');
  });
});
