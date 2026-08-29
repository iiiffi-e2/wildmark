import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/src/design-system/components/Button';
import { Screen } from '@/src/design-system/components/Screen';
import { Text } from '@/src/design-system/components/Text';
import { useTheme } from '@/src/design-system/theme';
import { useWildmark } from '@/src/app-state/WildmarkProvider';
import { identificationSafetyDisclaimer } from '@/src/domain/safety/copy';

export function IdentifyResultScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    kind?: string;
    observationId?: string;
    reason?: string;
    label?: string;
  }>();
  const { lastOutcome, acceptCandidate, saveUnconfirmed, taxonById } = useWildmark();

  if (lastOutcome?.status === 'ambiguous') {
    return (
      <Screen>
        <Text variant="kicker" color="secondary">
          Uncertain
        </Text>
        <Text variant="display" style={{ marginTop: theme.space[12] }}>
          {lastOutcome.result.summaryLabel}
        </Text>
        <Text variant="body" color="secondary" style={{ marginTop: theme.space[16] }}>
          Wildmark will not force a species when the photograph still holds two possibilities.
        </Text>
        <View style={{ marginTop: theme.space[32], gap: theme.space[20] }}>
          {lastOutcome.result.candidates.map((candidate) => {
            const taxon = taxonById(candidate.taxonId);
            return (
              <View key={candidate.taxonId} style={{ gap: theme.space[8] }}>
                <Text variant="title">{candidate.commonName}</Text>
                <Text variant="scientific" color="secondary">
                  {taxon?.scientificName ?? candidate.scientificName}
                </Text>
                <Button
                  variant="secondary"
                  label="Choose this one"
                  onPress={() => {
                    void acceptCandidate(lastOutcome.image, candidate.taxonId, candidate.confidence).then((discovery) => {
                      router.replace({
                        pathname: '/wildmark',
                        params: {
                          observationId: discovery.observationId,
                          mode: discovery.isNewWildmark ? 'new' : 'repeat',
                          count: String(discovery.observationCountForTaxon),
                        },
                      });
                    });
                  }}
                />
              </View>
            );
          })}
        </View>
        <View style={{ marginTop: theme.space[32], gap: theme.space[12] }}>
          <Button label="Try again" onPress={() => router.replace('/(tabs)/scan')} />
          <Button
            variant="ghost"
            label="Save unconfirmed"
            onPress={() => {
              void saveUnconfirmed(lastOutcome.image, lastOutcome.result).then((observationId) => {
                router.replace(`/observation/${observationId}`);
              });
            }}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text variant="kicker" color="secondary">
        {params.kind === 'unsupported' ? 'Not this time' : 'Still unidentified'}
      </Text>
      <Text variant="display" style={{ marginTop: theme.space[12] }}>
        {params.label ?? 'The photograph remains'}
      </Text>
      <Text variant="body" color="secondary" style={{ marginTop: theme.space[16] }}>
        {params.reason ?? 'Try another angle. The encounter is saved in your journal.'}
      </Text>
      <Text variant="bodySmall" color="tertiary" style={{ marginTop: theme.space[16] }}>
        {identificationSafetyDisclaimer()}
      </Text>
      <View style={{ marginTop: theme.space[32], gap: theme.space[12] }}>
        <Button label="Try again" onPress={() => router.replace('/(tabs)/scan')} />
        {params.observationId ? (
          <Button
            variant="secondary"
            label="Open the encounter"
            onPress={() => router.replace(`/observation/${params.observationId}`)}
          />
        ) : null}
      </View>
    </Screen>
  );
}
