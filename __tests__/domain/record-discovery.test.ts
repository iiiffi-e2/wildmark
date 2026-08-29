import { createMemoryRepositories, createMemoryStore } from '@/src/testing/memory-store';
import type { AcceptIdentificationInput } from '@/src/domain/discovery/types';
import {
  correctObservationIdentification,
  recordAcceptedIdentification,
  recordUnidentifiedObservation,
} from '@/src/domain/discovery/record-discovery';
import type { Taxon } from '@/src/domain/taxa/types';
import type { Collection } from '@/src/domain/collections/types';
import type { Quest } from '@/src/domain/quests/types';

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

const monarch: Taxon = {
  ...cardinal,
  id: 'taxon-monarch',
  canonicalId: 'danaus-plexippus',
  commonName: 'Monarch Butterfly',
  scientificName: 'Danaus plexippus',
  className: 'Insecta',
  category: 'insect',
  pollinator: true,
};

const birds: Collection = {
  id: 'col-birds',
  name: 'Birds',
  description: 'Birds you can find nearby',
  type: 'taxonomic',
  coverCategory: 'bird',
};

const firstFive: Quest = {
  id: 'quest-first-five',
  name: 'First Five',
  description: 'Mark five species',
  requirements: [{ kind: 'uniqueTaxa', count: 5 }],
};

const backyardBirds: Quest = {
  id: 'quest-backyard-birds',
  name: 'Backyard Birds',
  description: 'Find three birds',
  requirements: [{ kind: 'category', category: 'bird', count: 3 }],
};

function sampleInput(overrides?: Partial<AcceptIdentificationInput>): AcceptIdentificationInput {
  return {
    userId: 'user-1',
    image: {
      localUri: 'file://cardinal.jpg',
      width: 1200,
      height: 1600,
      capturedAt: '2026-08-29T12:00:00.000Z',
    },
    observedAt: '2026-08-29T12:00:00.000Z',
    selectedTaxonId: cardinal.id,
    confidence: 0.94,
    identificationStatus: 'identified',
    identification: {
      engine: 'mock',
      modelVersion: 'fixtures-1',
      result: {
        kind: 'highConfidence',
        taxonId: cardinal.id,
        commonName: cardinal.commonName,
        scientificName: cardinal.scientificName,
        confidence: 0.94,
        trail: [
          { rank: 'kingdom', label: 'Animal' },
          { rank: 'class', label: 'Bird' },
          { rank: 'genus', label: 'Cardinal' },
          { rank: 'species', label: 'Northern Cardinal' },
        ],
      },
    },
    now: '2026-08-29T12:00:00.000Z',
    ...overrides,
  };
}

describe('recordAcceptedIdentification', () => {
  test('creates a New Wildmark the first time a taxon is collected', async () => {
    const store = createMemoryStore({
      taxa: [cardinal, monarch],
      collections: [birds],
      collectionTaxa: [{ collectionId: birds.id, taxonId: cardinal.id }],
      quests: [firstFive, backyardBirds],
    });
    const deps = createMemoryRepositories(store);

    const result = await recordAcceptedIdentification(deps, sampleInput());

    expect(result.isNewWildmark).toBe(true);
    expect(result.observationCountForTaxon).toBe(1);
    expect(result.taxonId).toBe(cardinal.id);
    expect(result.event).toMatchObject({
      userId: 'user-1',
      taxonId: cardinal.id,
      relevantCollectionIds: [birds.id],
    });
    expect(store.events).toHaveLength(1);
    expect(store.userTaxa[0]?.observationCount).toBe(1);
    expect(store.observations).toHaveLength(1);
    expect(store.photos).toHaveLength(1);
    expect(store.syncActions.some((action) => action.type === 'createObservation')).toBe(true);
    expect(result.collectionDeltas[0]).toMatchObject({
      collectionId: birds.id,
      previousCount: 0,
      discoveredCount: 1,
      totalCount: 1,
    });
    expect(result.milestones.map((item) => item.id)).toEqual(
      expect.arrayContaining(['ms-first-wildmark', 'ms-first-bird']),
    );
    expect(store.milestones.map((item) => item.id)).toEqual(
      expect.arrayContaining(['ms-first-wildmark', 'ms-first-bird']),
    );
  });

  test('does not unlock the same milestone twice', async () => {
    const store = createMemoryStore({
      taxa: [cardinal, monarch],
      collections: [birds],
      collectionTaxa: [
        { collectionId: birds.id, taxonId: cardinal.id },
        { collectionId: birds.id, taxonId: monarch.id },
      ],
      quests: [firstFive],
    });
    const deps = createMemoryRepositories(store);
    await recordAcceptedIdentification(deps, sampleInput());
    const secondSpecies = await recordAcceptedIdentification(
      deps,
      sampleInput({
        selectedTaxonId: monarch.id,
        observedAt: '2026-08-29T13:00:00.000Z',
        now: '2026-08-29T13:00:00.000Z',
        identification: {
          engine: 'mock',
          modelVersion: 'fixtures-1',
          result: {
            kind: 'highConfidence',
            taxonId: monarch.id,
            commonName: monarch.commonName,
            scientificName: monarch.scientificName,
            confidence: 0.9,
            trail: [],
          },
        },
      }),
    );
    expect(secondSpecies.milestones.map((item) => item.id)).not.toContain('ms-first-wildmark');
    expect(store.milestones.filter((item) => item.id === 'ms-first-wildmark')).toHaveLength(1);
  });

  test('uses occurrence class for rarity without inventing percentages', async () => {
    const store = createMemoryStore({
      taxa: [cardinal],
      collections: [birds],
      collectionTaxa: [{ collectionId: birds.id, taxonId: cardinal.id }],
      quests: [firstFive],
    });
    const deps = createMemoryRepositories(store);
    const result = await recordAcceptedIdentification(
      deps,
      sampleInput({ occurrenceClass: 'rare' }),
    );
    expect(result.rarity).toBe('rareFind');
    expect(result.rarityLabel).toBe('Rare find');
    expect(result.rarityLabel).not.toMatch(/%/);
  });

  test('records Another Sighting without a second Wildmark', async () => {
    const store = createMemoryStore({
      taxa: [cardinal],
      collections: [birds],
      collectionTaxa: [{ collectionId: birds.id, taxonId: cardinal.id }],
      quests: [firstFive],
    });
    const deps = createMemoryRepositories(store);

    await recordAcceptedIdentification(deps, sampleInput({ now: '2026-08-29T12:00:00.000Z' }));
    const second = await recordAcceptedIdentification(
      deps,
      sampleInput({
        observedAt: '2026-08-29T16:00:00.000Z',
        now: '2026-08-29T16:00:00.000Z',
      }),
    );

    expect(second.isNewWildmark).toBe(false);
    expect(second.event).toBeNull();
    expect(second.observationCountForTaxon).toBe(2);
    expect(store.events).toHaveLength(1);
    expect(store.userTaxa).toHaveLength(1);
    expect(store.userTaxa[0]?.observationCount).toBe(2);
    expect(store.observations).toHaveLength(2);
  });

  test('keeps an unidentified photograph when identification fails', async () => {
    const store = createMemoryStore({ taxa: [cardinal] });
    const deps = createMemoryRepositories(store);

    const result = await recordUnidentifiedObservation(deps, {
      userId: 'user-1',
      image: {
        localUri: 'file://blurry.jpg',
        width: 800,
        height: 800,
        capturedAt: '2026-08-29T12:00:00.000Z',
      },
      observedAt: '2026-08-29T12:00:00.000Z',
      status: 'failed',
      now: '2026-08-29T12:00:00.000Z',
    });

    expect(result.observationId).toBeTruthy();
    expect(store.observations[0]?.taxonId).toBeNull();
    expect(store.observations[0]?.identificationStatus).toBe('failed');
    expect(store.photos).toHaveLength(1);
    expect(store.userTaxa).toHaveLength(0);
    expect(store.events).toHaveLength(0);
  });

  test('does not create a Wildmark when the user saves an unconfirmed candidate', async () => {
    const store = createMemoryStore({ taxa: [cardinal] });
    const deps = createMemoryRepositories(store);

    const result = await recordAcceptedIdentification(
      deps,
      sampleInput({
        identificationStatus: 'ambiguous',
        confidence: 0.51,
        identification: {
          engine: 'mock',
          modelVersion: 'fixtures-1',
          result: {
            kind: 'candidate',
            summaryLabel: 'This looks like a swallowtail',
            candidates: [
              {
                taxonId: 'taxon-tiger-swallowtail',
                commonName: 'Eastern Tiger Swallowtail',
                scientificName: 'Papilio glaucus',
                confidence: 0.51,
                rankOrder: 1,
              },
              {
                taxonId: 'taxon-giant-swallowtail',
                commonName: 'Giant Swallowtail',
                scientificName: 'Papilio cresphontes',
                confidence: 0.37,
                rankOrder: 2,
              },
            ],
          },
        },
      }),
    );

    expect(result.isNewWildmark).toBe(false);
    expect(store.userTaxa).toHaveLength(0);
    expect(store.observations[0]?.identificationStatus).toBe('ambiguous');
  });
});

describe('correctObservationIdentification', () => {
  test('moves a collection unlock when taxonomy is corrected', async () => {
    const store = createMemoryStore({
      taxa: [cardinal, monarch],
      collections: [birds],
      collectionTaxa: [
        { collectionId: birds.id, taxonId: cardinal.id },
        { collectionId: birds.id, taxonId: monarch.id },
      ],
      quests: [firstFive],
    });
    const deps = createMemoryRepositories(store);

    const first = await recordAcceptedIdentification(deps, sampleInput());
    const corrected = await correctObservationIdentification(deps, {
      userId: 'user-1',
      observationId: first.observationId,
      selectedTaxonId: monarch.id,
      confidence: 0.9,
      now: '2026-08-29T13:00:00.000Z',
    });

    expect(corrected.taxonId).toBe(monarch.id);
    expect(corrected.isNewWildmark).toBe(true);
    expect(store.userTaxa.find((item) => item.taxonId === cardinal.id)).toBeUndefined();
    expect(store.userTaxa.find((item) => item.taxonId === monarch.id)?.observationCount).toBe(1);
    expect(store.observations[0]?.taxonId).toBe(monarch.id);
    expect(store.attempts.length).toBeGreaterThan(1);
  });
});
