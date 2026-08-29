import type { IdentificationResult } from './types';

export const HIGH_CONFIDENCE_THRESHOLD = 0.85;
export const CANDIDATE_THRESHOLD = 0.35;

export function mapConfidenceToKind(
  top: { taxonId: string; confidence: number; commonName: string; scientificName: string },
  others: { taxonId: string; confidence: number; commonName: string; scientificName: string }[],
): 'highConfidence' | 'candidate' | 'lowConfidence' {
  if (top.confidence >= HIGH_CONFIDENCE_THRESHOLD) {
    return 'highConfidence';
  }
  const close = others.filter((item) => top.confidence - item.confidence < 0.2 && item.confidence >= CANDIDATE_THRESHOLD);
  if (close.length > 0 || (top.confidence >= CANDIDATE_THRESHOLD && top.confidence < HIGH_CONFIDENCE_THRESHOLD)) {
    return 'candidate';
  }
  return 'lowConfidence';
}

export function isAcceptableSpeciesResult(result: IdentificationResult): result is Extract<
  IdentificationResult,
  { kind: 'highConfidence' }
> {
  return result.kind === 'highConfidence';
}

export function canSelectCandidate(result: IdentificationResult, taxonId: string): boolean {
  if (result.kind !== 'candidate') {
    return false;
  }
  return result.candidates.some((candidate) => candidate.taxonId === taxonId);
}
