import type { MilestoneRule } from './types';

export const MILESTONE_RULES: MilestoneRule[] = [
  { id: 'ms-first-wildmark', name: 'First Wildmark', kind: 'firstWildmark' },
  { id: 'ms-first-five', name: 'First Five', kind: 'speciesCount', threshold: 5 },
  { id: 'ms-double-digits', name: 'Double Digits', kind: 'speciesCount', threshold: 10 },
  { id: 'ms-field-twenty-five', name: 'Field Twenty-Five', kind: 'speciesCount', threshold: 25 },
  { id: 'ms-half-century', name: 'Half Century', kind: 'speciesCount', threshold: 50 },
  { id: 'ms-century', name: 'Century', kind: 'speciesCount', threshold: 100 },
  { id: 'ms-first-bird', name: 'First Bird', kind: 'categoryFirst', category: 'bird' },
  { id: 'ms-ten-birds', name: 'Ten Birds', kind: 'categoryCount', category: 'bird', threshold: 10 },
  { id: 'ms-first-pollinator', name: 'First Pollinator', kind: 'categoryFirst', category: 'insect' },
  { id: 'ms-first-fungus', name: 'First Fungus', kind: 'categoryFirst', category: 'fungi' },
  { id: 'ms-first-reptile', name: 'First Reptile', kind: 'categoryFirst', category: 'reptile' },
  { id: 'ms-first-plant', name: 'First Plant', kind: 'categoryFirst', category: 'plant' },
  { id: 'ms-first-mammal', name: 'First Mammal', kind: 'categoryFirst', category: 'mammal' },
  { id: 'ms-first-night', name: 'First Night Discovery', kind: 'nocturnalFirst' },
];
