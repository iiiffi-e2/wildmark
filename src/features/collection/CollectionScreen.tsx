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

export function CollectionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { collections, collectionProgress, taxa, userTaxa, user } = useWildmark();
  const discoveredIds = new Set(userTaxa.map((item) => item.taxonId));

  return (
    <Screen>
      <Text variant="kicker" color="secondary">
        Collection
      </Text>
      <Text variant="display" style={{ marginTop: theme.space[8] }}>
        Field cabinet
      </Text>
      <View style={{ marginTop: theme.space[16] }}>
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
        Species
      </Text>
      <View style={{ marginTop: theme.space[16], gap: theme.space[24] }}>
        {taxa.map((taxon) => {
          const owned = userTaxa.find((item) => item.taxonId === taxon.id);
          if (owned) {
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
          }
          const mystery = mysteryForTaxon(taxon, user.experienceMode === 'explorer');
          return (
            <MysterySpeciesTile
              key={taxon.id}
              taxonId={taxon.id}
              category={taxon.category}
              clue={mystery.clue}
              onPress={() => router.push(`/collection/col-north-texas`)}
            />
          );
        })}
        {discoveredIds.size === 0 ? null : null}
      </View>
    </Screen>
  );
}
