import type {
  IdentificationCapabilities,
  IdentificationEngine,
  IdentificationRequest,
  IdentificationResult,
} from '@/src/domain/identification/types';

export class HybridIdentificationEngine implements IdentificationEngine {
  readonly id = 'hybrid';

  constructor(
    private readonly onDevice: IdentificationEngine,
    private readonly cloud: IdentificationEngine,
    private readonly preferCloud: boolean,
  ) {}

  async getCapabilities(): Promise<IdentificationCapabilities> {
    const [device, remote] = await Promise.all([this.onDevice.getCapabilities(), this.cloud.getCapabilities()]);
    return {
      id: this.id,
      offline: device.offline,
      categories: [...new Set([...device.categories, ...remote.categories])],
      available: device.available || remote.available,
    };
  }

  async identify(request: IdentificationRequest): Promise<IdentificationResult> {
    if (this.preferCloud) {
      const remote = await this.cloud.getCapabilities();
      if (remote.available) {
        const cloudResult = await this.cloud.identify(request);
        if (cloudResult.kind !== 'failed') {
          return cloudResult;
        }
      }
    }
    return this.onDevice.identify(request);
  }
}
