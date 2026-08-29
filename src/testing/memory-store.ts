import { createId } from '@/src/lib/ids';
import type {
  CollectionRepository,
  DiscoveryEventBus,
  IdentificationRepository,
  ObservationPhotoRepository,
  ObservationRepository,
  QuestRepository,
  SyncQueue,
  TaxonRepository,
  UserTaxonRepository,
} from '@/src/domain/discovery/ports';
import type { Collection } from '@/src/domain/collections/types';
import type { NewWildmarkEvent } from '@/src/domain/discovery/types';
import type {
  IdentificationAttempt,
  IdentificationCandidate,
} from '@/src/domain/identification/types';
import type {
  CreateObservationInput,
  Observation,
  ObservationPhoto,
  ObservationQuery,
  UserTaxon,
} from '@/src/domain/observations/types';
import type { Quest, UserQuestProgress } from '@/src/domain/quests/types';
import type { Taxon } from '@/src/domain/taxa/types';

export type MemoryStore = {
  taxa: Taxon[];
  observations: Observation[];
  photos: ObservationPhoto[];
  userTaxa: UserTaxon[];
  attempts: IdentificationAttempt[];
  candidates: (IdentificationCandidate & { attemptId: string })[];
  collections: Collection[];
  collectionTaxa: { collectionId: string; taxonId: string }[];
  quests: Quest[];
  questProgress: UserQuestProgress[];
  syncActions: { type: string; payload: Record<string, unknown> }[];
  events: NewWildmarkEvent[];
};

export function createMemoryStore(seed?: Partial<MemoryStore>): MemoryStore {
  return {
    taxa: seed?.taxa ?? [],
    observations: seed?.observations ?? [],
    photos: seed?.photos ?? [],
    userTaxa: seed?.userTaxa ?? [],
    attempts: seed?.attempts ?? [],
    candidates: seed?.candidates ?? [],
    collections: seed?.collections ?? [],
    collectionTaxa: seed?.collectionTaxa ?? [],
    quests: seed?.quests ?? [],
    questProgress: seed?.questProgress ?? [],
    syncActions: seed?.syncActions ?? [],
    events: seed?.events ?? [],
  };
}

export function createMemoryRepositories(store: MemoryStore): {
  observations: ObservationRepository;
  photos: ObservationPhotoRepository;
  taxa: TaxonRepository;
  userTaxa: UserTaxonRepository;
  identifications: IdentificationRepository;
  collections: CollectionRepository;
  quests: QuestRepository;
  syncQueue: SyncQueue;
  events: DiscoveryEventBus;
} {
  return {
    observations: {
      async get(id) {
        return store.observations.find((item) => item.id === id) ?? null;
      },
      async create(input: CreateObservationInput) {
        const now = new Date().toISOString();
        const observation: Observation = {
          id: input.id ?? createId(),
          remoteId: null,
          userId: input.userId,
          observedAt: input.observedAt,
          taxonId: input.taxonId ?? null,
          identificationStatus: input.identificationStatus,
          confidence: input.confidence ?? null,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          locationAccuracy: input.locationAccuracy ?? null,
          localityLabel: input.localityLabel ?? null,
          notes: input.notes ?? null,
          favorite: false,
          createdAt: now,
          updatedAt: now,
          syncState: 'pending',
        };
        store.observations.push(observation);
        return observation;
      },
      async update(id, patch) {
        const index = store.observations.findIndex((item) => item.id === id);
        const current = store.observations[index];
        if (index < 0 || !current) {
          throw new Error(`Observation ${id} not found`);
        }
        const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
        store.observations[index] = next;
        return next;
      },
      async list(query: ObservationQuery) {
        return store.observations
          .filter((item) => item.userId === query.userId)
          .filter((item) => (query.taxonId ? item.taxonId === query.taxonId : true))
          .filter((item) => (query.favorite ? item.favorite : true))
          .sort((a, b) => b.observedAt.localeCompare(a.observedAt))
          .slice(0, query.limit ?? 1000);
      },
    },
    photos: {
      async create(photo) {
        store.photos.push(photo);
        return photo;
      },
      async listForObservation(observationId) {
        return store.photos.filter((item) => item.observationId === observationId);
      },
    },
    taxa: {
      async get(id) {
        return store.taxa.find((item) => item.id === id) ?? null;
      },
      async list() {
        return [...store.taxa];
      },
    },
    userTaxa: {
      async get(userId, taxonId) {
        return store.userTaxa.find((item) => item.userId === userId && item.taxonId === taxonId) ?? null;
      },
      async list(userId) {
        return store.userTaxa.filter((item) => item.userId === userId);
      },
      async upsert(record) {
        const index = store.userTaxa.findIndex(
          (item) => item.userId === record.userId && item.taxonId === record.taxonId,
        );
        if (index >= 0) {
          store.userTaxa[index] = record;
        } else {
          store.userTaxa.push(record);
        }
        return record;
      },
      async remove(userId, taxonId) {
        store.userTaxa = store.userTaxa.filter(
          (item) => !(item.userId === userId && item.taxonId === taxonId),
        );
      },
    },
    identifications: {
      async createAttempt(attempt) {
        store.attempts.push(attempt);
        return attempt;
      },
      async addCandidates(attemptId, candidates) {
        store.candidates.push(...candidates.map((candidate) => ({ ...candidate, attemptId })));
      },
      async listAttempts(observationId) {
        return store.attempts.filter((item) => item.observationId === observationId);
      },
    },
    collections: {
      async list() {
        return [...store.collections];
      },
      async listTaxonIds(collectionId) {
        return store.collectionTaxa
          .filter((item) => item.collectionId === collectionId)
          .map((item) => item.taxonId);
      },
    },
    quests: {
      async list() {
        return [...store.quests];
      },
      async getProgress(userId, questId) {
        return (
          store.questProgress.find((item) => item.userId === userId && item.questId === questId) ?? null
        );
      },
      async upsertProgress(progress) {
        const index = store.questProgress.findIndex(
          (item) => item.userId === progress.userId && item.questId === progress.questId,
        );
        if (index >= 0) {
          store.questProgress[index] = progress;
        } else {
          store.questProgress.push(progress);
        }
        return progress;
      },
    },
    syncQueue: {
      async enqueue(action) {
        store.syncActions.push(action);
      },
    },
    events: {
      emit(event) {
        store.events.push(event);
      },
    },
  };
}
