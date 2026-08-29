import type { Taxon } from '../taxa/types';
import type { Observation, UserTaxon } from '../observations/types';
import type { Quest, QuestRequirement, UserQuestProgress } from './types';

export function requirementTarget(requirement: QuestRequirement): number {
  switch (requirement.kind) {
    case 'uniqueTaxa':
      return requirement.count;
    case 'specificTaxa':
      return requirement.taxonIds.length;
    case 'category':
    case 'collection':
    case 'habitat':
    case 'time':
      return requirement.count;
  }
}

export function questTarget(quest: Quest): number {
  return quest.requirements.reduce((sum, requirement) => sum + requirementTarget(requirement), 0);
}

export function countRequirementProgress(
  requirement: QuestRequirement,
  context: {
    userTaxa: UserTaxon[];
    taxaById: Map<string, Taxon>;
    collectionTaxonIds: string[];
    observations: Observation[];
  },
): number {
  const discoveredIds = new Set(context.userTaxa.map((item) => item.taxonId));

  switch (requirement.kind) {
    case 'uniqueTaxa':
      return Math.min(discoveredIds.size, requirement.count);
    case 'specificTaxa':
      return requirement.taxonIds.filter((id) => discoveredIds.has(id)).length;
    case 'category':
      return Math.min(
        [...discoveredIds].filter((id) => context.taxaById.get(id)?.category === requirement.category).length,
        requirement.count,
      );
    case 'collection':
      return Math.min(
        requirement.count,
        context.collectionTaxonIds.filter((id) => discoveredIds.has(id)).length,
      );
    case 'habitat':
      return Math.min(
        [...discoveredIds].filter((id) => context.taxaById.get(id)?.habitat === requirement.habitat).length,
        requirement.count,
      );
    case 'time': {
      const matching = context.observations.filter((observation) => {
        if (!observation.taxonId || !discoveredIds.has(observation.taxonId)) {
          return false;
        }
        const hour = new Date(observation.observedAt).getHours();
        if (requirement.afterHour <= requirement.beforeHour) {
          return hour >= requirement.afterHour && hour < requirement.beforeHour;
        }
        return hour >= requirement.afterHour || hour < requirement.beforeHour;
      });
      const unique = new Set(matching.map((item) => item.taxonId).filter(Boolean));
      return Math.min(unique.size, requirement.count);
    }
  }
}

export function evaluateQuestProgress(
  quest: Quest,
  context: {
    userId: string;
    userTaxa: UserTaxon[];
    taxaById: Map<string, Taxon>;
    collectionTaxonIdsByQuest: Map<string, string[]>;
    observations: Observation[];
    previous?: UserQuestProgress | null;
    now: string;
  },
): UserQuestProgress {
  const current = quest.requirements.reduce((sum, requirement) => {
    const collectionTaxonIds =
      requirement.kind === 'collection'
        ? (context.collectionTaxonIdsByQuest.get(requirement.collectionId) ?? [])
        : [];
    return (
      sum +
      countRequirementProgress(requirement, {
        userTaxa: context.userTaxa,
        taxaById: context.taxaById,
        collectionTaxonIds,
        observations: context.observations,
      })
    );
  }, 0);
  const target = questTarget(quest);
  const completed = current >= target;
  return {
    userId: context.userId,
    questId: quest.id,
    current,
    target,
    completedAt: completed ? (context.previous?.completedAt ?? context.now) : null,
  };
}
