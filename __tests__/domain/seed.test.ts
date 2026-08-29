import { SEED_COLLECTIONS, SEED_QUESTS, SEED_TAXA } from '@/src/data/seed';

describe('fixture catalog', () => {
  test('seeds at least 30 taxa across several categories', () => {
    const categories = new Set(SEED_TAXA.map((taxon) => taxon.category));
    expect(SEED_TAXA.length).toBeGreaterThanOrEqual(30);
    expect(categories.has('bird')).toBe(true);
    expect(categories.has('insect')).toBe(true);
    expect(categories.has('plant')).toBe(true);
    expect(categories.has('fungi')).toBe(true);
    expect(categories.has('mammal')).toBe(true);
    expect(categories.has('reptile')).toBe(true);
  });

  test('seeds the required collections and quests', () => {
    expect(SEED_COLLECTIONS.map((item) => item.name)).toEqual(
      expect.arrayContaining([
        'Backyard Discoveries',
        'Birds',
        'Pollinators',
        'North Texas',
        'Night Creatures',
        'Spring Wildflowers',
      ]),
    );
    expect(SEED_QUESTS.map((item) => item.name)).toEqual(
      expect.arrayContaining([
        'The First Five',
        'The Pollinator Hunt',
        'Backyard Safari',
        'After Dark',
        'Morning Chorus',
        'Tiny Things',
      ]),
    );
    expect(SEED_COLLECTIONS.map((item) => item.name)).toEqual(
      expect.arrayContaining(['Things That Sting', 'Tiny Things']),
    );
  });
});
