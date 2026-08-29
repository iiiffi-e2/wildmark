import type { TaxonomicRank, TaxonomyTrailItem } from '../taxa/types';

export type IdentificationState =
  | 'idle'
  | 'capturing'
  | 'preparing'
  | 'detecting'
  | 'classifying'
  | 'evaluating'
  | 'identified'
  | 'ambiguous'
  | 'lowConfidence'
  | 'unsupported'
  | 'failed';

export type IdentificationCandidate = {
  taxonId: string;
  commonName: string;
  scientificName: string;
  confidence: number;
  rankOrder: number;
};

export type HighConfidenceIdentification = {
  kind: 'highConfidence';
  taxonId: string;
  commonName: string;
  scientificName: string;
  confidence: number;
  trail: TaxonomyTrailItem[];
};

export type CandidateIdentification = {
  kind: 'candidate';
  summaryLabel: string;
  candidates: IdentificationCandidate[];
  higherRank?: {
    rank: TaxonomicRank;
    label: string;
  };
};

export type HigherRankIdentification = {
  kind: 'higherRank';
  rank: TaxonomicRank;
  taxonId: string | null;
  commonName: string;
  scientificName: string;
  confidence: number;
  trail: TaxonomyTrailItem[];
};

export type UnsupportedIdentification = {
  kind: 'unsupported';
  reason: string;
};

export type FailedIdentification = {
  kind: 'failed';
  reason: string;
};

export type IdentificationResult =
  | HighConfidenceIdentification
  | CandidateIdentification
  | HigherRankIdentification
  | UnsupportedIdentification
  | FailedIdentification;

export type IdentificationRequest = {
  imageUri: string;
  observedAt: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  locale?: string;
  fixtureId?: string;
};

export type IdentificationCapabilities = {
  id: string;
  offline: boolean;
  categories: string[];
  available: boolean;
};

export type IdentificationAttempt = {
  id: string;
  observationId: string;
  engine: string;
  modelVersion: string;
  startedAt: string;
  completedAt: string | null;
  selectedTaxonId: string | null;
  status: IdentificationState;
  confidence: number | null;
};

export interface IdentificationEngine {
  id: string;
  getCapabilities(): Promise<IdentificationCapabilities>;
  identify(request: IdentificationRequest): Promise<IdentificationResult>;
}
