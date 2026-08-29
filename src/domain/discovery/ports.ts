import type { Collection } from '../collections/types';
import type {
  IdentificationAttempt,
  IdentificationCandidate,
} from '../identification/types';
import type {
  CreateObservationInput,
  Observation,
  ObservationPhoto,
  ObservationQuery,
  UserTaxon,
} from '../observations/types';
import type { Quest, UserQuestProgress } from '../quests/types';
import type { Taxon } from '../taxa/types';
import type { NewWildmarkEvent } from './types';
import type { UnlockedMilestone } from '../milestones/types';

export interface ObservationRepository {
  get(id: string): Promise<Observation | null>;
  create(input: CreateObservationInput): Promise<Observation>;
  update(id: string, patch: Partial<Observation>): Promise<Observation>;
  list(query: ObservationQuery): Promise<Observation[]>;
}

export interface ObservationPhotoRepository {
  create(photo: ObservationPhoto): Promise<ObservationPhoto>;
  listForObservation(observationId: string): Promise<ObservationPhoto[]>;
}

export interface TaxonRepository {
  get(id: string): Promise<Taxon | null>;
  list(): Promise<Taxon[]>;
}

export interface UserTaxonRepository {
  get(userId: string, taxonId: string): Promise<UserTaxon | null>;
  list(userId: string): Promise<UserTaxon[]>;
  upsert(record: UserTaxon): Promise<UserTaxon>;
  remove(userId: string, taxonId: string): Promise<void>;
}

export interface IdentificationRepository {
  createAttempt(attempt: IdentificationAttempt): Promise<IdentificationAttempt>;
  addCandidates(attemptId: string, candidates: IdentificationCandidate[]): Promise<void>;
  listAttempts(observationId: string): Promise<IdentificationAttempt[]>;
}

export interface CollectionRepository {
  list(): Promise<Collection[]>;
  listTaxonIds(collectionId: string): Promise<string[]>;
}

export interface QuestRepository {
  list(): Promise<Quest[]>;
  getProgress(userId: string, questId: string): Promise<UserQuestProgress | null>;
  upsertProgress(progress: UserQuestProgress): Promise<UserQuestProgress>;
}

export interface SyncQueue {
  enqueue(action: {
    type: string;
    payload: Record<string, unknown>;
  }): Promise<void>;
  list?(): Promise<{ type: string; payload: Record<string, unknown> }[]>;
}

export interface MilestoneRepository {
  list(userId: string): Promise<UnlockedMilestone[]>;
  add(userId: string, milestones: UnlockedMilestone[]): Promise<void>;
  reset(userId: string): Promise<void>;
}

export interface DiscoveryEventBus {
  emit(event: NewWildmarkEvent): void;
}
