import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { Button } from '@/src/design-system/components/Button';
import { Screen } from '@/src/design-system/components/Screen';
import { Text } from '@/src/design-system/components/Text';
import { TaxonPortrait } from '@/src/design-system/components/TaxonPortrait';
import { useTheme } from '@/src/design-system/theme';
import { useWildmark } from '@/src/app-state/WildmarkProvider';
import { identificationSafetyDisclaimer, safetyNotice } from '@/src/domain/safety/copy';
import { analytics } from '@/src/services/analytics/service';

export function TaxonDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { taxonById, userTaxa, observations, safetyFor } = useWildmark();
  const taxon = id ? taxonById(id) : undefined;
  const owned = taxon ? userTaxa.find((item) => item.taxonId === taxon.id) : undefined;
  const sightings = observations.filter((item) => item.taxonId === taxon?.id);

  useEffect(() => {
    if (taxon) {
      analytics.track('species_viewed');
    }
  }, [taxon]);

  if (!taxon) {
    return (
      <Screen>
        <Text variant="title">Species not found</Text>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <TaxonPortrait taxonId={taxon.id} category={taxon.category} discovered={Boolean(owned)} height={320} />
      <View style={{ paddingHorizontal: theme.space[24], paddingTop: theme.space[24] }}>
        <Text variant="kicker" color="secondary">
          {taxon.category}
        </Text>
        <Text variant="display" style={{ marginTop: theme.space[8] }}>
          {owned ? taxon.commonName : 'Undiscovered'}
        </Text>
        {owned ? (
          <Text variant="scientific" color="secondary" style={{ marginTop: theme.space[8] }}>
            {taxon.scientificName}
          </Text>
        ) : null}
        <Text variant="body" style={{ marginTop: theme.space[24] }}>
          {owned
            ? `${owned.observationCount} ${owned.observationCount === 1 ? 'observation' : 'observations'}`
            : 'This species exists near you. It has not entered your collection yet.'}
        </Text>
        {safetyFor(taxon.id).map((flag) => (
          <Text key={flag} variant="bodySmall" color="secondary" style={{ marginTop: theme.space[12] }}>
            {safetyNotice(flag as 'poisonous')}
          </Text>
        ))}
        <Text variant="bodySmall" color="tertiary" style={{ marginTop: theme.space[16] }}>
          {identificationSafetyDisclaimer()}
        </Text>
        <View style={{ marginTop: theme.space[32], gap: theme.space[16] }}>
          {sightings.map((observation) => (
            <Button
              key={observation.id}
              variant="secondary"
              label={new Date(observation.observedAt).toLocaleString()}
              onPress={() => router.push(`/observation/${observation.id}`)}
            />
          ))}
          <Button label="Look for it" onPress={() => router.push('/(tabs)/scan')} />
        </View>
      </View>
    </Screen>
  );
}
