import { seedTaxonById } from '@/src/data/seed';
import type { Taxon } from '../taxa/types';
import type { UserTaxon } from '../observations/types';
import type { Quest } from './types';

export type QuestObjective = {
  id: string;
  label: string;
  done: boolean;
  mystery: boolean;
};

export function listQuestObjectives(
  quest: Quest,
  context: {
    userTaxa: UserTaxon[];
    taxaById: Map<string, Taxon>;
    collectionTaxonIds?: string[];
  },
): QuestObjective[] {
  const discovered = new Set(context.userTaxa.map((item) => item.taxonId));
  const objectives: QuestObjective[] = [];

  for (const requirement of quest.requirements) {
    if (requirement.kind === 'specificTaxa') {
      for (const taxonId of requirement.taxonIds) {
        const taxon = context.taxaById.get(taxonId) ?? seedTaxonById(taxonId);
        const done = discovered.has(taxonId);
        objectives.push({
          id: taxonId,
          label: done ? (taxon?.commonName ?? 'Found') : '???',
          done,
          mystery: !done,
        });
      }
      continue;
    }
    if (requirement.kind === 'collection') {
      const ids = context.collectionTaxonIds ?? [];
      for (const taxonId of ids) {
        const taxon = context.taxaById.get(taxonId);
        const done = discovered.has(taxonId);
        objectives.push({
          id: taxonId,
          label: done ? (taxon?.commonName ?? 'Found') : '???',
          done,
          mystery: !done,
        });
      }
      continue;
    }
    if (requirement.kind === 'uniqueTaxa' || requirement.kind === 'category' || requirement.kind === 'habitat' || requirement.kind === 'time') {
      const count = requirement.kind === 'uniqueTaxa' || requirement.kind === 'category' || requirement.kind === 'habitat' || requirement.kind === 'time'
        ? requirement.count
        : 0;
      const matching = context.userTaxa.filter((item) => {
        const taxon = context.taxaById.get(item.taxonId);
        if (requirement.kind === 'uniqueTaxa') return true;
        if (requirement.kind === 'category') return taxon?.category === requirement.category;
        if (requirement.kind === 'habitat') return taxon?.habitat === requirement.habitat;
        return true;
      });
      for (let index = 0; index < count; index += 1) {
        const owned = matching[index];
        const taxon = owned ? context.taxaById.get(owned.taxonId) : undefined;
        objectives.push({
          id: `${quest.id}-${requirement.kind}-${index}`,
          label: taxon?.commonName ?? '???',
          done: Boolean(owned),
          mystery: !owned,
        });
      }
    }
  }

  return objectives;
}
