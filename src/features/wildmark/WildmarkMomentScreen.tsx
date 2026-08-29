import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/src/design-system/components/Button';
import { Screen } from '@/src/design-system/components/Screen';
import { Text } from '@/src/design-system/components/Text';
import { TaxonPortrait } from '@/src/design-system/components/TaxonPortrait';
import { ProgressDelta } from '@/src/design-system/components/ProgressDelta';
import { WildmarkSymbol } from '@/src/design-system/icons/WildmarkSymbol';
import { useTheme } from '@/src/design-system/theme';
import { useWildmark } from '@/src/app-state/WildmarkProvider';
import { formatMarkDate, sightingCopy } from '@/src/lib/datetime';
import { categoryLabel } from '@/src/data/seed';
import type { OrganismCategory } from '@/src/domain/taxa/types';

export function WildmarkMomentScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { observationId, mode, count } = useLocalSearchParams<{
    observationId?: string;
    mode?: string;
    count?: string;
  }>();
  const { observationById, taxonById, userTaxa, lastDiscovery } = useWildmark();
  const observation = observationId ? observationById(observationId) : undefined;
  const taxon = observation?.taxonId ? taxonById(observation.taxonId) : undefined;
  const speciesNumber = taxon
    ? userTaxa.findIndex((item) => item.taxonId === taxon.id) + 1
    : userTaxa.length;
  const isNew = mode === 'new' || lastDiscovery?.isNewWildmark;
  const discovery = lastDiscovery && lastDiscovery.observationId === observation?.id ? lastDiscovery : lastDiscovery;
  const changedCollections = (discovery?.collectionDeltas ?? []).filter(
    (item) => item.previousCount !== item.discoveredCount || item.newlyCompleted,
  );
  const changedCategories = (discovery?.categoryDeltas ?? []).filter((item) => item.previous !== item.current);
  const changedQuests = (discovery?.questDeltas ?? []).filter((item) => item.newlyCompleted || item.current > 0);
  const next = discovery?.nearCompletions[0];

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
            ? `${categoryLabel(taxon.category as OrganismCategory)} · Species ${String(Math.max(speciesNumber, 1)).padStart(3, '0')}`
            : sightingCopy(Number(count ?? discovery?.observationCountForTaxon ?? 2))}
        </Text>
        {discovery?.rarityLabel ? (
          <Text variant="kicker" color="mark" style={{ marginTop: theme.space[12] }}>
            {discovery.rarityLabel}
          </Text>
        ) : null}
        {discovery?.personalRecords.map((record) => (
          <Text key={record.kind + record.label} variant="bodySmall" color="secondary" style={{ marginTop: theme.space[8] }}>
            {record.label}
          </Text>
        ))}
        {discovery?.repeat?.isFirstThisYear ? (
          <Text variant="bodySmall" color="secondary" style={{ marginTop: theme.space[8] }}>
            First sighting this year
          </Text>
        ) : null}
        {discovery?.repeat?.newLocality ? (
          <Text variant="bodySmall" color="secondary" style={{ marginTop: theme.space[8] }}>
            New place in your journal
          </Text>
        ) : null}
        <Text variant="bodySmall" color="secondary" style={{ marginTop: theme.space[8] }}>
          First seen {formatMarkDate(observation.observedAt)}
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

        {changedCollections.length > 0 || changedCategories.length > 0 ? (
          <View style={{ marginTop: theme.space[32] }}>
            <Text variant="kicker" color="secondary">
              Your world
            </Text>
            {changedCategories.map((item) => (
              <ProgressDelta
                key={item.category}
                label={categoryLabel(item.category as OrganismCategory)}
                previous={item.previous}
                current={item.current}
              />
            ))}
            {changedCollections.map((item) => (
              <ProgressDelta
                key={item.collectionId}
                label={item.collectionName}
                previous={item.previousCount}
                current={item.discoveredCount}
                total={item.totalCount}
                complete={item.newlyCompleted}
              />
            ))}
            {changedQuests
              .filter((item) => item.newlyCompleted || item.current > 0)
              .slice(0, 2)
              .map((item) => (
                <ProgressDelta
                  key={item.questId}
                  label={item.questName}
                  previous={Math.max(0, item.current - 1)}
                  current={item.current}
                  total={item.target}
                  complete={item.newlyCompleted}
                />
              ))}
          </View>
        ) : null}

        {discovery?.milestones.map((milestone) => (
          <View key={milestone.id} style={{ marginTop: theme.space[16] }}>
            <Text variant="kicker" color="mark">
              Milestone
            </Text>
            <Text variant="title" style={{ marginTop: 4 }}>
              {milestone.name}
            </Text>
          </View>
        ))}

        {next ? (
          <Text variant="body" color="secondary" style={{ marginTop: theme.space[24] }}>
            {next.remaining === 1
              ? `One more to complete ${next.title}`
              : `${next.remaining} left in ${next.title}`}
          </Text>
        ) : null}

        <View style={{ marginTop: theme.space[32], gap: theme.space[12] }}>
          <Button label="View Wildmark" onPress={() => router.replace(`/taxon/${taxon.id}`)} />
          <Button variant="secondary" label="Keep exploring" onPress={() => router.replace('/(tabs)')} />
        </View>
      </View>
    </Screen>
  );
}
