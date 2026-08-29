export type CollectionType =
  | 'geographic'
  | 'taxonomic'
  | 'seasonal'
  | 'habitat'
  | 'themed'
  | 'event';

export type MysteryLevel = 'identityVisible' | 'silhouette' | 'basicClue' | 'detailedClue';

export type Collection = {
  id: string;
  name: string;
  description: string;
  type: CollectionType;
  coverCategory: string | null;
};

export type CollectionTaxon = {
  collectionId: string;
  taxonId: string;
};

export type CollectionProgressDelta = {
  collectionId: string;
  collectionName: string;
  previousCount: number;
  discoveredCount: number;
  totalCount: number;
  newlyCompleted: boolean;
};
