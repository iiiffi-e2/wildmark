import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { Button } from '@/src/design-system/components/Button';
import { Screen } from '@/src/design-system/components/Screen';
import { SpeciesTile } from '@/src/design-system/components/SpeciesTile';
import { MysterySpeciesTile } from '@/src/design-system/components/MysterySpeciesTile';
import { Text } from '@/src/design-system/components/Text';
import { useTheme } from '@/src/design-system/theme';
import { mysteryForTaxon, useWildmark } from '@/src/app-state/WildmarkProvider';

export function CollectionDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { collections, taxa, userTaxa, user, collectionProgress, collectionTaxonIds } = useWildmark();
  const collection = collections.find((item) => item.id === id);
  const taxonIds = id ? collectionTaxonIds(id) : [];
  const progress = collectionProgress.find((item) => item.collectionId === id);
  const remaining = (progress?.totalCount ?? 0) - (progress?.discoveredCount ?? 0);

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
      <Text variant="title" style={{ marginTop: theme.space[24] }}>
        {progress?.discoveredCount ?? 0} / {progress?.totalCount ?? taxonIds.length}
      </Text>
      {remaining === 0 ? (
        <Text variant="kicker" color="mark" style={{ marginTop: theme.space[12] }}>
          Collection complete
        </Text>
      ) : remaining === 1 ? (
        <Text variant="body" color="secondary" style={{ marginTop: theme.space[12] }}>
          One space left.
        </Text>
      ) : (
        <Text variant="body" color="secondary" style={{ marginTop: theme.space[12] }}>
          {remaining} spaces still empty.
        </Text>
      )}
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
      <View style={{ marginTop: theme.space[32] }}>
        <Button label="Go looking" onPress={() => router.push('/(tabs)/scan')} />
      </View>
    </Screen>
  );
}
