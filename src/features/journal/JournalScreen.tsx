import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { EmptyState } from '@/src/design-system/components/EmptyState';
import { ObservationCard } from '@/src/design-system/components/ObservationCard';
import { Screen } from '@/src/design-system/components/Screen';
import { Text } from '@/src/design-system/components/Text';
import { useTheme } from '@/src/design-system/theme';
import { useWildmark } from '@/src/app-state/WildmarkProvider';
import { formatJournalDate, monthGroup } from '@/src/lib/datetime';
import { analytics } from '@/src/services/analytics/service';
import { defaultJournalFilter, filterObservations, privacySafePlaces, type JournalFilter } from '@/src/domain/journal/filter';
import { privacySafeLocality } from '@/src/domain/location/privacy';
import { ORGANISM_CATEGORIES } from '@/src/domain/taxa/types';
import { categoryLabel } from '@/src/data/seed';

export function JournalScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { observations, taxonById, user, taxa } = useWildmark();
  const [filter, setFilter] = useState<JournalFilter>(defaultJournalFilter());
  const taxaById = useMemo(() => new Map(taxa.map((taxon) => [taxon.id, taxon])), [taxa]);

  const grouped = useMemo(() => {
    const filtered = filterObservations(observations, taxaById, filter);
    const map = new Map<string, typeof filtered>();
    for (const observation of filtered) {
      const key = monthGroup(observation.observedAt);
      map.set(key, [...(map.get(key) ?? []), observation]);
    }
    return [...map.entries()];
  }, [filter, observations, taxaById]);

  const places = privacySafePlaces(observations)
    .map((label) => privacySafeLocality(label, user.locationMode))
    .filter((value): value is string => Boolean(value));

  const chip = (label: string, active: boolean, onPress: () => void) => (
    <Pressable
      key={label}
      onPress={onPress}
      accessibilityRole="button"
      style={{
        marginRight: theme.space[12],
        marginBottom: theme.space[8],
        borderBottomWidth: 1,
        borderBottomColor: active ? theme.color.discovery.mark : theme.color.border.subtle,
        paddingBottom: 4,
      }}>
      <Text variant="kicker" color={active ? 'mark' : 'tertiary'}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <Screen>
      <Text variant="kicker" color="secondary">
        Field Journal
      </Text>
      <Text variant="display" style={{ marginTop: theme.space[8] }}>
        Encounters
      </Text>
      <TextInput
        value={filter.query}
        onChangeText={(query) => setFilter((current) => ({ ...current, query }))}
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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: theme.space[16] }}>
        {chip('All', filter.status === 'all' && filter.category === 'all', () => setFilter(defaultJournalFilter()))}
        {chip('Identified', filter.status === 'identified', () => setFilter((current) => ({ ...current, status: 'identified' })))}
        {chip('Unidentified', filter.status === 'unidentified', () => setFilter((current) => ({ ...current, status: 'unidentified' })))}
        {chip('Favorites', filter.status === 'favorite', () => setFilter((current) => ({ ...current, status: 'favorite' })))}
        {ORGANISM_CATEGORIES.slice(0, 5).map((category) =>
          chip(categoryLabel(category), filter.category === category, () =>
            setFilter((current) => ({ ...current, category: current.category === category ? 'all' : category })),
          ),
        )}
      </View>
      {places.length > 0 && user.locationMode !== 'none' ? (
        <View style={{ marginTop: theme.space[24] }}>
          <Text variant="kicker" color="secondary">
            Places
          </Text>
          <Text variant="bodySmall" color="tertiary" style={{ marginTop: 6 }}>
            Generalized areas only. Exact coordinates stay off the map.
          </Text>
          {places.map((place) => (
            <Text key={place} variant="body" style={{ marginTop: theme.space[8] }}>
              {place}
            </Text>
          ))}
        </View>
      ) : null}
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
                    placeLabel={privacySafeLocality(observation.localityLabel, user.locationMode)}
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
