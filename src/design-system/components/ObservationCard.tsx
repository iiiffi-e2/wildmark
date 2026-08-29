import { Pressable, View } from 'react-native';
import type { OrganismCategory } from '@/src/domain/taxa/types';
import { useTheme } from '../theme';
import { TaxonPortrait } from './TaxonPortrait';
import { Text } from './Text';

type Props = {
  title: string;
  subtitle: string;
  dateLabel: string;
  placeLabel?: string | null;
  taxonId?: string | null;
  category?: OrganismCategory;
  onPress: () => void;
};

export function ObservationCard({
  title,
  subtitle,
  dateLabel,
  placeLabel,
  taxonId,
  category,
  onPress,
}: Props) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={{ marginBottom: theme.space[32] }}>
      {taxonId && category ? <TaxonPortrait taxonId={taxonId} category={category} height={280} /> : (
        <View style={{ height: 220, backgroundColor: theme.color.background.secondary }} />
      )}
      <View style={{ paddingTop: theme.space[16], gap: 6 }}>
        <Text variant="kicker" color="secondary">
          {dateLabel}
        </Text>
        <Text variant="title">{title}</Text>
        <Text variant="scientific" color="secondary">
          {subtitle}
        </Text>
        {placeLabel ? (
          <Text variant="bodySmall" color="tertiary">
            {placeLabel}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
