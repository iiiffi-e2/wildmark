import type { CollectionProgressDelta } from '../collections/types';
import type { QuestProgressDelta } from '../quests/types';
import type { Taxon } from '../taxa/types';
import type { UserTaxon } from '../observations/types';
import type { NearCompletion, NextDiscoveryRecommendation } from './types';
import type { OccurrenceResult } from '@/src/services/occurrence/mock';
import { TAXON_SAFETY } from '@/src/data/seed';

export function nearCompletions(input: {
  collections: CollectionProgressDelta[];
  quests: QuestProgressDelta[];
  speciesCount: number;
}): NearCompletion[] {
  const closeCollections = input.collections
    .filter((item) => item.totalCount > 0 && item.discoveredCount < item.totalCount && item.totalCount - item.discoveredCount <= 3)
    .map((item) => ({
      kind: 'collection' as const,
      id: item.collectionId,
      title: item.collectionName,
      remaining: item.totalCount - item.discoveredCount,
      current: item.discoveredCount,
      target: item.totalCount,
    }));
  const closeQuests = input.quests
    .filter((item) => item.current < item.target && item.target - item.current <= 2)
    .map((item) => ({
      kind: 'quest' as const,
      id: item.questId,
      title: item.questName,
      remaining: item.target - item.current,
      current: item.current,
      target: item.target,
    }));
  const milestones: NearCompletion[] = [];
  const nextThreshold = [5, 10, 25, 50, 100].find((value) => input.speciesCount < value && value - input.speciesCount <= 3);
  if (nextThreshold) {
    milestones.push({
      kind: 'milestone',
      id: `ms-${nextThreshold}`,
      title: `${nextThreshold} species`,
      remaining: nextThreshold - input.speciesCount,
      current: input.speciesCount,
      target: nextThreshold,
    });
  }
  return [...closeQuests, ...closeCollections, ...milestones];
}

export function getRecommendations(input: {
  nearby: OccurrenceResult[];
  discoveredIds: Set<string>;
  taxaById: Map<string, Taxon>;
  collections: CollectionProgressDelta[];
  quests: QuestProgressDelta[];
  userTaxa: UserTaxon[];
  hour?: number;
}): NextDiscoveryRecommendation[] {
  const hour = input.hour ?? new Date().getHours();
  const recommendations: NextDiscoveryRecommendation[] = [];
  const close = nearCompletions({
    collections: input.collections,
    quests: input.quests,
    speciesCount: input.userTaxa.length,
  });

  for (const item of close.slice(0, 2)) {
    recommendations.push({
      kind: item.kind === 'quest' ? 'nearQuest' : item.kind === 'collection' ? 'nearCollection' : 'milestone',
      title: item.remaining === 1 ? `One more to complete ${item.title}` : `${item.remaining} left in ${item.title}`,
      body:
        item.kind === 'quest'
          ? 'A short walk could finish this hunt.'
          : 'The missing spaces are still nearby.',
      action: item.kind === 'quest' ? 'quest' : item.kind === 'collection' ? 'collection' : 'scan',
      actionId: item.id,
      priority: 90 - item.remaining,
    });
  }

  const easyNearby = input.nearby
    .filter((item) => !input.discoveredIds.has(item.taxonId) && item.occurrenceClass === 'veryLikely')
    .filter((item) => !(TAXON_SAFETY[item.taxonId] ?? []).includes('dangerousWildlife'))
    .slice(0, 3);
  if (easyNearby.length > 0) {
    recommendations.push({
      kind: 'nearby',
      title: `${easyNearby.length} easy finds nearby`,
      body: 'Ordinary places. Look at fences, flowers, and lawns.',
      action: 'explore',
      priority: 70,
    });
  }

  if (hour >= 19 || hour < 5) {
    recommendations.push({
      kind: 'timeOfDay',
      title: 'Active around sunset',
      body: 'After dark is a different field. Observe from a path. Do not approach wildlife.',
      action: 'explore',
      priority: 55,
    });
  }

  const seasonal = [...input.taxaById.values()].filter(
    (taxon) => !input.discoveredIds.has(taxon.id) && taxon.habitat === 'roadside' && taxon.category === 'plant',
  );
  if (seasonal.length > 0) {
    recommendations.push({
      kind: 'seasonal',
      title: 'New this season',
      body: 'Spring color returns along roadsides and open ground.',
      action: 'collection',
      actionId: 'col-spring',
      priority: 50,
    });
  }

  return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 2);
}

export interface NextDiscoveryService {
  getRecommendations(context: Parameters<typeof getRecommendations>[0]): Promise<NextDiscoveryRecommendation[]>;
}

export class LocalNextDiscoveryService implements NextDiscoveryService {
  async getRecommendations(context: Parameters<typeof getRecommendations>[0]) {
    return getRecommendations(context);
  }
}
