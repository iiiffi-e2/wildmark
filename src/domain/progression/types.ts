import type { CollectionProgressDelta } from '../collections/types';
import type { QuestProgressDelta } from '../quests/types';
import type { UnlockedMilestone } from '../milestones/types';

export type ContextualRarity =
  | 'veryCommon'
  | 'commonNearby'
  | 'uncommon'
  | 'rareFind'
  | 'seasonal'
  | 'migratory'
  | 'occasionalVisitor';

export type PersonalRecordKind =
  | 'firstInCategory'
  | 'firstNocturnal'
  | 'speciesCount'
  | 'firstThisYear'
  | 'newCategory';

export type PersonalRecord = {
  kind: PersonalRecordKind;
  label: string;
};

export type CategoryProgressDelta = {
  category: string;
  previous: number;
  current: number;
};

export type RepeatSightingContext = {
  observationCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  isFirstThisYear: boolean;
  newLocality: boolean;
};

export type NearCompletion = {
  kind: 'collection' | 'quest' | 'milestone';
  id: string;
  title: string;
  remaining: number;
  current: number;
  target: number;
};

export type NextDiscoveryKind =
  | 'nearby'
  | 'nearCollection'
  | 'nearQuest'
  | 'seasonal'
  | 'timeOfDay'
  | 'milestone';

export type NextDiscoveryRecommendation = {
  kind: NextDiscoveryKind;
  title: string;
  body: string;
  action: 'scan' | 'explore' | 'collection' | 'quest';
  actionId?: string;
  priority: number;
};

export type MonthlyRecap = {
  monthLabel: string;
  newSpecies: number;
  observations: number;
  places: number;
  collectionsAdvanced: number;
  rarestName: string | null;
  mostSeenName: string | null;
  closestGoal: string | null;
  bestDay: string | null;
};

export type ProgressionSnapshot = {
  collectionDeltas: CollectionProgressDelta[];
  questDeltas: QuestProgressDelta[];
  categoryDeltas: CategoryProgressDelta[];
  milestones: UnlockedMilestone[];
  personalRecords: PersonalRecord[];
  rarity: ContextualRarity | null;
  rarityLabel: string | null;
  repeat: RepeatSightingContext | null;
  nearCompletions: NearCompletion[];
};

export type FeedbackLevel = 1 | 2 | 3 | 4 | 5;
