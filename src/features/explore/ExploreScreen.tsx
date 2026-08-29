import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { QuestCard } from '@/src/design-system/components/QuestCard';
import { Screen } from '@/src/design-system/components/Screen';
import { Text } from '@/src/design-system/components/Text';
import { TaxonPortrait } from '@/src/design-system/components/TaxonPortrait';
import { useTheme } from '@/src/design-system/theme';
import { mysteryForTaxon, useWildmark } from '@/src/app-state/WildmarkProvider';
import { analytics } from '@/src/services/analytics/service';
import { evaluateQuestProgress } from '@/src/domain/quests/evaluate';

export function ExploreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const {
    nearby,
    userTaxa,
    taxonById,
    user,
    quests,
    taxa,
    observations,
    startExplorerSession,
    recommendations,
    collectionTaxonIds,
  } = useWildmark();
  const discovered = new Set(userTaxa.map((item) => item.taxonId));
  const waiting = nearby.filter((item) => !discovered.has(item.taxonId)).slice(0, 6);
  const next = recommendations[0];

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: theme.space[24] }}>
        <Text variant="kicker" color="secondary">
          Explore
        </Text>
        <Text variant="display" style={{ marginTop: theme.space[8] }}>
          Around you
        </Text>
        <Text variant="body" color="secondary" style={{ marginTop: theme.space[12] }}>
          These organisms are likely nearby. None of this is a promise — only a reason to look.
        </Text>
        {next ? (
          <View style={{ marginTop: theme.space[20] }}>
            <Text variant="kicker" color="mark">
              One more
            </Text>
            <Text variant="title" style={{ marginTop: 6 }}>
              {next.title}
            </Text>
            <Text variant="bodySmall" color="secondary" style={{ marginTop: 6 }}>
              {next.body}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={{ marginTop: theme.space[24] }}>
        {waiting.map((item) => {
          const taxon = taxonById(item.taxonId);
          if (!taxon) return null;
          const mystery = mysteryForTaxon(taxon, true);
          return (
            <Pressable
              key={item.taxonId}
              onPress={() => {
                analytics.track('around_you_viewed');
                const sessionId = startExplorerSession(taxon.id);
                router.push(`/explore-mode/${sessionId}`);
              }}
              accessibilityLabel={mystery.accessibilityLabel}
              style={{ marginBottom: theme.space[20] }}>
              <TaxonPortrait taxonId={taxon.id} category={taxon.category} discovered={false} height={200} />
              <View style={{ paddingHorizontal: theme.space[24], paddingTop: theme.space[12] }}>
                <Text variant="kicker" color="tertiary">
                  {item.occurrenceClass === 'veryLikely' ? 'Very likely' : item.occurrenceClass === 'possible' ? 'Possible' : 'Rare'}
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
      </View>
      <View style={{ paddingHorizontal: theme.space[24], marginTop: theme.space[16] }}>
        <Text variant="kicker" color="secondary">
          Quests
        </Text>
        {quests.map((quest) => {
          const collectionMap = new Map<string, string[]>();
          for (const requirement of quest.requirements) {
            if (requirement.kind === 'collection') {
              collectionMap.set(
                requirement.collectionId,
                collectionTaxonIds(requirement.collectionId),
              );
            }
          }
          const progress = evaluateQuestProgress(quest, {
            userId: user.id,
            userTaxa,
            taxaById: new Map(taxa.map((taxon) => [taxon.id, taxon])),
            collectionTaxonIdsByQuest: collectionMap,
            observations,
            now: new Date().toISOString(),
          });
          return (
            <QuestCard
              key={quest.id}
              name={quest.name}
              description={quest.description}
              current={progress.current}
              target={progress.target}
              completed={Boolean(progress.completedAt)}
              onPress={() => router.push(`/quest/${quest.id}`)}
            />
          );
        })}
      </View>
    </Screen>
  );
}
