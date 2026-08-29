import { TAXONOMIC_RANKS, type TaxonomicRank } from './types';

const RANK_INDEX = new Map<TaxonomicRank, number>(
  TAXONOMIC_RANKS.map((rank, index) => [rank, index]),
);

export function rankIndex(rank: TaxonomicRank): number {
  return RANK_INDEX.get(rank) ?? -1;
}

export function isAtLeastRank(actual: TaxonomicRank, minimum: TaxonomicRank): boolean {
  return rankIndex(actual) >= rankIndex(minimum);
}

export function compareRanks(a: TaxonomicRank, b: TaxonomicRank): number {
  return rankIndex(a) - rankIndex(b);
}
