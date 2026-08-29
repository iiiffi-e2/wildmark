import { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { EmptyState } from '@/src/design-system/components/EmptyState';
import { ObservationCard } from '@/src/design-system/components/ObservationCard';
import { Screen } from '@/src/design-system/components/Screen';
import { Text } from '@/src/design-system/components/Text';
import { useTheme } from '@/src/design-system/theme';
import { useWildmark } from '@/src/app-state/WildmarkProvider';
import { formatJournalDate, monthGroup } from '@/src/lib/datetime';
import { analytics } from '@/src/services/analytics/service';

export function JournalScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { observations, taxonById } = useWildmark();
  const [query, setQuery] = useState('');

  const grouped = useMemo(() => {
    const filtered = observations.filter((observation) => {
      if (!query.trim()) return true;
      const taxon = observation.taxonId ? taxonById(observation.taxonId) : undefined;
      const haystack = `${taxon?.commonName ?? ''} ${taxon?.scientificName ?? ''} ${observation.notes ?? ''} unidentified`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
    const map = new Map<string, typeof filtered>();
    for (const observation of filtered) {
      const key = monthGroup(observation.observedAt);
      map.set(key, [...(map.get(key) ?? []), observation]);
    }
    return [...map.entries()];
  }, [observations, query, taxonById]);

  return (
    <Screen>
      <Text variant="kicker" color="secondary">
        Field Journal
      </Text>
      <Text variant="display" style={{ marginTop: theme.space[8] }}>
        Encounters
      </Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search notes and names"
        placeholderTextColor={theme.color.text.tertiary}
        accessibilityLabel="Search journal"
        style={{
          marginTop: theme.space[20],
          paddingVertical: theme.space[12],
          borderBottomWidth: 1,
          borderBottomColor: theme.color.border.strong,
          color: theme.color.text.primary,
          fontSize: 16,
        }}
      />
      {grouped.length === 0 ? (
        <EmptyState
          title="The journal is still empty"
          body="The first photograph becomes the first page. Go outside and look."
        />
      ) : (
        grouped.map(([month, items]) => (
          <View key={month} style={{ marginTop: theme.space[32] }}>
            <Text variant="kicker" color="secondary">
              {month}
            </Text>
            <View style={{ marginTop: theme.space[16] }}>
              {items.map((observation) => {
                const taxon = observation.taxonId ? taxonById(observation.taxonId) : undefined;
                return (
                  <ObservationCard
                    key={observation.id}
                    title={taxon?.commonName ?? 'Unidentified'}
                    subtitle={taxon?.scientificName ?? observation.identificationStatus}
                    dateLabel={formatJournalDate(observation.observedAt)}
                    placeLabel={observation.localityLabel}
                    taxonId={taxon?.id}
                    category={taxon?.category}
                    onPress={() => {
                      analytics.track('journal_viewed');
                      router.push(`/observation/${observation.id}`);
                    }}
                  />
                );
              })}
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}
