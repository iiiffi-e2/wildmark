import type { OrganismCategory } from '../taxa/types';

export type UniqueTaxaRequirement = {
  kind: 'uniqueTaxa';
  count: number;
};

export type SpecificTaxaRequirement = {
  kind: 'specificTaxa';
  taxonIds: string[];
};

export type CategoryRequirement = {
  kind: 'category';
  category: OrganismCategory;
  count: number;
};

export type CollectionRequirement = {
  kind: 'collection';
  collectionId: string;
  count: number;
};

export type HabitatRequirement = {
  kind: 'habitat';
  habitat: string;
  count: number;
};

export type TimeRequirement = {
  kind: 'time';
  afterHour: number;
  beforeHour: number;
  count: number;
};

export type QuestRequirement =
  | UniqueTaxaRequirement
  | SpecificTaxaRequirement
  | CategoryRequirement
  | CollectionRequirement
  | HabitatRequirement
  | TimeRequirement;

export type Quest = {
  id: string;
  name: string;
  description: string;
  requirements: QuestRequirement[];
};

export type UserQuestProgress = {
  userId: string;
  questId: string;
  current: number;
  target: number;
  completedAt: string | null;
};

export type QuestProgressDelta = {
  questId: string;
  questName: string;
  current: number;
  target: number;
  newlyCompleted: boolean;
};

export type Badge = {
  id: string;
  name: string;
};
