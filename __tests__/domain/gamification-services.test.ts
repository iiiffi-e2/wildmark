import { mergeLocalJournals } from '@/src/domain/account/merge';
import { cluesLeakIdentity, explorerCluesFor, visibleExplorerClues } from '@/src/domain/explorer/clues';
import { defaultJournalFilter, filterObservations, privacySafePlaces } from '@/src/domain/journal/filter';
import { privacySafeCoordinate, privacySafeLocality, shouldExposeExactWildlifeLocation } from '@/src/domain/location/privacy';
import { listQuestObjectives } from '@/src/domain/quests/objectives';
import { isDue, markFailed, nextRetryDelayMs } from '@/src/services/sync/backoff';
import { variantsFromUri } from '@/src/services/photos/storage';
import { HybridIdentificationEngine } from '@/src/services/identification/hybrid-engine';
import { OnDeviceIdentificationEngine } from '@/src/services/identification/on-device-engine';
import { feedbackLevelFor } from '@/src/services/feedback/service';
import type { IdentificationEngine, IdentificationResult } from '@/src/domain/identification/types';
import type { Observation } from '@/src/domain/observations/types';
import type { Taxon } from '@/src/domain/taxa/types';
import type { Quest } from '@/src/domain/quests/types';
import { SEED_TAXA } from '@/src/data/seed';
import { createMemoryStore } from '@/src/testing/memory-store';

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

function observation(id: string, overrides?: Partial<Observation>): Observation {
  return {
    id,
    remoteId: null,
    userId: 'user-1',
    observedAt: '2026-08-16T12:00:00.000Z',
    taxonId: monarch.id,
    identificationStatus: 'identified',
    confidence: 0.9,
    latitude: 33.103,
    longitude: -96.671,
    locationAccuracy: 8,
    localityLabel: 'Allen, Texas',
    notes: 'On milkweed',
    favorite: false,
    createdAt: '2026-08-16T12:00:00.000Z',
    updatedAt: '2026-08-16T12:00:00.000Z',
    syncState: 'pending',
    ...overrides,
  };
}

describe('journal filters', () => {
  test('filters unidentified and category independently', () => {
    const observations = [
      observation('obs-1'),
      observation('obs-2', { taxonId: null, identificationStatus: 'failed', notes: 'soft photograph' }),
    ];
    const taxaById = new Map([[monarch.id, monarch]]);
    const unidentified = filterObservations(observations, taxaById, {
      ...defaultJournalFilter(),
      status: 'unidentified',
    });
    expect(unidentified.map((item) => item.id)).toEqual(['obs-2']);

    const insects = filterObservations(observations, taxaById, {
      ...defaultJournalFilter(),
      category: 'insect',
    });
    expect(insects.map((item) => item.id)).toEqual(['obs-1']);
  });

  test('collects privacy-safe place labels without coordinates', () => {
    expect(privacySafePlaces([observation('obs-1')])).toEqual(['Allen, Texas']);
  });
});

describe('location privacy', () => {
  test('never exposes exact wildlife coordinates', () => {
    expect(shouldExposeExactWildlifeLocation()).toBe(false);
    expect(privacySafeLocality('Home nest', 'none')).toBeNull();
    expect(privacySafeCoordinate(33.10317, -96.67091, 'approximate')).toEqual({
      latitude: 33.1,
      longitude: -96.65,
    });
  });
});

describe('account merge', () => {
  test('unions taxa and keeps the earliest first seen', () => {
    const merged = mergeLocalJournals(
      {
        observations: [observation('obs-1')],
        photos: [],
        userTaxa: [
          {
            userId: 'user-1',
            taxonId: monarch.id,
            firstObservationId: 'obs-1',
            firstSeenAt: '2026-08-01T12:00:00.000Z',
            lastSeenAt: '2026-08-01T12:00:00.000Z',
            observationCount: 1,
            favorite: false,
            verifiedStatus: 'userConfirmed',
          },
        ],
        questProgress: [],
        milestones: [{ id: 'ms-first-wildmark', name: 'First Wildmark', unlockedAt: '2026-08-01T12:00:00.000Z' }],
      },
      {
        observations: [observation('obs-2', { observedAt: '2026-08-20T12:00:00.000Z' })],
        photos: [],
        userTaxa: [
          {
            userId: 'user-2',
            taxonId: monarch.id,
            firstObservationId: 'obs-2',
            firstSeenAt: '2026-08-20T12:00:00.000Z',
            lastSeenAt: '2026-08-20T12:00:00.000Z',
            observationCount: 2,
            favorite: true,
            verifiedStatus: 'userConfirmed',
          },
        ],
        questProgress: [{ userId: 'user-2', questId: 'quest-first-five', current: 3, target: 5, completedAt: null }],
        milestones: [],
      },
    );
    expect(merged.observations).toHaveLength(2);
    expect(merged.userTaxa[0]?.firstSeenAt).toBe('2026-08-01T12:00:00.000Z');
    expect(merged.userTaxa[0]?.observationCount).toBe(2);
    expect(merged.userTaxa[0]?.favorite).toBe(true);
    expect(merged.milestones).toHaveLength(1);
    expect(merged.questProgress[0]?.current).toBe(3);
  });
});

describe('explorer clues', () => {
  test('cardinal clues never leak identity', () => {
    const cardinal = SEED_TAXA.find((item) => item.id === 'taxon-northern-cardinal');
    expect(cardinal).toBeTruthy();
    if (!cardinal) return;
    expect(cluesLeakIdentity(cardinal)).toBe(false);
    expect(visibleExplorerClues(cardinal, 2)).toHaveLength(2);
    expect(explorerCluesFor(cardinal)[0]?.title).toBe('Something is nearby');
  });
});

describe('quest objectives', () => {
  test('shows mystery slots until a specific taxon is found', () => {
    const quest: Quest = {
      id: 'quest-pollinator-hunt',
      name: 'The Pollinator Hunt',
      description: 'Find four local pollinators.',
      requirements: [{ kind: 'specificTaxa', taxonIds: [monarch.id, 'taxon-honey-bee'] }],
    };
    const objectives = listQuestObjectives(quest, {
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
    });
    expect(objectives).toEqual([
      { id: monarch.id, label: 'Monarch Butterfly', done: true, mystery: false },
      { id: 'taxon-honey-bee', label: '???', done: false, mystery: true },
    ]);
  });
});

describe('sync backoff', () => {
  test('doubles delay and waits for next retry', () => {
    expect(nextRetryDelayMs(0)).toBe(1000);
    expect(nextRetryDelayMs(5)).toBe(32000);
    const failed = markFailed(
      {
        id: 'sync-1',
        type: 'createObservation',
        payload: {},
        state: 'pending',
        attemptCount: 0,
        lastError: null,
        nextRetryAt: null,
        createdAt: '2026-08-29T12:00:00.000Z',
      },
      'offline',
      new Date('2026-08-29T12:00:00.000Z'),
    );
    expect(failed.state).toBe('failed');
    expect(isDue(failed, new Date('2026-08-29T12:00:00.500Z'))).toBe(false);
    expect(isDue(failed, new Date('2026-08-29T12:00:02.000Z'))).toBe(true);
  });
});

describe('photo variants and hybrid engine', () => {
  test('keeps fixture photographs as durable local variants', () => {
    const stored = variantsFromUri('fixture://northern-cardinal', { width: 1200, height: 1600 }, '2026-08-29T12:00:00.000Z');
    expect(stored.localUri).toBe('fixture://northern-cardinal');
    expect(stored.displayUri).toBe(stored.localUri);
    expect(stored.thumbnailUri).toBe(stored.localUri);
  });

  test('uses on-device identification when cloud is unavailable', async () => {
    const onDevice = new OnDeviceIdentificationEngine();
    const cloud: IdentificationEngine = {
      id: 'cloud',
      async getCapabilities() {
        return { id: 'cloud', offline: false, categories: [], available: false };
      },
      async identify(): Promise<IdentificationResult> {
        return { kind: 'failed', reason: 'offline' };
      },
    };
    const hybrid = new HybridIdentificationEngine(onDevice, cloud, true);
    const result = await hybrid.identify({
      imageUri: 'fixture://northern-cardinal',
      observedAt: '2026-08-29T12:00:00.000Z',
      fixtureId: 'northern-cardinal',
    });
    expect(result.kind).toBe('highConfidence');
  });
});

describe('durable store migration', () => {
  test('createMemoryStore fills missing milestones so old journals still identify', () => {
    const store = createMemoryStore({
      taxa: [monarch],
      observations: [],
    });
    expect(store.milestones).toEqual([]);
    expect(store.syncActions).toEqual([]);
    expect(store.milestones.filter((item) => item.id === 'missing')).toEqual([]);
  });
});

describe('feedback hierarchy', () => {
  test('collection completion outranks a new species', () => {
    expect(
      feedbackLevelFor({
        isNewWildmark: true,
        collectionCompleted: true,
        milestoneUnlocked: true,
        questAdvanced: true,
      }),
    ).toBe(5);
    expect(
      feedbackLevelFor({
        isNewWildmark: true,
        collectionCompleted: false,
        milestoneUnlocked: false,
        questAdvanced: false,
      }),
    ).toBe(3);
  });
});
