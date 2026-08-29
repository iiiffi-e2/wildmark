import type { Collection } from '@/src/domain/collections/types';
import { SEED_TAXA } from './taxa';

export const SEED_COLLECTIONS: Collection[] = [
  {
    id: 'col-backyard',
    name: 'Backyard Discoveries',
    description: 'Species that share yards, fences, and feeders.',
    type: 'habitat',
    coverCategory: 'bird',
  },
  {
    id: 'col-birds',
    name: 'Birds',
    description: 'A photographic cabinet of birds.',
    type: 'taxonomic',
    coverCategory: 'bird',
  },
  {
    id: 'col-pollinators',
    name: 'Pollinators',
    description: 'Insects that work the flowers.',
    type: 'themed',
    coverCategory: 'insect',
  },
  {
    id: 'col-north-texas',
    name: 'North Texas',
    description: 'What is likely around Allen and Dallas.',
    type: 'geographic',
    coverCategory: 'plant',
  },
  {
    id: 'col-night',
    name: 'Night Creatures',
    description: 'Organisms that appear after the light fades.',
    type: 'habitat',
    coverCategory: 'bird',
  },
  {
    id: 'col-spring',
    name: 'Spring Wildflowers',
    description: 'Color that returns with warmer days.',
    type: 'seasonal',
    coverCategory: 'plant',
  },
];

const backyardHabitats = new Set(['backyard', 'lawn', 'fence', 'eaves', 'shrub', 'garden']);

export const SEED_COLLECTION_TAXA: { collectionId: string; taxonId: string }[] = [
  ...SEED_TAXA.filter((taxon) => taxon.habitat !== null && backyardHabitats.has(taxon.habitat)).map((taxon) => ({
    collectionId: 'col-backyard',
    taxonId: taxon.id,
  })),
  ...SEED_TAXA.filter((taxon) => taxon.category === 'bird').map((taxon) => ({
    collectionId: 'col-birds',
    taxonId: taxon.id,
  })),
  ...SEED_TAXA.filter((taxon) => taxon.pollinator).map((taxon) => ({
    collectionId: 'col-pollinators',
    taxonId: taxon.id,
  })),
  ...SEED_TAXA.map((taxon) => ({
    collectionId: 'col-north-texas',
    taxonId: taxon.id,
  })),
  ...SEED_TAXA.filter((taxon) => taxon.nocturnal).map((taxon) => ({
    collectionId: 'col-night',
    taxonId: taxon.id,
  })),
  ...['taxon-texas-bluebonnet', 'taxon-indian-paintbrush', 'taxon-purple-coneflower', 'taxon-dandelion'].map(
    (taxonId) => ({
      collectionId: 'col-spring',
      taxonId,
    }),
  ),
];
