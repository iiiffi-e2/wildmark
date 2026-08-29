import { createId } from '@/src/lib/ids';
import type { Collection } from '@/src/domain/collections/types';
import type { DiscoveryDependencies } from '@/src/domain/discovery/record-discovery';
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

export type SqliteLike = {
  runAsync: (sql: string, ...params: unknown[]) => Promise<{ lastInsertRowId?: number; changes?: number }>;
  getFirstAsync: <T>(sql: string, params?: unknown[]) => Promise<T | null>;
  getAllAsync: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
};

type ObservationRow = {
  id: string;
  remote_id: string | null;
  user_id: string;
  observed_at: string;
  taxon_id: string | null;
  identification_status: Observation['identificationStatus'];
  confidence: number | null;
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  locality_label: string | null;
  notes: string | null;
  favorite: number;
  created_at: string;
  updated_at: string;
  sync_state: Observation['syncState'];
};

function mapObservation(row: ObservationRow): Observation {
  return {
    id: row.id,
    remoteId: row.remote_id,
    userId: row.user_id,
    observedAt: row.observed_at,
    taxonId: row.taxon_id,
    identificationStatus: row.identification_status,
    confidence: row.confidence,
    latitude: row.latitude,
    longitude: row.longitude,
    locationAccuracy: row.location_accuracy,
    localityLabel: row.locality_label,
    notes: row.notes,
    favorite: row.favorite === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncState: row.sync_state,
  };
}

export function createSqliteRepositories(db: SqliteLike): DiscoveryDependencies {
  return {
    observations: {
      async get(id) {
        const row = await db.getFirstAsync<ObservationRow>('SELECT * FROM observations WHERE id = ?', [id]);
        return row ? mapObservation(row) : null;
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
        await db.runAsync(
          `INSERT INTO observations (
            id, remote_id, user_id, observed_at, taxon_id, identification_status, confidence,
            latitude, longitude, location_accuracy, locality_label, notes, favorite, created_at, updated_at, sync_state
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          observation.id,
          observation.remoteId,
          observation.userId,
          observation.observedAt,
          observation.taxonId,
          observation.identificationStatus,
          observation.confidence,
          observation.latitude,
          observation.longitude,
          observation.locationAccuracy,
          observation.localityLabel,
          observation.notes,
          0,
          observation.createdAt,
          observation.updatedAt,
          observation.syncState,
        );
        return observation;
      },
      async update(id, patch) {
        const current = await this.get(id);
        if (!current) {
          throw new Error(`Observation ${id} not found`);
        }
        const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
        await db.runAsync(
          `UPDATE observations SET taxon_id = ?, identification_status = ?, confidence = ?, notes = ?, favorite = ?, updated_at = ?, sync_state = ? WHERE id = ?`,
          next.taxonId,
          next.identificationStatus,
          next.confidence,
          next.notes,
          next.favorite ? 1 : 0,
          next.updatedAt,
          next.syncState,
          id,
        );
        return next;
      },
      async list(query: ObservationQuery) {
        const rows = await db.getAllAsync<ObservationRow>(
          'SELECT * FROM observations WHERE user_id = ? ORDER BY observed_at DESC',
          [query.userId],
        );
        return rows
          .map(mapObservation)
          .filter((item) => (query.taxonId ? item.taxonId === query.taxonId : true))
          .filter((item) => (query.favorite ? item.favorite : true))
          .slice(0, query.limit ?? 1000);
      },
    },
    photos: {
      async create(photo: ObservationPhoto) {
        await db.runAsync(
          `INSERT INTO observation_photos (
            id, observation_id, local_uri, thumbnail_uri, display_uri, remote_uri, width, height, captured_at, upload_state
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          photo.id,
          photo.observationId,
          photo.localUri,
          photo.thumbnailUri,
          photo.displayUri,
          photo.remoteUri,
          photo.width,
          photo.height,
          photo.capturedAt,
          photo.uploadState,
        );
        return photo;
      },
      async listForObservation(observationId) {
        return db.getAllAsync<ObservationPhoto>(
          `SELECT id, observation_id as observationId, local_uri as localUri, thumbnail_uri as thumbnailUri,
                  display_uri as displayUri, remote_uri as remoteUri, width, height, captured_at as capturedAt,
                  upload_state as uploadState
           FROM observation_photos WHERE observation_id = ?`,
          [observationId],
        );
      },
    },
    taxa: {
      async get(id) {
        const row = await db.getFirstAsync<Taxon & { class: string | null; order_name: string | null }>(
          `SELECT id, canonical_id as canonicalId, rank, parent_taxon_id as parentTaxonId, common_name as commonName,
                  scientific_name as scientificName, kingdom, phylum, class as className, order_name as orderName,
                  family, genus, species, category, conservation_status as conservationStatus, habitat,
                  nocturnal, pollinator, cached_at as cachedAt
           FROM taxa WHERE id = ?`,
          [id],
        );
        if (!row) return null;
        return {
          ...row,
          nocturnal: Boolean((row as unknown as { nocturnal: number }).nocturnal),
          pollinator: Boolean((row as unknown as { pollinator: number }).pollinator),
        };
      },
      async list() {
        const rows = await db.getAllAsync<Taxon>(
          `SELECT id, canonical_id as canonicalId, rank, parent_taxon_id as parentTaxonId, common_name as commonName,
                  scientific_name as scientificName, kingdom, phylum, class as className, order_name as orderName,
                  family, genus, species, category, conservation_status as conservationStatus, habitat,
                  nocturnal, pollinator, cached_at as cachedAt
           FROM taxa ORDER BY common_name`,
        );
        return rows.map((row) => ({
          ...row,
          nocturnal: Boolean((row as unknown as { nocturnal: number }).nocturnal),
          pollinator: Boolean((row as unknown as { pollinator: number }).pollinator),
        }));
      },
    },
    userTaxa: {
      async get(userId, taxonId) {
        return db.getFirstAsync<UserTaxon>(
          `SELECT user_id as userId, taxon_id as taxonId, first_observation_id as firstObservationId,
                  first_seen_at as firstSeenAt, last_seen_at as lastSeenAt, observation_count as observationCount,
                  favorite, verified_status as verifiedStatus
           FROM user_taxa WHERE user_id = ? AND taxon_id = ?`,
          [userId, taxonId],
        );
      },
      async list(userId) {
        return db.getAllAsync<UserTaxon>(
          `SELECT user_id as userId, taxon_id as taxonId, first_observation_id as firstObservationId,
                  first_seen_at as firstSeenAt, last_seen_at as lastSeenAt, observation_count as observationCount,
                  favorite, verified_status as verifiedStatus
           FROM user_taxa WHERE user_id = ?`,
          [userId],
        );
      },
      async upsert(record) {
        await db.runAsync(
          `INSERT INTO user_taxa (
            user_id, taxon_id, first_observation_id, first_seen_at, last_seen_at, observation_count, favorite, verified_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, taxon_id) DO UPDATE SET
            last_seen_at = excluded.last_seen_at,
            observation_count = excluded.observation_count,
            favorite = excluded.favorite,
            verified_status = excluded.verified_status`,
          record.userId,
          record.taxonId,
          record.firstObservationId,
          record.firstSeenAt,
          record.lastSeenAt,
          record.observationCount,
          record.favorite ? 1 : 0,
          record.verifiedStatus,
        );
        return record;
      },
      async remove(userId, taxonId) {
        await db.runAsync('DELETE FROM user_taxa WHERE user_id = ? AND taxon_id = ?', userId, taxonId);
      },
    },
    identifications: {
      async createAttempt(attempt: IdentificationAttempt) {
        await db.runAsync(
          `INSERT INTO identification_attempts (
            id, observation_id, engine, model_version, started_at, completed_at, selected_taxon_id, status, confidence
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          attempt.id,
          attempt.observationId,
          attempt.engine,
          attempt.modelVersion,
          attempt.startedAt,
          attempt.completedAt,
          attempt.selectedTaxonId,
          attempt.status,
          attempt.confidence,
        );
        return attempt;
      },
      async addCandidates(attemptId, candidates: IdentificationCandidate[]) {
        for (const candidate of candidates) {
          await db.runAsync(
            `INSERT OR REPLACE INTO identification_candidates (attempt_id, taxon_id, confidence, rank_order) VALUES (?, ?, ?, ?)`,
            attemptId,
            candidate.taxonId,
            candidate.confidence,
            candidate.rankOrder,
          );
        }
      },
      async listAttempts(observationId) {
        return db.getAllAsync<IdentificationAttempt>(
          `SELECT id, observation_id as observationId, engine, model_version as modelVersion, started_at as startedAt,
                  completed_at as completedAt, selected_taxon_id as selectedTaxonId, status, confidence
           FROM identification_attempts WHERE observation_id = ? ORDER BY started_at`,
          [observationId],
        );
      },
    },
    collections: {
      async list() {
        return db.getAllAsync<Collection>(
          `SELECT id, name, description, type, cover_category as coverCategory FROM collections`,
        );
      },
      async listTaxonIds(collectionId) {
        const rows = await db.getAllAsync<{ taxon_id: string }>(
          'SELECT taxon_id FROM collection_taxa WHERE collection_id = ?',
          [collectionId],
        );
        return rows.map((row) => row.taxon_id);
      },
    },
    quests: {
      async list() {
        const rows = await db.getAllAsync<{
          id: string;
          name: string;
          description: string;
          requirements_json: string;
        }>('SELECT id, name, description, requirements_json FROM quests');
        return rows.map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          requirements: JSON.parse(row.requirements_json) as Quest['requirements'],
        }));
      },
      async getProgress(userId, questId) {
        return db.getFirstAsync<UserQuestProgress>(
          `SELECT user_id as userId, quest_id as questId, current, target, completed_at as completedAt
           FROM user_quest_progress WHERE user_id = ? AND quest_id = ?`,
          [userId, questId],
        );
      },
      async upsertProgress(progress) {
        await db.runAsync(
          `INSERT INTO user_quest_progress (user_id, quest_id, current, target, completed_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(user_id, quest_id) DO UPDATE SET
             current = excluded.current,
             target = excluded.target,
             completed_at = excluded.completed_at`,
          progress.userId,
          progress.questId,
          progress.current,
          progress.target,
          progress.completedAt,
        );
        return progress;
      },
    },
    syncQueue: {
      async enqueue(action) {
        await db.runAsync(
          `INSERT INTO sync_queue (id, type, payload_json, state, attempt_count, created_at)
           VALUES (?, ?, ?, 'pending', 0, ?)`,
          createId(),
          action.type,
          JSON.stringify(action.payload),
          new Date().toISOString(),
        );
      },
      async list() {
        const rows = await db.getAllAsync<{ type: string; payload_json: string }>(
          'SELECT type, payload_json FROM sync_queue',
        );
        return rows.map((row) => ({
          type: row.type,
          payload: JSON.parse(row.payload_json) as Record<string, unknown>,
        }));
      },
    },
    events: {
      emit() {
        // Domain listeners are attached at the application layer.
      },
    },
    milestones: {
      async list(userId) {
        return db.getAllAsync<{ id: string; name: string; unlockedAt: string }>(
          `SELECT milestone_id as id, name, unlocked_at as unlockedAt
           FROM user_milestones WHERE user_id = ?`,
          [userId],
        );
      },
      async add(userId, milestones) {
        for (const milestone of milestones) {
          await db.runAsync(
            `INSERT OR IGNORE INTO user_milestones (user_id, milestone_id, name, unlocked_at)
             VALUES (?, ?, ?, ?)`,
            userId,
            milestone.id,
            milestone.name,
            milestone.unlockedAt,
          );
        }
      },
      async reset(userId) {
        await db.runAsync('DELETE FROM user_milestones WHERE user_id = ?', userId);
      },
    },
  };
}
