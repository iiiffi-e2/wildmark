import type { Observation, UserTaxon } from '../observations/types';
import type { Taxon } from '../taxa/types';
import type { CollectionProgressDelta } from '../collections/types';
import type { MonthlyRecap } from './types';
import type { OccurrenceResult } from '@/src/services/occurrence/mock';

export function monthlyRecap(input: {
  month: Date;
  observations: Observation[];
  userTaxa: UserTaxon[];
  taxaById: Map<string, Taxon>;
  collections: CollectionProgressDelta[];
  nearby: OccurrenceResult[];
}): MonthlyRecap {
  const year = input.month.getFullYear();
  const month = input.month.getMonth();
  const inMonth = input.observations.filter((item) => {
    const date = new Date(item.observedAt);
    return date.getFullYear() === year && date.getMonth() === month;
  });
  const newSpecies = input.userTaxa.filter((item) => {
    const date = new Date(item.firstSeenAt);
    return date.getFullYear() === year && date.getMonth() === month;
  });
  const places = new Set(inMonth.map((item) => item.localityLabel).filter(Boolean));
  const byDay = new Map<string, number>();
  for (const observation of inMonth) {
    const key = observation.observedAt.slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  const best = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0];
  const mostSeen = [...input.userTaxa].sort((a, b) => b.observationCount - a.observationCount)[0];
  const rareNearby = input.nearby
    .filter((item) => item.occurrenceClass === 'rare' && newSpecies.some((owned) => owned.taxonId === item.taxonId))
    .map((item) => input.taxaById.get(item.taxonId)?.commonName ?? null)[0] ?? null;
  const closest = [...input.collections]
    .filter((item) => item.totalCount > item.discoveredCount)
    .sort((a, b) => a.totalCount - a.discoveredCount - (b.totalCount - b.discoveredCount))[0];

  return {
    monthLabel: input.month.toLocaleDateString(undefined, { month: 'long' }),
    newSpecies: newSpecies.length,
    observations: inMonth.length,
    places: places.size,
    collectionsAdvanced: input.collections.filter((item) => item.discoveredCount > 0).length,
    rarestName: rareNearby ?? (newSpecies[0] ? input.taxaById.get(newSpecies[0].taxonId)?.commonName ?? null : null),
    mostSeenName: mostSeen ? input.taxaById.get(mostSeen.taxonId)?.commonName ?? null : null,
    closestGoal: closest ? `${closest.collectionName} — ${closest.discoveredCount} / ${closest.totalCount}` : null,
    bestDay: best ? `${best[0]} — ${best[1]} encounters` : null,
  };
}

export function categoryBreakdown(userTaxa: UserTaxon[], taxaById: Map<string, Taxon>): { category: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const item of userTaxa) {
    const category = taxaById.get(item.taxonId)?.category;
    if (!category) continue;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export function speciesRecords(input: {
  taxon: Taxon;
  userTaxon?: UserTaxon;
  observations: Observation[];
}): {
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  totalSightings: number;
  places: string[];
  months: number[];
} {
  const ofTaxon = input.observations.filter((item) => item.taxonId === input.taxon.id);
  const months = [...new Set(ofTaxon.map((item) => new Date(item.observedAt).getMonth()))].sort((a, b) => a - b);
  const places = [...new Set(ofTaxon.map((item) => item.localityLabel).filter((value): value is string => Boolean(value)))];
  return {
    firstSeenAt: input.userTaxon?.firstSeenAt ?? ofTaxon[0]?.observedAt ?? null,
    lastSeenAt: input.userTaxon?.lastSeenAt ?? ofTaxon[ofTaxon.length - 1]?.observedAt ?? null,
    totalSightings: input.userTaxon?.observationCount ?? ofTaxon.length,
    places,
    months,
  };
}
