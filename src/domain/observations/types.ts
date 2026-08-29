export type IdentificationStatus =
  | 'unidentified'
  | 'pending'
  | 'identified'
  | 'ambiguous'
  | 'lowConfidence'
  | 'unsupported'
  | 'failed';

export type SyncState = 'pending' | 'syncing' | 'succeeded' | 'failed';

export type Observation = {
  id: string;
  remoteId: string | null;
  userId: string;
  observedAt: string;
  taxonId: string | null;
  identificationStatus: IdentificationStatus;
  confidence: number | null;
  latitude: number | null;
  longitude: number | null;
  locationAccuracy: number | null;
  localityLabel: string | null;
  notes: string | null;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  syncState: SyncState;
};

export type ObservationPhoto = {
  id: string;
  observationId: string;
  localUri: string;
  thumbnailUri: string;
  displayUri: string;
  remoteUri: string | null;
  width: number;
  height: number;
  capturedAt: string;
  uploadState: SyncState;
};

export type ObservationQuery = {
  userId: string;
  taxonId?: string;
  category?: string;
  collectionId?: string;
  favorite?: boolean;
  search?: string;
  limit?: number;
};

export type CreateObservationInput = {
  id?: string;
  userId: string;
  observedAt: string;
  taxonId?: string | null;
  identificationStatus: IdentificationStatus;
  confidence?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracy?: number | null;
  localityLabel?: string | null;
  notes?: string | null;
};

export type UserTaxon = {
  userId: string;
  taxonId: string;
  firstObservationId: string;
  firstSeenAt: string;
  lastSeenAt: string;
  observationCount: number;
  favorite: boolean;
  verifiedStatus: 'unverified' | 'userConfirmed' | 'expert';
};
