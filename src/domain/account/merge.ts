import type { Observation, ObservationPhoto, UserTaxon } from '../observations/types';
import type { UserQuestProgress } from '../quests/types';
import type { UnlockedMilestone } from '../milestones/types';

export type MergeableJournal = {
  observations: Observation[];
  photos: ObservationPhoto[];
  userTaxa: UserTaxon[];
  questProgress: UserQuestProgress[];
  milestones: UnlockedMilestone[];
};

function earlier(a: string, b: string): string {
  return a <= b ? a : b;
}

function later(a: string, b: string): string {
  return a >= b ? a : b;
}

export function mergeLocalJournals(local: MergeableJournal, incoming: MergeableJournal): MergeableJournal {
  const observationsById = new Map<string, Observation>();
  for (const observation of [...local.observations, ...incoming.observations]) {
    const existing = observationsById.get(observation.id);
    if (!existing || existing.updatedAt < observation.updatedAt) {
      observationsById.set(observation.id, observation);
    }
  }

  const photosById = new Map<string, ObservationPhoto>();
  for (const photo of [...local.photos, ...incoming.photos]) {
    photosById.set(photo.id, photo);
  }

  const taxa = new Map<string, UserTaxon>();
  for (const record of [...local.userTaxa, ...incoming.userTaxa]) {
    const existing = taxa.get(record.taxonId);
    if (!existing) {
      taxa.set(record.taxonId, record);
      continue;
    }
    taxa.set(record.taxonId, {
      ...existing,
      firstSeenAt: earlier(existing.firstSeenAt, record.firstSeenAt),
      lastSeenAt: later(existing.lastSeenAt, record.lastSeenAt),
      firstObservationId: existing.firstSeenAt <= record.firstSeenAt ? existing.firstObservationId : record.firstObservationId,
      observationCount: Math.max(existing.observationCount, record.observationCount),
      favorite: existing.favorite || record.favorite,
    });
  }

  const quests = new Map<string, UserQuestProgress>();
  for (const progress of [...local.questProgress, ...incoming.questProgress]) {
    const existing = quests.get(progress.questId);
    if (!existing || existing.current < progress.current) {
      quests.set(progress.questId, progress);
    }
  }

  const milestones = new Map<string, UnlockedMilestone>();
  for (const milestone of [...local.milestones, ...incoming.milestones]) {
    if (!milestones.has(milestone.id)) {
      milestones.set(milestone.id, milestone);
    }
  }

  return {
    observations: [...observationsById.values()].sort((a, b) => b.observedAt.localeCompare(a.observedAt)),
    photos: [...photosById.values()],
    userTaxa: [...taxa.values()],
    questProgress: [...quests.values()],
    milestones: [...milestones.values()],
  };
}
