import { createId } from '@/src/lib/ids';
import { evaluateQuestProgress } from '../quests/evaluate';
import type {
  CollectionProgressDelta,
} from '../collections/types';
import type { IdentificationCandidate } from '../identification/types';
import type { ObservationPhoto, UserTaxon } from '../observations/types';
import type { QuestProgressDelta } from '../quests/types';
import { evaluateMilestones } from '../milestones/evaluate';
import { MILESTONE_RULES } from '../milestones/rules';
import { personalRecordsFor, rarityFromOccurrence, rarityLabel, repeatSightingContext } from '../progression/rarity';
import { nearCompletions } from '../progression/next-discovery';
import type { CategoryProgressDelta } from '../progression/types';
import type {
  CollectionRepository,
  DiscoveryEventBus,
  IdentificationRepository,
  ObservationPhotoRepository,
  ObservationRepository,
  QuestRepository,
  MilestoneRepository,
  SyncQueue,
  TaxonRepository,
  UserTaxonRepository,
} from './ports';
import type {
  AcceptIdentificationInput,
  CorrectIdentificationInput,
  DiscoveryResult,
  RecordUnidentifiedInput,
} from './types';

export type DiscoveryDependencies = {
  observations: ObservationRepository;
  photos: ObservationPhotoRepository;
  taxa: TaxonRepository;
  userTaxa: UserTaxonRepository;
  identifications: IdentificationRepository;
  collections: CollectionRepository;
  quests: QuestRepository;
  syncQueue: SyncQueue;
  events: DiscoveryEventBus;
  milestones: MilestoneRepository;
};

function photoFromInput(
  observationId: string,
  image: AcceptIdentificationInput['image'],
): ObservationPhoto {
  return {
    id: createId(),
    observationId,
    localUri: image.localUri,
    thumbnailUri: image.thumbnailUri ?? image.localUri,
    displayUri: image.displayUri ?? image.localUri,
    remoteUri: null,
    width: image.width,
    height: image.height,
    capturedAt: image.capturedAt,
    uploadState: 'pending',
  };
}

async function collectionSnapshot(
  deps: DiscoveryDependencies,
  userId: string,
): Promise<Map<string, { name: string; discovered: number; total: number }>> {
  const [collections, userTaxa] = await Promise.all([
    deps.collections.list(),
    deps.userTaxa.list(userId),
  ]);
  const discovered = new Set(userTaxa.map((item) => item.taxonId));
  const snapshot = new Map<string, { name: string; discovered: number; total: number }>();
  for (const collection of collections) {
    const taxonIds = await deps.collections.listTaxonIds(collection.id);
    snapshot.set(collection.id, {
      name: collection.name,
      discovered: taxonIds.filter((id) => discovered.has(id)).length,
      total: taxonIds.length,
    });
  }
  return snapshot;
}

function collectionDeltasFrom(
  before: Map<string, { name: string; discovered: number; total: number }>,
  after: Map<string, { name: string; discovered: number; total: number }>,
): CollectionProgressDelta[] {
  return [...after.entries()].map(([collectionId, current]) => {
    const previous = before.get(collectionId)?.discovered ?? 0;
    return {
      collectionId,
      collectionName: current.name,
      previousCount: previous,
      discoveredCount: current.discovered,
      totalCount: current.total,
      newlyCompleted: current.total > 0 && previous < current.total && current.discovered === current.total,
    };
  });
}

function categoryDeltas(previous: UserTaxon[], current: UserTaxon[], taxaById: Map<string, import('../taxa/types').Taxon>): CategoryProgressDelta[] {
  const count = (rows: UserTaxon[]) => {
    const map = new Map<string, number>();
    for (const row of rows) {
      const category = taxaById.get(row.taxonId)?.category;
      if (!category) continue;
      map.set(category, (map.get(category) ?? 0) + 1);
    }
    return map;
  };
  const before = count(previous);
  const after = count(current);
  const keys = new Set([...before.keys(), ...after.keys()]);
  return [...keys].map((category) => ({
    category,
    previous: before.get(category) ?? 0,
    current: after.get(category) ?? 0,
  }));
}

async function questDeltas(
  deps: DiscoveryDependencies,
  userId: string,
  now: string,
): Promise<QuestProgressDelta[]> {
  const [quests, userTaxa, observations, taxa] = await Promise.all([
    deps.quests.list(),
    deps.userTaxa.list(userId),
    deps.observations.list({ userId }),
    deps.taxa.list(),
  ]);
  const taxaById = new Map(taxa.map((taxon) => [taxon.id, taxon]));
  const collectionTaxonIdsByQuest = new Map<string, string[]>();
  const deltas: QuestProgressDelta[] = [];

  for (const quest of quests) {
    for (const requirement of quest.requirements) {
      if (requirement.kind === 'collection' && !collectionTaxonIdsByQuest.has(requirement.collectionId)) {
        collectionTaxonIdsByQuest.set(
          requirement.collectionId,
          await deps.collections.listTaxonIds(requirement.collectionId),
        );
      }
    }
    const previous = await deps.quests.getProgress(userId, quest.id);
    const progress = evaluateQuestProgress(quest, {
      userId,
      userTaxa,
      taxaById,
      collectionTaxonIdsByQuest,
      observations,
      previous,
      now,
    });
    await deps.quests.upsertProgress(progress);
    deltas.push({
      questId: quest.id,
      questName: quest.name,
      current: progress.current,
      target: progress.target,
      newlyCompleted: Boolean(progress.completedAt && !previous?.completedAt),
    });
  }
  return deltas;
}

async function relevantCollectionIds(
  deps: DiscoveryDependencies,
  taxonId: string,
): Promise<string[]> {
  const collections = await deps.collections.list();
  const ids: string[] = [];
  for (const collection of collections) {
    const taxonIds = await deps.collections.listTaxonIds(collection.id);
    if (taxonIds.includes(taxonId)) {
      ids.push(collection.id);
    }
  }
  return ids;
}

function candidatesFromResult(input: AcceptIdentificationInput): IdentificationCandidate[] {
  const result = input.identification.result;
  if (result.kind === 'candidate') {
    return result.candidates;
  }
  if (result.kind === 'highConfidence') {
    return [
      {
        taxonId: result.taxonId,
        commonName: result.commonName,
        scientificName: result.scientificName,
        confidence: result.confidence,
        rankOrder: 1,
      },
    ];
  }
  return [];
}

export async function recordAcceptedIdentification(
  deps: DiscoveryDependencies,
  input: AcceptIdentificationInput,
): Promise<DiscoveryResult> {
  const now = input.now ?? new Date().toISOString();
  const unlocksCollection = input.identificationStatus === 'identified';

  const observation = await deps.observations.create({
    userId: input.userId,
    observedAt: input.observedAt,
    taxonId: input.selectedTaxonId,
    identificationStatus: input.identificationStatus,
    confidence: input.confidence,
    latitude: input.location?.latitude ?? null,
    longitude: input.location?.longitude ?? null,
    locationAccuracy: input.location?.accuracy ?? null,
    localityLabel: input.location?.localityLabel ?? null,
    notes: input.notes ?? null,
  });

  await deps.photos.create(photoFromInput(observation.id, input.image));

  const attempt = await deps.identifications.createAttempt({
    id: createId(),
    observationId: observation.id,
    engine: input.identification.engine,
    modelVersion: input.identification.modelVersion,
    startedAt: now,
    completedAt: now,
    selectedTaxonId: input.selectedTaxonId,
    status: input.identificationStatus === 'identified' ? 'identified' : input.identificationStatus,
    confidence: input.confidence,
  });
  await deps.identifications.addCandidates(attempt.id, candidatesFromResult(input));

  const previousUserTaxa = await deps.userTaxa.list(input.userId);
  const beforeCollections = await collectionSnapshot(deps, input.userId);
  let isNewWildmark = false;
  let observationCountForTaxon = 0;

  if (unlocksCollection) {
    const existing = await deps.userTaxa.get(input.userId, input.selectedTaxonId);
    if (existing) {
      const updated = await deps.userTaxa.upsert({
        ...existing,
        lastSeenAt: input.observedAt,
        observationCount: existing.observationCount + 1,
      });
      observationCountForTaxon = updated.observationCount;
    } else {
      await deps.userTaxa.upsert({
        userId: input.userId,
        taxonId: input.selectedTaxonId,
        firstObservationId: observation.id,
        firstSeenAt: input.observedAt,
        lastSeenAt: input.observedAt,
        observationCount: 1,
        favorite: false,
        verifiedStatus: 'userConfirmed',
      });
      isNewWildmark = true;
      observationCountForTaxon = 1;
    }
  }

  const afterCollections = await collectionSnapshot(deps, input.userId);
  const collections = collectionDeltasFrom(beforeCollections, afterCollections);
  const quests = await questDeltas(deps, input.userId, now);
  const taxa = await deps.taxa.list();
  const taxaById = new Map(taxa.map((taxon) => [taxon.id, taxon]));
  const currentUserTaxa = await deps.userTaxa.list(input.userId);
  const taxon = taxaById.get(input.selectedTaxonId) ?? null;
  const observations = await deps.observations.list({ userId: input.userId });
  const alreadyUnlocked = new Set((await deps.milestones.list(input.userId)).map((item) => item.id));
  const milestones = evaluateMilestones({
    isNewWildmark,
    taxon,
    userTaxa: currentUserTaxa,
    taxaById,
    collectionDeltas: collections,
    alreadyUnlocked,
    now,
  }, [
    ...MILESTONE_RULES,
    ...collections
      .filter((item) => item.newlyCompleted)
      .map((item) => ({
        id: `ms-complete-${item.collectionId}`,
        name: `${item.collectionName} complete`,
        kind: 'collectionComplete' as const,
        collectionId: item.collectionId,
      })),
  ]);
  if (milestones.length > 0) {
    await deps.milestones.add(input.userId, milestones);
  }

  await deps.syncQueue.enqueue({
    type: 'createObservation',
    payload: { observationId: observation.id },
  });

  const event = isNewWildmark
    ? {
        userId: input.userId,
        observationId: observation.id,
        taxonId: input.selectedTaxonId,
        discoveredAt: input.observedAt,
        relevantCollectionIds: await relevantCollectionIds(deps, input.selectedTaxonId),
        completedQuestIds: quests.filter((item) => item.newlyCompleted).map((item) => item.questId),
      }
    : null;

  if (event) {
    deps.events.emit(event);
  }

  const owned = currentUserTaxa.find((item) => item.taxonId === input.selectedTaxonId);
  return {
    observationId: observation.id,
    taxonId: input.selectedTaxonId,
    isNewWildmark,
    observationCountForTaxon,
    collectionDeltas: collections,
    questDeltas: quests,
    categoryDeltas: categoryDeltas(previousUserTaxa, currentUserTaxa, taxaById),
    milestones,
    personalRecords: personalRecordsFor({
      isNewWildmark,
      taxon,
      userTaxa: currentUserTaxa,
      previousUserTaxa,
      taxaById,
      observations,
    }),
    rarity: rarityFromOccurrence(input.occurrenceClass, taxon),
    rarityLabel: rarityLabel(rarityFromOccurrence(input.occurrenceClass, taxon)),
    repeat:
      !isNewWildmark && owned
        ? repeatSightingContext({
            userTaxon: owned,
            observations,
            localityLabel: input.location?.localityLabel,
          })
        : null,
    nearCompletions: nearCompletions({
      collections,
      quests,
      speciesCount: currentUserTaxa.length,
    }),
    earnedBadges: milestones.map((item) => ({ id: item.id, name: item.name })),
    event,
  };
}

export async function recordUnidentifiedObservation(
  deps: DiscoveryDependencies,
  input: RecordUnidentifiedInput,
): Promise<{ observationId: string }> {
  const observation = await deps.observations.create({
    userId: input.userId,
    observedAt: input.observedAt,
    taxonId: null,
    identificationStatus: input.status,
    confidence: null,
    latitude: input.location?.latitude ?? null,
    longitude: input.location?.longitude ?? null,
    locationAccuracy: input.location?.accuracy ?? null,
    localityLabel: input.location?.localityLabel ?? null,
    notes: input.notes ?? null,
  });
  await deps.photos.create(photoFromInput(observation.id, input.image));
  await deps.syncQueue.enqueue({
    type: 'createObservation',
    payload: { observationId: observation.id },
  });
  return { observationId: observation.id };
}

export async function correctObservationIdentification(
  deps: DiscoveryDependencies,
  input: CorrectIdentificationInput,
): Promise<DiscoveryResult> {
  const now = input.now ?? new Date().toISOString();
  const observation = await deps.observations.get(input.observationId);
  if (!observation || observation.userId !== input.userId) {
    throw new Error('Observation not found');
  }

  const previousTaxonId = observation.taxonId;
  const previousUserTaxa = await deps.userTaxa.list(input.userId);
  const beforeCollections = await collectionSnapshot(deps, input.userId);
  await deps.observations.update(observation.id, {
    taxonId: input.selectedTaxonId,
    identificationStatus: 'identified',
    confidence: input.confidence ?? observation.confidence,
  });

  await deps.identifications.createAttempt({
    id: createId(),
    observationId: observation.id,
    engine: 'user-correction',
    modelVersion: '1',
    startedAt: now,
    completedAt: now,
    selectedTaxonId: input.selectedTaxonId,
    status: 'identified',
    confidence: input.confidence ?? null,
  });

  if (previousTaxonId && previousTaxonId !== input.selectedTaxonId) {
    const previous = await deps.userTaxa.get(input.userId, previousTaxonId);
    if (previous) {
      const remaining = (await deps.observations.list({ userId: input.userId, taxonId: previousTaxonId })).filter(
        (item) => item.id !== observation.id && item.taxonId === previousTaxonId,
      );
      if (remaining.length === 0) {
        await deps.userTaxa.remove(input.userId, previousTaxonId);
      } else {
        await deps.userTaxa.upsert({
          ...previous,
          observationCount: remaining.length,
        });
      }
    }
  }

  const existing = await deps.userTaxa.get(input.userId, input.selectedTaxonId);
  let isNewWildmark = false;
  let observationCountForTaxon = 1;
  if (existing) {
    const updated = await deps.userTaxa.upsert({
      ...existing,
      lastSeenAt: now,
      observationCount: existing.observationCount + (previousTaxonId === input.selectedTaxonId ? 0 : 1),
    });
    observationCountForTaxon = updated.observationCount;
  } else {
    await deps.userTaxa.upsert({
      userId: input.userId,
      taxonId: input.selectedTaxonId,
      firstObservationId: observation.id,
      firstSeenAt: now,
      lastSeenAt: now,
      observationCount: 1,
      favorite: false,
      verifiedStatus: 'userConfirmed',
    });
    isNewWildmark = true;
  }

  const afterCollections = await collectionSnapshot(deps, input.userId);
  const collections = collectionDeltasFrom(beforeCollections, afterCollections);
  const quests = await questDeltas(deps, input.userId, now);
  const taxa = await deps.taxa.list();
  const taxaById = new Map(taxa.map((taxon) => [taxon.id, taxon]));
  const currentUserTaxa = await deps.userTaxa.list(input.userId);
  const taxon = taxaById.get(input.selectedTaxonId) ?? null;
  const observations = await deps.observations.list({ userId: input.userId });
  const alreadyUnlocked = new Set((await deps.milestones.list(input.userId)).map((item) => item.id));
  const milestones = evaluateMilestones({
    isNewWildmark,
    taxon,
    userTaxa: currentUserTaxa,
    taxaById,
    collectionDeltas: collections,
    alreadyUnlocked,
    now,
  });
  if (milestones.length > 0) {
    await deps.milestones.add(input.userId, milestones);
  }

  await deps.syncQueue.enqueue({
    type: 'updateObservation',
    payload: { observationId: observation.id },
  });

  const event = isNewWildmark
    ? {
        userId: input.userId,
        observationId: observation.id,
        taxonId: input.selectedTaxonId,
        discoveredAt: now,
        relevantCollectionIds: await relevantCollectionIds(deps, input.selectedTaxonId),
        completedQuestIds: quests.filter((item) => item.newlyCompleted).map((item) => item.questId),
      }
    : null;
  if (event) {
    deps.events.emit(event);
  }

  return {
    observationId: observation.id,
    taxonId: input.selectedTaxonId,
    isNewWildmark,
    observationCountForTaxon,
    collectionDeltas: collections,
    questDeltas: quests,
    categoryDeltas: categoryDeltas(previousUserTaxa, currentUserTaxa, taxaById),
    milestones,
    personalRecords: personalRecordsFor({
      isNewWildmark,
      taxon,
      userTaxa: currentUserTaxa,
      previousUserTaxa,
      taxaById,
      observations,
    }),
    rarity: rarityFromOccurrence(undefined, taxon),
    rarityLabel: rarityLabel(rarityFromOccurrence(undefined, taxon)),
    repeat: null,
    nearCompletions: nearCompletions({
      collections,
      quests,
      speciesCount: currentUserTaxa.length,
    }),
    earnedBadges: milestones.map((item) => ({ id: item.id, name: item.name })),
    event,
  };
}
