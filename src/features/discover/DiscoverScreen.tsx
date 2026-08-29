import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { DiscoveryHero } from '@/src/design-system/components/DiscoveryHero';
import { ScanButton } from '@/src/design-system/components/ScanButton';
import { Screen } from '@/src/design-system/components/Screen';
import { Text } from '@/src/design-system/components/Text';
import { TaxonPortrait } from '@/src/design-system/components/TaxonPortrait';
import { useTheme } from '@/src/design-system/theme';
import { mysteryForTaxon, useWildmark } from '@/src/app-state/WildmarkProvider';
import { greetingFor } from '@/src/lib/datetime';
import { isDevToolsEnabled } from '@/src/config/flags';

export function DiscoverScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { userTaxa, nearby, taxonById, user, startExplorerSession } = useWildmark();
  const undiscovered = nearby.filter((item) => !userTaxa.some((owned) => owned.taxonId === item.taxonId));
  const preview = undiscovered.slice(0, 3);

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: theme.space[24] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingTop: theme.space[16] }}>
          <Pressable onPress={() => router.push('/settings')} accessibilityRole="button" accessibilityLabel="Settings">
            <Text variant="kicker" color="secondary">
              Settings
            </Text>
          </Pressable>
        </View>
        <Pressable
          onLongPress={() => {
            if (isDevToolsEnabled) router.push('/debug');
          }}
          accessibilityRole="text">
          <DiscoveryHero
            greeting={greetingFor()}
            discoveredCount={userTaxa.length}
            nearbyCount={undiscovered.length}
          />
        </Pressable>
      </View>
      <View style={{ paddingHorizontal: theme.space[24], marginTop: theme.space[8] }}>
        <ScanButton onPress={() => router.push('/(tabs)/scan')} />
      </View>
      <View style={{ paddingHorizontal: theme.space[24], marginTop: theme.space[40] }}>
        <Text variant="kicker" color="secondary">
          Around you
        </Text>
        <Text variant="title" style={{ marginTop: theme.space[8], marginBottom: theme.space[20] }}>
          Still waiting to be found
        </Text>
      </View>
      {preview.map((item) => {
        const taxon = taxonById(item.taxonId);
        if (!taxon) return null;
        const mystery = mysteryForTaxon(taxon, user.experienceMode === 'explorer');
        return (
          <Pressable
            key={item.taxonId}
            onPress={() => {
              const sessionId = startExplorerSession(taxon.id);
              router.push(`/explore-mode/${sessionId}`);
            }}
            accessibilityLabel={mystery.accessibilityLabel}
            style={{ marginBottom: theme.space[24] }}>
            <TaxonPortrait taxonId={taxon.id} category={taxon.category} discovered={false} height={220} />
            <View style={{ paddingHorizontal: theme.space[24], paddingTop: theme.space[12] }}>
              <Text variant="kicker" color="tertiary">
                Likely nearby
              </Text>
              <Text variant="title" style={{ marginTop: 4 }}>
                {mystery.title}
              </Text>
              {mystery.clue ? (
                <Text variant="bodySmall" color="secondary" style={{ marginTop: 6 }}>
                  {mystery.clue}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </Screen>
  );
}
