import { View } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

type Props = {
  greeting: string;
  discoveredCount: number;
  nearbyCount: number;
};

export function DiscoveryHero({ greeting, discoveredCount, nearbyCount }: Props) {
  const theme = useTheme();
  return (
    <View style={{ paddingTop: theme.space[24], paddingBottom: theme.space[16] }}>
      <Text variant="kicker" color="secondary">
        {greeting}
      </Text>
      <Text variant="displayLarge" style={{ marginTop: theme.space[12] }}>
        {discoveredCount}
      </Text>
      <Text variant="title" style={{ marginTop: theme.space[4] }}>
        {discoveredCount === 1 ? 'species discovered' : 'species discovered'}
      </Text>
      <Text variant="body" color="secondary" style={{ marginTop: theme.space[16], maxWidth: 320 }}>
        {nearbyCount === 1
          ? '1 undiscovered species is likely around you today.'
          : `${nearbyCount} undiscovered species are likely around you today.`}
      </Text>
    </View>
  );
}
