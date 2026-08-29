export const INITIAL_SCHEMA = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY NOT NULL,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  remote_id TEXT,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  experience_mode TEXT NOT NULL DEFAULT 'standard',
  location_mode TEXT NOT NULL DEFAULT 'none',
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  appearance TEXT NOT NULL DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS taxa (
  id TEXT PRIMARY KEY NOT NULL,
  canonical_id TEXT NOT NULL,
  rank TEXT NOT NULL,
  parent_taxon_id TEXT,
  common_name TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  kingdom TEXT,
  phylum TEXT,
  class TEXT,
  order_name TEXT,
  family TEXT,
  genus TEXT,
  species TEXT,
  category TEXT NOT NULL,
  conservation_status TEXT NOT NULL,
  habitat TEXT,
  nocturnal INTEGER NOT NULL DEFAULT 0,
  pollinator INTEGER NOT NULL DEFAULT 0,
  cached_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS taxon_names (
  id TEXT PRIMARY KEY NOT NULL,
  taxon_id TEXT NOT NULL,
  name TEXT NOT NULL,
  locale TEXT NOT NULL,
  kind TEXT NOT NULL,
  FOREIGN KEY (taxon_id) REFERENCES taxa(id)
);

CREATE TABLE IF NOT EXISTS taxon_safety (
  taxon_id TEXT NOT NULL,
  flag TEXT NOT NULL,
  PRIMARY KEY (taxon_id, flag),
  FOREIGN KEY (taxon_id) REFERENCES taxa(id)
);

CREATE TABLE IF NOT EXISTS observations (
  id TEXT PRIMARY KEY NOT NULL,
  remote_id TEXT,
  user_id TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  taxon_id TEXT,
  identification_status TEXT NOT NULL,
  confidence REAL,
  latitude REAL,
  longitude REAL,
  location_accuracy REAL,
  locality_label TEXT,
  notes TEXT,
  favorite INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_state TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (taxon_id) REFERENCES taxa(id)
);

CREATE TABLE IF NOT EXISTS observation_photos (
  id TEXT PRIMARY KEY NOT NULL,
  observation_id TEXT NOT NULL,
  local_uri TEXT NOT NULL,
  thumbnail_uri TEXT NOT NULL,
  display_uri TEXT NOT NULL,
  remote_uri TEXT,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  captured_at TEXT NOT NULL,
  upload_state TEXT NOT NULL,
  FOREIGN KEY (observation_id) REFERENCES observations(id)
);

CREATE TABLE IF NOT EXISTS identification_attempts (
  id TEXT PRIMARY KEY NOT NULL,
  observation_id TEXT NOT NULL,
  engine TEXT NOT NULL,
  model_version TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  selected_taxon_id TEXT,
  status TEXT NOT NULL,
  confidence REAL,
  FOREIGN KEY (observation_id) REFERENCES observations(id)
);

CREATE TABLE IF NOT EXISTS identification_candidates (
  attempt_id TEXT NOT NULL,
  taxon_id TEXT NOT NULL,
  confidence REAL NOT NULL,
  rank_order INTEGER NOT NULL,
  PRIMARY KEY (attempt_id, taxon_id),
  FOREIGN KEY (attempt_id) REFERENCES identification_attempts(id)
);

CREATE TABLE IF NOT EXISTS user_taxa (
  user_id TEXT NOT NULL,
  taxon_id TEXT NOT NULL,
  first_observation_id TEXT NOT NULL,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  observation_count INTEGER NOT NULL,
  favorite INTEGER NOT NULL DEFAULT 0,
  verified_status TEXT NOT NULL,
  PRIMARY KEY (user_id, taxon_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (taxon_id) REFERENCES taxa(id)
);

CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  cover_category TEXT
);

CREATE TABLE IF NOT EXISTS collection_taxa (
  collection_id TEXT NOT NULL,
  taxon_id TEXT NOT NULL,
  PRIMARY KEY (collection_id, taxon_id),
  FOREIGN KEY (collection_id) REFERENCES collections(id),
  FOREIGN KEY (taxon_id) REFERENCES taxa(id)
);

CREATE TABLE IF NOT EXISTS quests (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_quest_progress (
  user_id TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  current INTEGER NOT NULL,
  target INTEGER NOT NULL,
  completed_at TEXT,
  PRIMARY KEY (user_id, quest_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (quest_id) REFERENCES quests(id)
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  state TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  next_retry_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS observations_user_observed_idx
  ON observations(user_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS observations_taxon_idx
  ON observations(taxon_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS user_taxa_user_idx
  ON user_taxa(user_id, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS photos_observation_idx
  ON observation_photos(observation_id);
`;
