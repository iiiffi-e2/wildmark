import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/src/design-system/components/Button';
import { Text } from '@/src/design-system/components/Text';
import { useTheme } from '@/src/design-system/theme';
import { IDENTIFICATION_FIXTURE_IDS, useWildmark } from '@/src/app-state/WildmarkProvider';
import { isDevToolsEnabled } from '@/src/config/flags';
import { playFeedback } from '@/src/services/feedback/service';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { IdentifyOutcome } from '@/src/app-state/WildmarkProvider';

function openDiscovery(router: ReturnType<typeof useRouter>, outcome: IdentifyOutcome) {
  if (outcome.status === 'identified') {
    router.replace({
      pathname: '/wildmark',
      params: {
        observationId: outcome.discovery.observationId,
        mode: outcome.discovery.isNewWildmark ? 'new' : 'repeat',
        count: String(outcome.discovery.observationCountForTaxon),
      },
    });
  }
}

export function DebugPanel() {
  const theme = useTheme();
  const router = useRouter();
  const {
    selectedFixture,
    setFixture,
    setOffline,
    offline,
    resetLocalData,
    fillJournal,
    simulateDiscovery,
    simulateHalfCentury,
    simulateCollectionComplete,
    simulateQuestComplete,
    resetMilestones,
    inspectStore,
    persistenceKind,
    flushSync,
    user,
  } = useWildmark();

  if (!isDevToolsEnabled) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.background.primary, padding: theme.space[24] }}>
        <Text variant="title">This panel is not available.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.background.primary }}>
      <ScrollView contentContainerStyle={{ padding: theme.space[24], gap: theme.space[12] }}>
        <Text variant="kicker" color="secondary">
          Development
        </Text>
        <Text variant="display">Hidden panel</Text>
        <Text variant="bodySmall" color="tertiary">
          Persistence: {persistenceKind}. Fixture: {selectedFixture}. Offline: {offline ? 'yes' : 'no'}
        </Text>
        {IDENTIFICATION_FIXTURE_IDS.map((id) => (
          <Button key={id} variant={id === selectedFixture ? 'primary' : 'secondary'} label={id} onPress={() => setFixture(id)} />
        ))}
        <Button
          label="Simulate New Wildmark"
          onPress={() => {
            void simulateDiscovery('northern-cardinal').then((outcome) => openDiscovery(router, outcome));
          }}
        />
        <Button
          label="Simulate rare discovery"
          onPress={() => {
            void simulateDiscovery('rare-find', 'rare').then((outcome) => openDiscovery(router, outcome));
          }}
        />
        <Button
          label="Simulate first species"
          onPress={() => {
            void resetLocalData().then(() =>
              simulateDiscovery('northern-cardinal').then((outcome) => openDiscovery(router, outcome)),
            );
          }}
        />
        <Button
          label="Simulate 49 → 50"
          onPress={() => {
            void simulateHalfCentury().then((outcome) => openDiscovery(router, outcome));
          }}
        />
        <Button
          label="Simulate collection completion"
          onPress={() => {
            void simulateCollectionComplete().then((outcome) => openDiscovery(router, outcome));
          }}
        />
        <Button label="Simulate quest completion" onPress={() => void simulateQuestComplete()} />
        <Button
          label="Simulate repeat sighting"
          onPress={() => {
            void simulateDiscovery('northern-cardinal').then((outcome) => openDiscovery(router, outcome));
          }}
        />
        <Button
          label="Simulate seasonal discovery"
          onPress={() => {
            void simulateDiscovery('bluebonnet').then((outcome) => openDiscovery(router, outcome));
          }}
        />
        <Button label="Simulate ambiguous" onPress={() => void simulateDiscovery('ambiguous-swallowtail')} />
        <Button label="Simulate failed" onPress={() => void simulateDiscovery('blurry')} />
        <Button label={offline ? 'Go online' : 'Simulate offline'} onPress={() => setOffline(!offline)} />
        <Button label="Fill journal" onPress={() => void fillJournal()} />
        <Button label="Reset milestones" onPress={() => void resetMilestones()} />
        <Button label="Flush sync queue" onPress={() => void flushSync()} />
        <Text variant="kicker" color="secondary" style={{ marginTop: theme.space[16] }}>
          Feedback levels
        </Text>
        {([1, 2, 3, 4, 5] as const).map((level) => (
          <Button key={level} variant="ghost" label={`Preview level ${level}`} onPress={() => void playFeedback(level, user.soundEnabled)} />
        ))}
        <Button
          label="Inspect store"
          onPress={() => {
            console.log(inspectStore());
          }}
        />
        <Button variant="ghost" label="Reset onboarding and data" onPress={() => void resetLocalData()} />
        <View style={{ height: theme.space[24] }} />
      </ScrollView>
    </SafeAreaView>
  );
}
