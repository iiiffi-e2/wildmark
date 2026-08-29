import type {
  IdentificationCapabilities,
  IdentificationEngine,
  IdentificationRequest,
  IdentificationResult,
} from '@/src/domain/identification/types';
import {
  IDENTIFICATION_FIXTURES,
  IDENTIFICATION_FIXTURE_IDS,
  type IdentificationFixtureId,
} from './fixtures';

function isFixtureId(value: string): value is IdentificationFixtureId {
  return (IDENTIFICATION_FIXTURE_IDS as readonly string[]).includes(value);
}

function inferFixture(imageUri: string): IdentificationFixtureId {
  const lower = imageUri.toLowerCase();
  const match = IDENTIFICATION_FIXTURE_IDS.find((id) => lower.includes(id));
  if (match) {
    return match;
  }
  if (lower.includes('blur')) return 'blurry';
  if (lower.includes('swallow')) return 'ambiguous-swallowtail';
  if (lower.includes('mushroom') || lower.includes('fung')) return 'uncertain-mushroom';
  return 'northern-cardinal';
}

export class MockIdentificationEngine implements IdentificationEngine {
  readonly id = 'mock';

  constructor(private readonly delayMs = 0) {}

  async getCapabilities(): Promise<IdentificationCapabilities> {
    return {
      id: this.id,
      offline: true,
      categories: ['bird', 'insect', 'plant', 'reptile', 'fungi'],
      available: true,
    };
  }

  async identify(request: IdentificationRequest): Promise<IdentificationResult> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }
    const fixtureId =
      request.fixtureId && isFixtureId(request.fixtureId)
        ? request.fixtureId
        : inferFixture(request.imageUri);
    return IDENTIFICATION_FIXTURES[fixtureId];
  }
}
