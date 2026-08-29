import type { Quest } from '@/src/domain/quests/types';

export const SEED_QUESTS: Quest[] = [
  {
    id: 'quest-first-five',
    name: 'First Five',
    description: 'Mark five species. The journal begins.',
    requirements: [{ kind: 'uniqueTaxa', count: 5 }],
  },
  {
    id: 'quest-pollinator-hunt',
    name: 'Pollinator Hunt',
    description: 'Find four insects that work the flowers.',
    requirements: [
      {
        kind: 'specificTaxa',
        taxonIds: [
          'taxon-monarch',
          'taxon-gulf-fritillary',
          'taxon-honey-bee',
          'taxon-american-bumble-bee',
        ],
      },
    ],
  },
  {
    id: 'quest-backyard-birds',
    name: 'Backyard Birds',
    description: 'Three birds from ordinary places.',
    requirements: [{ kind: 'category', category: 'bird', count: 3 }],
  },
  {
    id: 'quest-after-dark',
    name: 'After Dark',
    description: 'Notice what appears when the day lets go.',
    requirements: [{ kind: 'collection', collectionId: 'col-night', count: 2 }],
  },
];
