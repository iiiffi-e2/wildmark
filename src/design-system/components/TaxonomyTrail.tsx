import { View } from 'react-native';
import type { TaxonomyTrailItem } from '@/src/domain/taxa/types';
import { useTheme } from '../theme';
import { Text } from './Text';

type Props = {
  items: TaxonomyTrailItem[];
  visibleCount: number;
};

export function TaxonomyTrail({ items, visibleCount }: Props) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.space[12], alignItems: 'center' }}>
      {items.slice(0, visibleCount).map((item, index) => {
        const isLast = index === Math.min(visibleCount, items.length) - 1 && visibleCount >= items.length;
        return (
          <View key={`${item.rank}-${item.label}`} style={{ alignItems: 'center' }}>
            <Text variant={isLast ? 'display' : 'kicker'} color={isLast ? 'primary' : 'secondary'}>
              {item.label}
            </Text>
            {index < visibleCount - 1 ? (
              <Text variant="bodySmall" color="tertiary" style={{ marginTop: theme.space[8] }}>
                ↓
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
