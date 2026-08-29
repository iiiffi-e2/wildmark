import type { OrganismCategory } from '../taxa/types';

export type MilestoneKind =
  | 'firstWildmark'
  | 'speciesCount'
  | 'categoryFirst'
  | 'categoryCount'
  | 'nocturnalFirst'
  | 'collectionComplete';

export type MilestoneRule = {
  id: string;
  name: string;
  kind: MilestoneKind;
  threshold?: number;
  category?: OrganismCategory;
  collectionId?: string;
};

export type UnlockedMilestone = {
  id: string;
  name: string;
  unlockedAt: string;
};
