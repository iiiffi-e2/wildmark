import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { Button } from '@/src/design-system/components/Button';
import { Screen } from '@/src/design-system/components/Screen';
import { Text } from '@/src/design-system/components/Text';
import { TaxonPortrait } from '@/src/design-system/components/TaxonPortrait';
import { useTheme } from '@/src/design-system/theme';
import { useWildmark } from '@/src/app-state/WildmarkProvider';
import { revealMystery } from '@/src/domain/taxa/mystery';

export function ExplorerModeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { explorerSession, taxonById } = useWildmark();
  const session = sessionId ? explorerSession(sessionId) : undefined;
  const taxon = session ? taxonById(session.taxonId) : undefined;

  if (!taxon) {
    return (
      <Screen>
        <Text variant="title">That trail has gone cold.</Text>
      </Screen>
    );
  }

  const mystery = revealMystery(taxon, 'detailedClue');

  return (
    <Screen padded={false}>
      <TaxonPortrait taxonId={taxon.id} category={taxon.category} discovered={false} height={320} />
      <View style={{ paddingHorizontal: theme.space[24], paddingTop: theme.space[24] }}>
        <Text variant="kicker" color="secondary">
          Explorer Mode
        </Text>
        <Text variant="display" style={{ marginTop: theme.space[12] }}>
          {mystery.title}
        </Text>
        <Text variant="body" color="secondary" style={{ marginTop: theme.space[16] }}>
          {mystery.clue}
        </Text>
        <Text variant="bodySmall" color="tertiary" style={{ marginTop: theme.space[16] }}>
          Start looking. If you find it, the identity opens.
        </Text>
        <View style={{ marginTop: theme.space[32] }}>
          <Button label="Start looking" onPress={() => router.push('/(tabs)/scan')} />
        </View>
      </View>
    </Screen>
  );
}
