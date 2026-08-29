import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Button } from '@/src/design-system/components/Button';
import { Screen } from '@/src/design-system/components/Screen';
import { Text } from '@/src/design-system/components/Text';
import { useTheme } from '@/src/design-system/theme';
import { useWildmark } from '@/src/app-state/WildmarkProvider';

export function RecapScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { recapForCurrentMonth } = useWildmark();
  const recap = recapForCurrentMonth();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextLabel = nextMonth.toLocaleDateString(undefined, { month: 'long' });

  return (
    <Screen>
      <Text variant="kicker" color="secondary">
        Recap
      </Text>
      <Text variant="display" style={{ marginTop: theme.space[8] }}>
        Your {recap.monthLabel} in the wild
      </Text>
      <View style={{ marginTop: theme.space[32], gap: theme.space[16] }}>
        <Text variant="title">{recap.newSpecies} new species</Text>
        <Text variant="title">{recap.observations} observations</Text>
        <Text variant="title">{recap.places} places explored</Text>
        <Text variant="title">{recap.collectionsAdvanced} collections advanced</Text>
      </View>
      {recap.rarestName ? (
        <View style={{ marginTop: theme.space[32] }}>
          <Text variant="kicker" color="secondary">
            Rarest find
          </Text>
          <Text variant="title" style={{ marginTop: 4 }}>
            {recap.rarestName}
          </Text>
        </View>
      ) : null}
      {recap.mostSeenName ? (
        <View style={{ marginTop: theme.space[24] }}>
          <Text variant="kicker" color="secondary">
            Most seen
          </Text>
          <Text variant="title" style={{ marginTop: 4 }}>
            {recap.mostSeenName}
          </Text>
        </View>
      ) : null}
      {recap.closestGoal ? (
        <View style={{ marginTop: theme.space[24] }}>
          <Text variant="kicker" color="secondary">
            Closest collection
          </Text>
          <Text variant="title" style={{ marginTop: 4 }}>
            {recap.closestGoal}
          </Text>
        </View>
      ) : null}
      {recap.bestDay ? (
        <View style={{ marginTop: theme.space[24] }}>
          <Text variant="kicker" color="secondary">
            Best day
          </Text>
          <Text variant="title" style={{ marginTop: 4 }}>
            {recap.bestDay}
          </Text>
        </View>
      ) : null}
      <Text variant="kicker" color="mark" style={{ marginTop: theme.space[40] }}>
        {nextLabel} is different.
      </Text>
      <Text variant="body" color="secondary" style={{ marginTop: theme.space[8] }}>
        See what’s arriving near you.
      </Text>
      <View style={{ marginTop: theme.space[32], gap: theme.space[12] }}>
        <Button label="Around you" onPress={() => router.replace('/(tabs)/explore')} />
        <Button variant="secondary" label="Back" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
