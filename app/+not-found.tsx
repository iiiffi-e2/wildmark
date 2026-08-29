import { Link, Stack } from 'expo-router';
import { Screen } from '@/src/design-system/components/Screen';
import { Text } from '@/src/design-system/components/Text';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Missing' }} />
      <Screen>
        <Text variant="title">This page is not in the journal.</Text>
        <Link href="/" style={{ marginTop: 16 }}>
          <Text variant="kicker" color="mark">
            Return to Discover
          </Text>
        </Link>
      </Screen>
    </>
  );
}
