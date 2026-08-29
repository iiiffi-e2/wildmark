import { seedTaxonById } from '@/src/data/seed';
import type { MysteryLevel } from '../collections/types';
import type { Taxon } from './types';

export type MysteryReveal = {
  level: MysteryLevel;
  title: string;
  subtitle: string | null;
  clue: string | null;
  accessibilityLabel: string;
};

export function revealMystery(taxon: Taxon, level: MysteryLevel): MysteryReveal {
  switch (level) {
    case 'identityVisible':
      return {
        level,
        title: taxon.commonName,
        subtitle: taxon.scientificName,
        clue: null,
        accessibilityLabel: taxon.commonName,
      };
    case 'silhouette':
      return {
        level,
        title: 'Undiscovered',
        subtitle: null,
        clue: null,
        accessibilityLabel: `Undiscovered ${taxon.category}`,
      };
    case 'basicClue':
      return {
        level,
        title: 'Nearby and unseen',
        subtitle: null,
        clue: basicClueFor(taxon),
        accessibilityLabel: `Mystery ${taxon.category} nearby`,
      };
    case 'detailedClue':
      return {
        level,
        title: 'Look closely',
        subtitle: null,
        clue: detailedClueFor(taxon),
        accessibilityLabel: `Mystery ${taxon.category} with a field clue`,
      };
  }
}

function basicClueFor(taxon: Taxon): string {
  const seeded = seedTaxonById(taxon.id)?.basicClue;
  if (seeded) {
    return seeded;
  }
  switch (taxon.category) {
    case 'bird':
      return 'A bird that lives near people and trees.';
    case 'insect':
      return 'A small winged insect you might find on flowers.';
    case 'plant':
      return 'A plant that grows in open ground or along paths.';
    case 'fungi':
      return 'A fungus that appears on wood or damp ground.';
    case 'reptile':
      return 'A sun-loving reptile that keeps still until you notice it.';
    case 'mammal':
      return 'A mammal that moves through yards and edges of woods.';
    case 'amphibian':
      return 'An amphibian that stays near moisture.';
    case 'aquatic':
      return 'Something that lives in or beside water.';
  }
}

function detailedClueFor(taxon: Taxon): string {
  const seeded = seedTaxonById(taxon.id)?.detailedClue;
  if (seeded) {
    return seeded;
  }
  if (taxon.habitat) {
    return `Often found around ${taxon.habitat.toLowerCase()}. Look at shape and color before you decide.`;
  }
  return 'Study the silhouette, then the smaller marks. Try another angle if you need to.';
}

export function leaksIdentity(reveal: MysteryReveal, taxon: Taxon): boolean {
  const haystack = `${reveal.title} ${reveal.subtitle ?? ''} ${reveal.clue ?? ''} ${reveal.accessibilityLabel}`.toLowerCase();
  return (
    haystack.includes(taxon.commonName.toLowerCase()) ||
    haystack.includes(taxon.scientificName.toLowerCase()) ||
    haystack.includes(taxon.id.toLowerCase())
  );
}
