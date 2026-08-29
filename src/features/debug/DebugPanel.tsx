import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/src/design-system/components/Button';
import { Text } from '@/src/design-system/components/Text';
import { useTheme } from '@/src/design-system/theme';
import { IDENTIFICATION_FIXTURE_IDS, useWildmark } from '@/src/app-state/WildmarkProvider';
import { isDevToolsEnabled } from '@/src/config/flags';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    inspectStore,
    persistenceKind,
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
            void simulateDiscovery('northern-cardinal').then((outcome) => {
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
            });
          }}
        />
        <Button
          label="Simulate repeat sighting"
          onPress={() => {
            void simulateDiscovery('northern-cardinal');
          }}
        />
        <Button label="Simulate ambiguous" onPress={() => void simulateDiscovery('ambiguous-swallowtail')} />
        <Button label="Simulate failed" onPress={() => void simulateDiscovery('blurry')} />
        <Button label={offline ? 'Go online' : 'Simulate offline'} onPress={() => setOffline(!offline)} />
        <Button label="Fill journal" onPress={() => void fillJournal()} />
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
