import type { Quest } from '@/src/domain/quests/types';

export const SEED_QUESTS: Quest[] = [
  {
    id: 'quest-first-five',
    name: 'The First Five',
    description: 'The journal begins with five marks. Ordinary is enough.',
    requirements: [{ kind: 'uniqueTaxa', count: 5 }],
  },
  {
    id: 'quest-pollinator-hunt',
    name: 'The Pollinator Hunt',
    description: 'Find four local pollinators. Watch the flowers. Do not catch them.',
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
    id: 'quest-backyard-safari',
    name: 'Backyard Safari',
    description: 'Discover five species without leaving the places people already walk.',
    requirements: [{ kind: 'category', category: 'bird', count: 3 }],
  },
  {
    id: 'quest-after-dark',
    name: 'After Dark',
    description: 'See what comes out when the sun goes down. Stay on a path. Do not approach wildlife.',
    requirements: [{ kind: 'collection', collectionId: 'col-night', count: 2 }],
  },
  {
    id: 'quest-morning-chorus',
    name: 'Morning Chorus',
    description: 'Discover three birds before the day gets loud.',
    requirements: [{ kind: 'category', category: 'bird', count: 3 }],
  },
  {
    id: 'quest-tiny-things',
    name: 'Tiny Things',
    description: 'Look closely at the overlooked world near flowers and ground.',
    requirements: [{ kind: 'collection', collectionId: 'col-tiny', count: 3 }],
  },
];
