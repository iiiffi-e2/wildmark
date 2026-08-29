import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { Button } from '@/src/design-system/components/Button';
import { Screen } from '@/src/design-system/components/Screen';
import { Text } from '@/src/design-system/components/Text';
import { TaxonPortrait } from '@/src/design-system/components/TaxonPortrait';
import { useTheme } from '@/src/design-system/theme';
import { useWildmark } from '@/src/app-state/WildmarkProvider';
import { visibleExplorerClues } from '@/src/domain/explorer/clues';

export function ExplorerModeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { explorerSession, taxonById, userTaxa, advanceExplorerClue } = useWildmark();
  const session = sessionId ? explorerSession(sessionId) : undefined;
  const taxon = session ? taxonById(session.taxonId) : undefined;
  const found = taxon ? userTaxa.some((item) => item.taxonId === taxon.id) : false;

  if (!taxon || !session) {
    return (
      <Screen>
        <Text variant="title">That trail has gone cold.</Text>
      </Screen>
    );
  }

  const clues = visibleExplorerClues(taxon, session.clueIndex);

  return (
    <Screen padded={false}>
      <TaxonPortrait taxonId={taxon.id} category={taxon.category} discovered={found} height={320} />
      <View style={{ paddingHorizontal: theme.space[24], paddingTop: theme.space[24] }}>
        <Text variant="kicker" color="secondary">
          Explorer Mode
        </Text>
        {found ? (
          <>
            <Text variant="kicker" color="mark" style={{ marginTop: theme.space[12] }}>
              Found
            </Text>
            <Text variant="display" style={{ marginTop: theme.space[8] }}>
              {taxon.commonName}
            </Text>
            <Text variant="scientific" color="secondary" style={{ marginTop: theme.space[8] }}>
              {taxon.scientificName}
            </Text>
          </>
        ) : (
          <>
            <Text variant="display" style={{ marginTop: theme.space[12] }}>
              Something is nearby
            </Text>
            <View style={{ marginTop: theme.space[24], gap: theme.space[16] }}>
              {clues.map((clue) => (
                <View key={clue.index}>
                  <Text variant="kicker" color="tertiary">
                    {clue.title}
                  </Text>
                  <Text variant="body" color="secondary" style={{ marginTop: 6 }}>
                    {clue.body}
                  </Text>
                </View>
              ))}
            </View>
            <Text variant="bodySmall" color="tertiary" style={{ marginTop: theme.space[16] }}>
              Stay on paths. Do not approach wildlife or disturb nests.
            </Text>
          </>
        )}
        <View style={{ marginTop: theme.space[32], gap: theme.space[12] }}>
          {found ? (
            <Button label="Open species" onPress={() => router.push(`/taxon/${taxon.id}`)} />
          ) : (
            <>
              <Button label="Start looking" onPress={() => router.push('/(tabs)/scan')} />
              {session.clueIndex < 3 ? (
                <Button variant="secondary" label="Another clue" onPress={() => advanceExplorerClue(session.sessionId)} />
              ) : null}
            </>
          )}
        </View>
      </View>
    </Screen>
  );
}
