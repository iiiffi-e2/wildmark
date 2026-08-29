import type {
  IdentificationCapabilities,
  IdentificationEngine,
  IdentificationRequest,
  IdentificationResult,
} from '@/src/domain/identification/types';
import { MockIdentificationEngine } from './mock-engine';

export class OnDeviceIdentificationEngine implements IdentificationEngine {
  readonly id = 'on-device';
  private readonly fallback = new MockIdentificationEngine(0);

  async getCapabilities(): Promise<IdentificationCapabilities> {
    return {
      id: this.id,
      offline: true,
      categories: ['bird', 'insect', 'plant', 'reptile', 'fungi'],
      available: true,
    };
  }

  async identify(request: IdentificationRequest): Promise<IdentificationResult> {
    return this.fallback.identify(request);
  }
}
