import { seedTaxonById } from '@/src/data/seed';
import { revealMystery } from '../taxa/mystery';
import type { Taxon } from '../taxa/types';

export type ExplorerClue = {
  index: number;
  title: string;
  body: string;
};

export function explorerCluesFor(taxon: Taxon): ExplorerClue[] {
  const seed = seedTaxonById(taxon.id);
  const basic = seed?.basicClue ?? revealMystery(taxon, 'basicClue').clue ?? 'Look near ordinary places people already walk.';
  const detailed = seed?.detailedClue ?? revealMystery(taxon, 'detailedClue').clue ?? 'Study shape and color before you decide.';
  return [
    {
      index: 0,
      title: 'Something is nearby',
      body: 'A living thing you have not marked yet is likely in ordinary habitat around you.',
    },
    {
      index: 1,
      title: 'Clue 1',
      body: basic,
    },
    {
      index: 2,
      title: 'Clue 2',
      body: detailed,
    },
  ];
}

export function visibleExplorerClues(taxon: Taxon, unlockedCount: number): ExplorerClue[] {
  return explorerCluesFor(taxon).slice(0, Math.min(3, Math.max(1, unlockedCount)));
}

export function cluesLeakIdentity(taxon: Taxon): boolean {
  const haystack = explorerCluesFor(taxon)
    .map((item) => `${item.title} ${item.body}`)
    .join(' ')
    .toLowerCase();
  return (
    haystack.includes(taxon.commonName.toLowerCase()) ||
    haystack.includes(taxon.scientificName.toLowerCase()) ||
    haystack.includes(taxon.id.toLowerCase())
  );
}
