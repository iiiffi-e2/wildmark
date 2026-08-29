import type { Taxon } from '../taxa/types';
import type { UserTaxon } from '../observations/types';
import type { CollectionProgressDelta } from '../collections/types';
import { MILESTONE_RULES } from './rules';
import type { MilestoneRule, UnlockedMilestone } from './types';

export type MilestoneContext = {
  isNewWildmark: boolean;
  taxon: Taxon | null;
  userTaxa: UserTaxon[];
  taxaById: Map<string, Taxon>;
  collectionDeltas: CollectionProgressDelta[];
  alreadyUnlocked: Set<string>;
  now: string;
};

function categoryCount(userTaxa: UserTaxon[], taxaById: Map<string, Taxon>, category: string): number {
  return userTaxa.filter((item) => taxaById.get(item.taxonId)?.category === category).length;
}

function isSatisfied(rule: MilestoneRule, context: MilestoneContext): boolean {
  switch (rule.kind) {
    case 'firstWildmark':
      return context.isNewWildmark && context.userTaxa.length >= 1;
    case 'speciesCount':
      return context.userTaxa.length >= (rule.threshold ?? Number.POSITIVE_INFINITY);
    case 'categoryFirst':
      return (
        context.isNewWildmark &&
        context.taxon?.category === rule.category &&
        categoryCount(context.userTaxa, context.taxaById, rule.category ?? '') === 1
      );
    case 'categoryCount':
      return categoryCount(context.userTaxa, context.taxaById, rule.category ?? '') >= (rule.threshold ?? Number.POSITIVE_INFINITY);
    case 'nocturnalFirst':
      return Boolean(context.isNewWildmark && context.taxon?.nocturnal) &&
        context.userTaxa.filter((item) => context.taxaById.get(item.taxonId)?.nocturnal).length === 1;
    case 'collectionComplete':
      return context.collectionDeltas.some(
        (delta) => delta.collectionId === rule.collectionId && delta.newlyCompleted,
      );
  }
}

export function evaluateMilestones(
  context: MilestoneContext,
  rules: MilestoneRule[] = MILESTONE_RULES,
): UnlockedMilestone[] {
  return rules
    .filter((rule) => !context.alreadyUnlocked.has(rule.id) && isSatisfied(rule, context))
    .map((rule) => ({
      id: rule.id,
      name: rule.name,
      unlockedAt: context.now,
    }));
}

export function explorerRank(speciesCount: number): { id: string; name: string } {
  if (speciesCount >= 50) return { id: 'wayfinder', name: 'Wayfinder' };
  if (speciesCount >= 30) return { id: 'field-explorer', name: 'Field Explorer' };
  if (speciesCount >= 15) return { id: 'naturalist', name: 'Naturalist' };
  if (speciesCount >= 5) return { id: 'scout', name: 'Scout' };
  return { id: 'observer', name: 'Observer' };
}
