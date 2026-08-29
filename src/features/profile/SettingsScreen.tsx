import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/src/design-system/components/Button';
import { Screen } from '@/src/design-system/components/Screen';
import { Text } from '@/src/design-system/components/Text';
import { useTheme } from '@/src/design-system/theme';
import { useWildmark } from '@/src/app-state/WildmarkProvider';
import { isDevToolsEnabled } from '@/src/config/flags';
import { identificationSafetyDisclaimer } from '@/src/domain/safety/copy';
import { categoryLabel } from '@/src/data/seed';
import type { OrganismCategory } from '@/src/domain/taxa/types';

export function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const {
    user,
    updateUser,
    persistenceKind,
    offline,
    userTaxa,
    observations,
    collectionProgress,
    unlockedMilestones,
    categoryCounts,
    explorerRank,
    taxonById,
    nearby,
  } = useWildmark();

  const mostSeen = [...userTaxa].sort((a, b) => b.observationCount - a.observationCount)[0];
  const longestHeld = [...userTaxa].sort((a, b) => a.firstSeenAt.localeCompare(b.firstSeenAt))[0];
  const favorite = user.favoriteTaxonId ? taxonById(user.favoriteTaxonId) : null;
  const rarest = nearby.find((item) => item.occurrenceClass === 'rare' && userTaxa.some((owned) => owned.taxonId === item.taxonId));
  const completed = collectionProgress.filter((item) => item.totalCount > 0 && item.discoveredCount === item.totalCount);

  return (
    <Screen>
      <Text variant="kicker" color="secondary">
        Your Wildmarks
      </Text>
      <Text variant="display" style={{ marginTop: theme.space[8] }}>
        {userTaxa.length} species
      </Text>
      <Text variant="body" color="secondary" style={{ marginTop: theme.space[8] }}>
        {observations.length} encounters · {explorerRank.name}
      </Text>
      <View style={{ marginTop: theme.space[24], gap: theme.space[8] }}>
        {categoryCounts.map((item) => (
          <Text key={item.category} variant="body">
            {categoryLabel(item.category as OrganismCategory)} · {item.count}
          </Text>
        ))}
      </View>
      <View style={{ marginTop: theme.space[32], gap: theme.space[16] }}>
        {favorite ? (
          <View>
            <Text variant="kicker" color="secondary">
              Favorite find
            </Text>
            <Text variant="title">{favorite.commonName}</Text>
          </View>
        ) : null}
        {rarest ? (
          <View>
            <Text variant="kicker" color="secondary">
              Rarest find
            </Text>
            <Text variant="title">{taxonById(rarest.taxonId)?.commonName ?? 'Rare find'}</Text>
          </View>
        ) : null}
        {mostSeen ? (
          <View>
            <Text variant="kicker" color="secondary">
              Most observed
            </Text>
            <Text variant="title">{taxonById(mostSeen.taxonId)?.commonName ?? '—'}</Text>
          </View>
        ) : null}
        {longestHeld ? (
          <View>
            <Text variant="kicker" color="secondary">
              Longest-held Wildmark
            </Text>
            <Text variant="title">{taxonById(longestHeld.taxonId)?.commonName ?? '—'}</Text>
          </View>
        ) : null}
      </View>
      {completed.length > 0 ? (
        <View style={{ marginTop: theme.space[32] }}>
          <Text variant="kicker" color="mark">
            Completed collections
          </Text>
          {completed.map((item) => (
            <Text key={item.collectionId} variant="body" style={{ marginTop: theme.space[8] }}>
              {item.collectionName} · {item.discoveredCount} / {item.totalCount}
            </Text>
          ))}
        </View>
      ) : null}
      {unlockedMilestones.length > 0 ? (
        <View style={{ marginTop: theme.space[32] }}>
          <Text variant="kicker" color="secondary">
            Milestones
          </Text>
          {unlockedMilestones.map((item) => (
            <Text key={item.id} variant="body" style={{ marginTop: theme.space[8] }}>
              {item.name}
            </Text>
          ))}
        </View>
      ) : null}
      <View style={{ marginTop: theme.space[32] }}>
        <Button label="Your month in the wild" onPress={() => router.push('/recap')} />
      </View>
      <Text variant="title" style={{ marginTop: theme.space[40] }}>
        Field instrument
      </Text>
      <Text variant="body" color="secondary" style={{ marginTop: theme.space[12] }}>
        Exploration works before an account. Local notes stay on this device until you choose to keep them safe.
      </Text>
      <View style={{ marginTop: theme.space[24], gap: theme.space[16] }}>
        <Button
          variant="secondary"
          label={user.experienceMode === 'explorer' ? 'Experience: Explorer' : 'Experience: Standard'}
          onPress={() =>
            void updateUser({
              experienceMode: user.experienceMode === 'explorer' ? 'standard' : 'explorer',
            })
          }
        />
        <Button
          variant="secondary"
          label={`Location: ${user.locationMode}`}
          onPress={() => {
            const next = user.locationMode === 'none' ? 'approximate' : user.locationMode === 'approximate' ? 'precise' : 'none';
            void updateUser({ locationMode: next });
          }}
        />
        <Button
          variant="secondary"
          label={`Appearance: ${user.appearance}`}
          onPress={() => {
            const next = user.appearance === 'system' ? 'light' : user.appearance === 'light' ? 'dark' : 'system';
            void updateUser({ appearance: next });
          }}
        />
        <Button
          variant="secondary"
          label={user.soundEnabled ? 'Discovery sound: on' : 'Discovery sound: off'}
          onPress={() => void updateUser({ soundEnabled: !user.soundEnabled })}
        />
      </View>
      <Text variant="title" style={{ marginTop: theme.space[40] }}>
        Keep your Wildmarks safe
      </Text>
      <Text variant="body" color="secondary" style={{ marginTop: theme.space[12] }}>
        Create an account later to back up your collection. Anonymous local data will merge into that account. Nothing leaves this device yet.
      </Text>
      <Text variant="bodySmall" color="tertiary" style={{ marginTop: theme.space[24] }}>
        {identificationSafetyDisclaimer()}
      </Text>
      <Text variant="bodySmall" color="tertiary" style={{ marginTop: theme.space[8] }}>
        Journal storage: {persistenceKind}
        {offline ? ' · offline' : ''}
      </Text>
      {isDevToolsEnabled ? (
        <View style={{ marginTop: theme.space[32] }}>
          <Button variant="ghost" label="Development panel" onPress={() => router.push('/debug')} />
        </View>
      ) : null}
    </Screen>
  );
}
