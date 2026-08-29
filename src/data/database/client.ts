import { Platform } from 'react-native';
import { createId } from '@/src/lib/ids';
import { SEED_COLLECTIONS, SEED_COLLECTION_TAXA, SEED_QUESTS, SEED_TAXA } from '@/src/data/seed';
import { createMemoryRepositories, createMemoryStore, type MemoryStore } from '@/src/testing/memory-store';
import type { DiscoveryDependencies } from '@/src/domain/discovery/record-discovery';
import type { Taxon } from '@/src/domain/taxa/types';
import type { User } from '@/src/app-state/types';
import { createSqliteRepositories, type SqliteLike } from './sqlite-repositories';

const WEB_KEY = 'wildmark.memory.v1';

export type AppPersistence = {
  kind: 'sqlite' | 'memory';
  user: User;
  deps: DiscoveryDependencies;
  store: MemoryStore;
  refreshUser: () => Promise<User>;
  updateUser: (patch: Partial<User>) => Promise<User>;
  inspect: () => MemoryStore;
  clearAll: () => Promise<void>;
};

function defaultUser(): User {
  const now = new Date().toISOString();
  return {
    id: 'local-user',
    remoteId: null,
    displayName: 'Field notes',
    createdAt: now,
    updatedAt: now,
    experienceMode: 'standard',
    locationMode: 'none',
    onboardingCompleted: false,
    appearance: 'system',
  };
}

function seedStore(store: MemoryStore): void {
  store.taxa = SEED_TAXA.map(toTaxon);
  store.collections = [...SEED_COLLECTIONS];
  store.collectionTaxa = [...SEED_COLLECTION_TAXA];
  store.quests = [...SEED_QUESTS];
}

function toTaxon(item: (typeof SEED_TAXA)[number]): Taxon {
  const { safetyFlags: _flags, basicClue: _basic, detailedClue: _detail, ...taxon } = item;
  return taxon;
}

function loadWebStore(): MemoryStore {
  if (typeof localStorage === 'undefined') {
    const store = createMemoryStore();
    seedStore(store);
    return store;
  }
  const raw = localStorage.getItem(WEB_KEY);
  if (!raw) {
    const store = createMemoryStore();
    seedStore(store);
    persistWebStore(store);
    return store;
  }
  try {
    const parsed = JSON.parse(raw) as MemoryStore;
    if (!parsed.taxa?.length) {
      seedStore(parsed);
    }
    return parsed;
  } catch {
    const store = createMemoryStore();
    seedStore(store);
    return store;
  }
}

function persistWebStore(store: MemoryStore): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(WEB_KEY, JSON.stringify(store));
}

function wrapForPersistence(store: MemoryStore, persist: () => void): DiscoveryDependencies {
  const inner = createMemoryRepositories(store);
  const persistAfter = <T extends object>(target: T): T =>
    new Proxy(target, {
      get(obj, prop, receiver) {
        const value = Reflect.get(obj, prop, receiver);
        if (typeof value !== 'function') {
          return value;
        }
        return async (...args: unknown[]) => {
          const result = await value.apply(obj, args);
          persist();
          return result;
        };
      },
    });

  return {
    observations: persistAfter(inner.observations),
    photos: persistAfter(inner.photos),
    taxa: persistAfter(inner.taxa),
    userTaxa: persistAfter(inner.userTaxa),
    identifications: persistAfter(inner.identifications),
    collections: persistAfter(inner.collections),
    quests: persistAfter(inner.quests),
    syncQueue: persistAfter(inner.syncQueue),
    events: inner.events,
  };
}

async function tryOpenSqlite(): Promise<DiscoveryDependencies | null> {
  if (Platform.OS === 'web') {
    return null;
  }
  try {
    const SQLite = await import('expo-sqlite');
    const { INITIAL_SCHEMA } = await import('./schema');
    const db = await SQLite.openDatabaseAsync('wildmark.db');
    await db.execAsync(INITIAL_SCHEMA);
    const seeded = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', [
      'seeded',
    ]);
    if (!seeded) {
      await seedSqlite(db as unknown as SqliteDb);
    }
    return createSqliteRepositories(db as unknown as SqliteLike);
  } catch {
    return null;
  }
}

type SqliteDb = SqliteLike & {
  execAsync: (sql: string) => Promise<unknown>;
};

async function seedSqlite(db: SqliteDb): Promise<void> {
  for (const taxon of SEED_TAXA) {
    await db.runAsync(
      `INSERT OR IGNORE INTO taxa (
        id, canonical_id, rank, parent_taxon_id, common_name, scientific_name,
        kingdom, phylum, class, order_name, family, genus, species, category,
        conservation_status, habitat, nocturnal, pollinator, cached_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      taxon.id,
      taxon.canonicalId,
      taxon.rank,
      taxon.parentTaxonId,
      taxon.commonName,
      taxon.scientificName,
      taxon.kingdom,
      taxon.phylum,
      taxon.className,
      taxon.orderName,
      taxon.family,
      taxon.genus,
      taxon.species,
      taxon.category,
      taxon.conservationStatus,
      taxon.habitat,
      taxon.nocturnal ? 1 : 0,
      taxon.pollinator ? 1 : 0,
      taxon.cachedAt,
    );
    for (const flag of taxon.safetyFlags) {
      await db.runAsync('INSERT OR IGNORE INTO taxon_safety (taxon_id, flag) VALUES (?, ?)', taxon.id, flag);
    }
  }
  for (const collection of SEED_COLLECTIONS) {
    await db.runAsync(
      'INSERT OR IGNORE INTO collections (id, name, description, type, cover_category) VALUES (?, ?, ?, ?, ?)',
      collection.id,
      collection.name,
      collection.description,
      collection.type,
      collection.coverCategory,
    );
  }
  for (const link of SEED_COLLECTION_TAXA) {
    await db.runAsync(
      'INSERT OR IGNORE INTO collection_taxa (collection_id, taxon_id) VALUES (?, ?)',
      link.collectionId,
      link.taxonId,
    );
  }
  for (const quest of SEED_QUESTS) {
    await db.runAsync(
      'INSERT OR IGNORE INTO quests (id, name, description, requirements_json) VALUES (?, ?, ?, ?)',
      quest.id,
      quest.name,
      quest.description,
      JSON.stringify(quest.requirements),
    );
  }
  await db.runAsync('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)', 'seeded', '1');
}

export async function openPersistence(): Promise<AppPersistence> {
  const sqlite = await tryOpenSqlite();
  const store = loadWebStore();
  const persist = () => persistWebStore(store);
  const deps = sqlite ?? wrapForPersistence(store, persist);

  let currentUser = readUser(store) ?? defaultUser();
  writeUser(store, currentUser);
  persist();

  return {
    kind: sqlite ? 'sqlite' : 'memory',
    user: currentUser,
    deps,
    store,
    async refreshUser() {
      currentUser = readUser(store) ?? currentUser;
      return currentUser;
    },
    async updateUser(patch) {
      currentUser = { ...currentUser, ...patch, updatedAt: new Date().toISOString() };
      writeUser(store, currentUser);
      persist();
      return currentUser;
    },
    inspect() {
      return store;
    },
    async clearAll() {
      store.observations = [];
      store.photos = [];
      store.userTaxa = [];
      store.attempts = [];
      store.candidates = [];
      store.questProgress = [];
      store.syncActions = [];
      store.events = [];
      seedStore(store);
      currentUser = { ...defaultUser(), id: currentUser.id };
      writeUser(store, currentUser);
      persist();
    },
  };
}

type StoredUser = User & { _kind?: 'user' };

function readUser(store: MemoryStore): User | null {
  const raw = (store as MemoryStore & { user?: StoredUser }).user;
  return raw ?? null;
}

function writeUser(store: MemoryStore, user: User): void {
  (store as MemoryStore & { user?: User }).user = user;
}

export function newLocalId(): string {
  return createId();
}
