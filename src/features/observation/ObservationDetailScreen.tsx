import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/src/design-system/components/Button';
import { Screen } from '@/src/design-system/components/Screen';
import { Text } from '@/src/design-system/components/Text';
import { TaxonPortrait } from '@/src/design-system/components/TaxonPortrait';
import { useTheme } from '@/src/design-system/theme';
import { useWildmark } from '@/src/app-state/WildmarkProvider';
import { formatJournalDate } from '@/src/lib/datetime';
import { SEED_TAXA } from '@/src/data/seed';

export function ObservationDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { observationById, taxonById, correctObservation } = useWildmark();
  const observation = id ? observationById(id) : undefined;
  const taxon = observation?.taxonId ? taxonById(observation.taxonId) : undefined;
  const [notes, setNotes] = useState(observation?.notes ?? '');
  const [correcting, setCorrecting] = useState(false);

  if (!observation) {
    return (
      <Screen>
        <Text variant="title">Encounter not found</Text>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      {taxon ? (
        <TaxonPortrait taxonId={taxon.id} category={taxon.category} height={300} />
      ) : (
        <View style={{ height: 220, backgroundColor: theme.color.background.secondary }} />
      )}
      <View style={{ paddingHorizontal: theme.space[24], paddingTop: theme.space[24] }}>
        <Text variant="kicker" color="secondary">
          {formatJournalDate(observation.observedAt)}
        </Text>
        <Text variant="display" style={{ marginTop: theme.space[8] }}>
          {taxon?.commonName ?? 'Unidentified'}
        </Text>
        <Text variant="scientific" color="secondary" style={{ marginTop: theme.space[8] }}>
          {taxon?.scientificName ?? observation.identificationStatus}
        </Text>
        {observation.confidence != null ? (
          <Text variant="bodySmall" color="tertiary" style={{ marginTop: theme.space[12] }}>
            Confidence noted, not announced as certainty.
          </Text>
        ) : null}
        <Text variant="kicker" color="secondary" style={{ marginTop: theme.space[32] }}>
          Notes
        </Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="What did you notice?"
          placeholderTextColor={theme.color.text.tertiary}
          style={{
            marginTop: theme.space[12],
            minHeight: 96,
            color: theme.color.text.primary,
            fontSize: 16,
            lineHeight: 24,
          }}
        />
        <View style={{ marginTop: theme.space[24], gap: theme.space[12] }}>
          {taxon ? <Button variant="secondary" label="Open species" onPress={() => router.push(`/taxon/${taxon.id}`)} /> : null}
          <Button variant="ghost" label="Correct identification" onPress={() => setCorrecting((value) => !value)} />
        </View>
        {correcting ? (
          <View style={{ marginTop: theme.space[16], gap: theme.space[8] }}>
            {SEED_TAXA.slice(0, 8).map((item) => (
              <Button
                key={item.id}
                variant="secondary"
                label={item.commonName}
                onPress={() => {
                  void correctObservation(observation.id, item.id).then(() => setCorrecting(false));
                }}
              />
            ))}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
