import type {
  IdentificationCapabilities,
  IdentificationEngine,
  IdentificationRequest,
  IdentificationResult,
} from '@/src/domain/identification/types';
import { SEED_TAXA } from '@/src/data/seed';
import { mapConfidenceToKind } from '@/src/domain/identification/confidence';

type InatResult = {
  results?: {
    taxon?: { id?: number; name?: string; preferred_common_name?: string };
    combined_score?: number;
    score?: number;
  }[];
};

export class CloudIdentificationEngine implements IdentificationEngine {
  readonly id = 'inaturalist-cloud';

  constructor(private readonly token?: string) {}

  async getCapabilities(): Promise<IdentificationCapabilities> {
    return {
      id: this.id,
      offline: false,
      categories: ['bird', 'insect', 'plant', 'fungi', 'reptile', 'mammal'],
      available: Boolean(this.token),
    };
  }

  async identify(request: IdentificationRequest): Promise<IdentificationResult> {
    if (!this.token) {
      return { kind: 'failed', reason: 'Cloud identification is not configured.' };
    }
    const form = new FormData();
    form.append('image', {
      uri: request.imageUri,
      name: 'observation.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);

    const response = await fetch('https://api.inaturalist.org/v1/computervision/score_image', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}` },
      body: form,
    });
    if (!response.ok) {
      return { kind: 'failed', reason: 'Look again. The photograph could not be read.' };
    }
    const payload = (await response.json()) as InatResult;
    const mapped = (payload.results ?? [])
      .map((item, index) => {
        const scientific = item.taxon?.name ?? '';
        const common = item.taxon?.preferred_common_name ?? scientific;
        const local = SEED_TAXA.find(
          (taxon) => taxon.scientificName.toLowerCase() === scientific.toLowerCase(),
        );
        return {
          taxonId: local?.id ?? `inat-${item.taxon?.id ?? index}`,
          commonName: common,
          scientificName: scientific,
          confidence: (item.combined_score ?? item.score ?? 0) / 100,
        };
      })
      .filter((item) => item.scientificName);

    const top = mapped[0];
    if (!top) {
      return { kind: 'unsupported', reason: 'Wildmark is looking for living organisms.' };
    }
    const kind = mapConfidenceToKind(top, mapped.slice(1));
    if (kind === 'highConfidence' && top.taxonId.startsWith('taxon-')) {
      return {
        kind: 'highConfidence',
        taxonId: top.taxonId,
        commonName: top.commonName,
        scientificName: top.scientificName,
        confidence: top.confidence,
        trail: [{ rank: 'species', label: top.commonName }],
      };
    }
    return {
      kind: 'candidate',
      summaryLabel: `This looks like ${top.commonName.toLowerCase()}`,
      candidates: mapped.slice(0, 3).map((item, rankOrder) => ({
        ...item,
        rankOrder: rankOrder + 1,
      })),
    };
  }
}
