import { MockIdentificationEngine } from '@/src/services/identification/mock-engine';

describe('MockIdentificationEngine', () => {
  const engine = new MockIdentificationEngine();

  test('returns Northern Cardinal for the cardinal fixture', async () => {
    const result = await engine.identify({
      imageUri: 'file://cardinal.jpg',
      observedAt: '2026-08-29T12:00:00.000Z',
      fixtureId: 'northern-cardinal',
    });
    expect(result.kind).toBe('highConfidence');
    if (result.kind === 'highConfidence') {
      expect(result.commonName).toBe('Northern Cardinal');
      expect(result.scientificName).toBe('Cardinalis cardinalis');
    }
  });

  test('returns an uncertain swallowtail pair', async () => {
    const result = await engine.identify({
      imageUri: 'file://swallowtail.jpg',
      observedAt: '2026-08-29T12:00:00.000Z',
      fixtureId: 'ambiguous-swallowtail',
    });
    expect(result.kind).toBe('candidate');
    if (result.kind === 'candidate') {
      expect(result.summaryLabel.toLowerCase()).toContain('swallowtail');
      expect(result.candidates).toHaveLength(2);
      expect(result.candidates[0]?.confidence).toBeCloseTo(0.51);
      expect(result.candidates[1]?.confidence).toBeCloseTo(0.37);
    }
  });

  test('keeps a blurry image as a failed identification', async () => {
    const result = await engine.identify({
      imageUri: 'file://blur.jpg',
      observedAt: '2026-08-29T12:00:00.000Z',
      fixtureId: 'blurry',
    });
    expect(result.kind).toBe('failed');
  });
});
