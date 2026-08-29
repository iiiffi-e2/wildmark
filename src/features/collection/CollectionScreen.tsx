import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { CollectionCard } from '@/src/design-system/components/CollectionCard';
import { Screen } from '@/src/design-system/components/Screen';
import { SpeciesTile } from '@/src/design-system/components/SpeciesTile';
import { MysterySpeciesTile } from '@/src/design-system/components/MysterySpeciesTile';
import { Text } from '@/src/design-system/components/Text';
import { useTheme } from '@/src/design-system/theme';
import { mysteryForTaxon, useWildmark } from '@/src/app-state/WildmarkProvider';
import { analytics } from '@/src/services/analytics/service';
import { categoryLabel } from '@/src/data/seed';
import type { OrganismCategory } from '@/src/domain/taxa/types';

export function CollectionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { collections, collectionProgress, taxa, userTaxa, user, categoryCounts, collectionTaxonIds } = useWildmark();
  const discoveredIds = new Set(userTaxa.map((item) => item.taxonId));
  const closest = [...collectionProgress]
    .filter((item) => item.totalCount > item.discoveredCount)
    .sort((a, b) => a.totalCount - a.discoveredCount - (b.totalCount - b.discoveredCount))[0];
  const mysteryFromClosest = (closest
    ? collectionTaxonIds(closest.collectionId)
        .map((id) => taxa.find((taxon) => taxon.id === id))
        .filter((taxon): taxon is (typeof taxa)[number] => taxon != null)
        .filter((taxon) => !discoveredIds.has(taxon.id))
    : taxa.filter((taxon) => !discoveredIds.has(taxon.id))
  ).slice(0, 4);

  return (
    <Screen>
      <Text variant="kicker" color="secondary">
        Your world
      </Text>
      <Text variant="display" style={{ marginTop: theme.space[8] }}>
        {userTaxa.length} species discovered
      </Text>
      <View style={{ marginTop: theme.space[16], gap: theme.space[8] }}>
        {categoryCounts.length === 0 ? (
          <Text variant="body" color="secondary">
            The cabinet is empty. The first mark begins the collection.
          </Text>
        ) : (
          categoryCounts.map((item) => (
            <Text key={item.category} variant="title">
              {item.count} {categoryLabel(item.category as OrganismCategory)}
            </Text>
          ))
        )}
      </View>
      {closest ? (
        <View style={{ marginTop: theme.space[32] }}>
          <Text variant="kicker" color="mark">
            Closest set
          </Text>
          <Text variant="title" style={{ marginTop: theme.space[8] }}>
            {closest.collectionName}
          </Text>
          <Text variant="body" color="secondary" style={{ marginTop: 4 }}>
            {closest.discoveredCount} / {closest.totalCount}
            {closest.totalCount - closest.discoveredCount === 1 ? ' · one space left' : ` · ${closest.totalCount - closest.discoveredCount} left`}
          </Text>
        </View>
      ) : null}
      <View style={{ marginTop: theme.space[32] }}>
        {collections.map((collection) => {
          const progress = collectionProgress.find((item) => item.collectionId === collection.id);
          return (
            <CollectionCard
              key={collection.id}
              name={collection.name}
              description={collection.description}
              discovered={progress?.discoveredCount ?? 0}
              total={progress?.totalCount ?? 0}
              onPress={() => {
                analytics.track('collection_viewed');
                router.push(`/collection/${collection.id}`);
              }}
            />
          );
        })}
      </View>
      <Text variant="kicker" color="secondary" style={{ marginTop: theme.space[40] }}>
        Found
      </Text>
      <View style={{ marginTop: theme.space[16], gap: theme.space[24] }}>
        {userTaxa.map((owned) => {
          const taxon = taxa.find((item) => item.id === owned.taxonId);
          if (!taxon) return null;
          return (
            <SpeciesTile
              key={taxon.id}
              taxonId={taxon.id}
              commonName={taxon.commonName}
              scientificName={taxon.scientificName}
              category={taxon.category}
              observationCount={owned.observationCount}
              onPress={() => router.push(`/taxon/${taxon.id}`)}
            />
          );
        })}
      </View>
      <Text variant="kicker" color="secondary" style={{ marginTop: theme.space[40] }}>
        Still missing
      </Text>
      <View style={{ marginTop: theme.space[16], gap: theme.space[24] }}>
        {mysteryFromClosest.map((taxon) => {
          const mystery = mysteryForTaxon(taxon, user.experienceMode === 'explorer');
          return (
            <MysterySpeciesTile
              key={taxon.id}
              taxonId={taxon.id}
              category={taxon.category}
              clue={mystery.clue}
              onPress={() => router.push(`/collection/${closest?.collectionId ?? 'col-north-texas'}`)}
            />
          );
        })}
      </View>
    </Screen>
  );
}
