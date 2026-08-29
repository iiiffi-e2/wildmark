import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { Button } from '@/src/design-system/components/Button';
import { Screen } from '@/src/design-system/components/Screen';
import { Text } from '@/src/design-system/components/Text';
import { useTheme } from '@/src/design-system/theme';
import { useWildmark } from '@/src/app-state/WildmarkProvider';
import { evaluateQuestProgress } from '@/src/domain/quests/evaluate';
import { listQuestObjectives } from '@/src/domain/quests/objectives';
import { analytics } from '@/src/services/analytics/service';

export function QuestDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { quests, user, userTaxa, taxa, observations, collectionTaxonIds } = useWildmark();
  const quest = quests.find((item) => item.id === id);

  if (!quest) {
    return (
      <Screen>
        <Text variant="title">Quest not found</Text>
      </Screen>
    );
  }

  const collectionMap = new Map<string, string[]>();
  for (const requirement of quest.requirements) {
    if (requirement.kind === 'collection') {
      collectionMap.set(requirement.collectionId, collectionTaxonIds(requirement.collectionId));
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
  const collectionIds = quest.requirements.find((item) => item.kind === 'collection');
  const objectives = listQuestObjectives(quest, {
    userTaxa,
    taxaById: new Map(taxa.map((taxon) => [taxon.id, taxon])),
    collectionTaxonIds: collectionIds && collectionIds.kind === 'collection' ? collectionTaxonIds(collectionIds.collectionId) : [],
  });
  const remaining = Math.max(0, progress.target - progress.current);

  return (
    <Screen>
      <Text variant="kicker" color="secondary">
        Quest
      </Text>
      <Text variant="display" style={{ marginTop: theme.space[8] }}>
        {quest.name}
      </Text>
      <Text variant="body" color="secondary" style={{ marginTop: theme.space[16] }}>
        {quest.description}
      </Text>
      <Text variant="title" style={{ marginTop: theme.space[32] }}>
        {progress.current} / {progress.target}
      </Text>
      {progress.completedAt ? (
        <Text variant="kicker" color="mark" style={{ marginTop: theme.space[12] }}>
          Complete
        </Text>
      ) : remaining === 1 ? (
        <Text variant="body" color="secondary" style={{ marginTop: theme.space[12] }}>
          One discovery left.
        </Text>
      ) : (
        <Text variant="body" color="secondary" style={{ marginTop: theme.space[12] }}>
          Stay curious. Do not catch or handle wildlife.
        </Text>
      )}
      <View style={{ marginTop: theme.space[32], gap: theme.space[12] }}>
        {objectives.map((objective) => (
          <Text key={objective.id} variant="body" color={objective.done ? 'primary' : 'secondary'}>
            {objective.done ? '✓' : '○'} {objective.label}
          </Text>
        ))}
      </View>
      <View style={{ marginTop: theme.space[32] }}>
        <Button
          label="Go looking"
          onPress={() => {
            analytics.track('quest_started');
            router.push('/(tabs)/scan');
          }}
        />
      </View>
    </Screen>
  );
}
