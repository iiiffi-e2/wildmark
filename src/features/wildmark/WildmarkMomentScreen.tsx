import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/src/design-system/components/Button';
import { Screen } from '@/src/design-system/components/Screen';
import { Text } from '@/src/design-system/components/Text';
import { TaxonPortrait } from '@/src/design-system/components/TaxonPortrait';
import { WildmarkSymbol } from '@/src/design-system/icons/WildmarkSymbol';
import { useTheme } from '@/src/design-system/theme';
import { useWildmark } from '@/src/app-state/WildmarkProvider';
import { formatMarkDate, sightingCopy } from '@/src/lib/datetime';

export function WildmarkMomentScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { observationId, mode, count } = useLocalSearchParams<{
    observationId?: string;
    mode?: string;
    count?: string;
  }>();
  const { observationById, taxonById, userTaxa } = useWildmark();
  const observation = observationId ? observationById(observationId) : undefined;
  const taxon = observation?.taxonId ? taxonById(observation.taxonId) : undefined;
  const speciesNumber = taxon
    ? userTaxa.findIndex((item) => item.taxonId === taxon.id) + 1
    : userTaxa.length;
  const isNew = mode === 'new';

  if (!taxon || !observation) {
    return (
      <Screen>
        <Text variant="title">The mark is still settling.</Text>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <TaxonPortrait taxonId={taxon.id} category={taxon.category} height={360} />
      <View style={{ paddingHorizontal: theme.space[24], paddingTop: theme.space[24] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[12] }}>
          <WildmarkSymbol size={28} color={theme.color.text.primary} completeness={1} />
          <Text variant="kicker" color="mark">
            {isNew ? 'New Wildmark' : 'Another sighting'}
          </Text>
        </View>
        <Text variant="display" style={{ marginTop: theme.space[16] }}>
          {taxon.commonName}
        </Text>
        <Text variant="scientific" color="secondary" style={{ marginTop: theme.space[8] }}>
          {taxon.scientificName}
        </Text>
        <Text variant="body" style={{ marginTop: theme.space[24] }}>
          {isNew
            ? `Species ${String(speciesNumber).padStart(3, '0')}`
            : sightingCopy(Number(count ?? 2))}
        </Text>
        <Text variant="bodySmall" color="secondary" style={{ marginTop: theme.space[8] }}>
          Marked {formatMarkDate(observation.observedAt)}
        </Text>
        {observation.localityLabel ? (
          <Text variant="bodySmall" color="tertiary">
            {observation.localityLabel}
          </Text>
        ) : (
          <Text variant="bodySmall" color="tertiary">
            Field notes
          </Text>
        )}
        <View style={{ marginTop: theme.space[32], gap: theme.space[12] }}>
          <Button label="Open species" onPress={() => router.replace(`/taxon/${taxon.id}`)} />
          <Button variant="secondary" label="Back to Discover" onPress={() => router.replace('/(tabs)')} />
        </View>
      </View>
    </Screen>
  );
}
