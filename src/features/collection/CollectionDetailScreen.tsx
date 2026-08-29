import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '@/src/design-system/components/Screen';
import { SpeciesTile } from '@/src/design-system/components/SpeciesTile';
import { MysterySpeciesTile } from '@/src/design-system/components/MysterySpeciesTile';
import { Text } from '@/src/design-system/components/Text';
import { useTheme } from '@/src/design-system/theme';
import { mysteryForTaxon, useWildmark } from '@/src/app-state/WildmarkProvider';
import { SEED_COLLECTION_TAXA } from '@/src/data/seed';

export function CollectionDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { collections, taxa, userTaxa, user } = useWildmark();
  const collection = collections.find((item) => item.id === id);
  const taxonIds = SEED_COLLECTION_TAXA.filter((item) => item.collectionId === id).map((item) => item.taxonId);

  if (!collection) {
    return (
      <Screen>
        <Text variant="title">Collection not found</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text variant="kicker" color="secondary">
        Collection
      </Text>
      <Text variant="display" style={{ marginTop: theme.space[8] }}>
        {collection.name}
      </Text>
      <Text variant="body" color="secondary" style={{ marginTop: theme.space[12] }}>
        {collection.description}
      </Text>
      <View style={{ marginTop: theme.space[32], gap: theme.space[24] }}>
        {taxonIds.map((taxonId) => {
          const taxon = taxa.find((item) => item.id === taxonId);
          if (!taxon) return null;
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
              onPress={() => router.push('/(tabs)/explore')}
            />
          );
        })}
      </View>
    </Screen>
  );
}
