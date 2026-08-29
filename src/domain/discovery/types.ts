import type { CollectionProgressDelta } from '../collections/types';
import type { Badge, QuestProgressDelta } from '../quests/types';
import type { IdentificationResult } from '../identification/types';
import type { IdentificationStatus } from '../observations/types';
import type { UnlockedMilestone } from '../milestones/types';
import type { OccurrenceClass } from '@/src/services/occurrence/mock';
import type {
  CategoryProgressDelta,
  ContextualRarity,
  NearCompletion,
  PersonalRecord,
  RepeatSightingContext,
} from '../progression/types';

export type NewWildmarkEvent = {
  userId: string;
  observationId: string;
  taxonId: string;
  discoveredAt: string;
  relevantCollectionIds: string[];
  completedQuestIds: string[];
};

export type DiscoveryResult = {
  observationId: string;
  taxonId: string;
  isNewWildmark: boolean;
  observationCountForTaxon: number;
  collectionDeltas: CollectionProgressDelta[];
  questDeltas: QuestProgressDelta[];
  categoryDeltas: CategoryProgressDelta[];
  milestones: UnlockedMilestone[];
  personalRecords: PersonalRecord[];
  rarity: ContextualRarity | null;
  rarityLabel: string | null;
  repeat: RepeatSightingContext | null;
  nearCompletions: NearCompletion[];
  earnedBadges: Badge[];
  event: NewWildmarkEvent | null;
};

export type CapturedImage = {
  localUri: string;
  thumbnailUri?: string;
  displayUri?: string;
  width: number;
  height: number;
  capturedAt: string;
};

export type GeoPoint = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  localityLabel?: string;
};

export type AcceptIdentificationInput = {
  userId: string;
  image: CapturedImage;
  observedAt: string;
  location?: GeoPoint;
  selectedTaxonId: string;
  confidence: number;
  identificationStatus: Extract<IdentificationStatus, 'identified' | 'ambiguous' | 'lowConfidence'>;
  identification: {
    engine: string;
    modelVersion: string;
    result: IdentificationResult;
  };
  notes?: string;
  now?: string;
  occurrenceClass?: OccurrenceClass;
};

export type RecordUnidentifiedInput = {
  userId: string;
  image: CapturedImage;
  observedAt: string;
  location?: GeoPoint;
  status: Extract<IdentificationStatus, 'unidentified' | 'failed' | 'unsupported'>;
  notes?: string;
  now?: string;
};

export type CorrectIdentificationInput = {
  userId: string;
  observationId: string;
  selectedTaxonId: string;
  confidence?: number;
  now?: string;
};
