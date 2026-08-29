import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '@/src/design-system/components/Button';
import { Screen } from '@/src/design-system/components/Screen';
import { Text } from '@/src/design-system/components/Text';
import { WildmarkSymbol } from '@/src/design-system/icons/WildmarkSymbol';
import { useTheme } from '@/src/design-system/theme';
import { useRouter } from 'expo-router';
import { useWildmark } from '@/src/app-state/WildmarkProvider';
import { analytics } from '@/src/services/analytics/service';

const PAGES = [
  {
    kicker: 'Wildmark',
    title: 'Discover what’s around you.',
    body: 'A field instrument for noticing living things, then keeping them in a journal that becomes yours.',
  },
  {
    kicker: 'See',
    title: 'Point Wildmark at something living.',
    body: 'Photograph a bird, a bee, a flower, a fungus. Identification helps. Discovery is the point.',
  },
  {
    kicker: 'Mark',
    title: 'New finds become Wildmarks.',
    body: 'The first time you meet a species, it enters your collection. Every encounter stays in the Field Journal.',
  },
];

export function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { completeOnboarding } = useWildmark();
  const [page, setPage] = useState(0);
  const current = PAGES[page] ?? {
    kicker: 'Wildmark',
    title: 'Discover what’s around you.',
    body: 'A field instrument for noticing living things.',
  };

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'space-between', paddingTop: theme.space[32] }}>
        <View>
          <WildmarkSymbol size={48} color={theme.color.text.primary} accent={theme.color.discovery.mark} />
          <Text variant="kicker" color="secondary" style={{ marginTop: theme.space[32] }}>
            {current.kicker}
          </Text>
          <Text variant="display" style={{ marginTop: theme.space[16] }}>
            {current.title}
          </Text>
          <Text variant="body" color="secondary" style={{ marginTop: theme.space[16], maxWidth: 360 }}>
            {current.body}
          </Text>
        </View>
        <View style={{ gap: theme.space[12], paddingBottom: theme.space[16] }}>
          <Button
            label={page < PAGES.length - 1 ? 'Continue' : 'Find something wild'}
            onPress={() => {
              if (page === 0) analytics.track('onboarding_started');
              if (page < PAGES.length - 1) {
                setPage(page + 1);
                return;
              }
              void completeOnboarding().then(() => router.replace('/(tabs)'));
            }}
          />
        </View>
      </View>
    </Screen>
  );
}
