import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/src/design-system/components/Button';
import { Screen } from '@/src/design-system/components/Screen';
import { Text } from '@/src/design-system/components/Text';
import { TaxonomyTrail } from '@/src/design-system/components/TaxonomyTrail';
import { WildmarkTarget } from '@/src/design-system/icons/WildmarkTarget';
import { useTheme } from '@/src/design-system/theme';
import { useReducedMotion } from 'react-native-reanimated';
import { useWildmark } from '@/src/app-state/WildmarkProvider';
import type { IdentificationFixtureId } from '@/src/services/identification/fixtures';
import type { TaxonomyTrailItem } from '@/src/domain/taxa/types';

export function IdentifyingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { uri, fixture } = useLocalSearchParams<{ uri?: string; fixture?: string }>();
  const { captureAndIdentify, setFixture, taxonById } = useWildmark();
  const [visibleCount, setVisibleCount] = useState(1);
  const [trail, setTrail] = useState<TaxonomyTrailItem[]>([{ rank: 'informal', label: 'Looking' }]);
  const [error, setError] = useState<string | null>(null);

  const started = useRef(false);

  useEffect(() => {
    if (fixture) {
      setFixture(fixture as IdentificationFixtureId);
    }
  }, [fixture, setFixture]);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;
    let cancelled = false;
    const image = {
      localUri: uri ?? `fixture://${fixture ?? 'northern-cardinal'}`,
      width: 1200,
      height: 1600,
      capturedAt: new Date().toISOString(),
    };

    void (async () => {
      const outcome = await captureAndIdentify(image);
      if (cancelled) return;
      if (outcome.status === 'identified') {
        const steps =
          outcome.result.trail.length > 0
            ? outcome.result.trail
            : [{ rank: 'species' as const, label: outcome.result.commonName }];
        setTrail(steps);
        const reveal = async () => {
          for (let index = 1; index <= steps.length; index += 1) {
            if (cancelled) return;
            setVisibleCount(index);
            if (!reduceMotion) {
              await new Promise((resolve) => setTimeout(resolve, 280));
            }
          }
          router.replace({
            pathname: '/wildmark',
            params: {
              observationId: outcome.discovery.observationId,
              mode: outcome.discovery.isNewWildmark ? 'new' : 'repeat',
              count: String(outcome.discovery.observationCountForTaxon),
            },
          });
        };
        await reveal();
        return;
      }
      if (outcome.status === 'ambiguous') {
        router.replace({
          pathname: '/identify-result',
          params: { kind: 'ambiguous', uri: image.localUri },
        });
        return;
      }
      if (outcome.status === 'higherRank') {
        router.replace({
          pathname: '/identify-result',
          params: { kind: 'higherRank', observationId: outcome.observationId, label: outcome.result.commonName },
        });
        return;
      }
      router.replace({
        pathname: '/identify-result',
        params: {
          kind: outcome.status,
          observationId: outcome.observationId,
          reason: outcome.result.reason,
        },
      });
    })().catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : 'Something interrupted the look.');
    });

    return () => {
      cancelled = true;
    };
  }, [captureAndIdentify, fixture, reduceMotion, router, uri]);

  if (error) {
    return (
      <Screen>
        <Text variant="title">{error}</Text>
        <View style={{ marginTop: theme.space[24] }}>
          <Button label="Return" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.space[32] }}>
        <WildmarkTarget state={visibleCount > 2 ? 'identifying' : 'focusing'} color={theme.color.text.primary} />
        <TaxonomyTrail items={trail} visibleCount={visibleCount} />
        <Text variant="bodySmall" color="tertiary">
          {taxonById('taxon-northern-cardinal') ? 'Reading the photograph' : 'Reading the photograph'}
        </Text>
      </View>
    </Screen>
  );
}
