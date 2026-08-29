import { Pressable, View } from 'react-native';
import type { OrganismCategory } from '@/src/domain/taxa/types';
import { useTheme } from '../theme';
import { TaxonPortrait } from './TaxonPortrait';
import { Text } from './Text';

type Props = {
  commonName: string;
  scientificName: string;
  category: OrganismCategory;
  taxonId: string;
  observationCount?: number;
  onPress: () => void;
};

export function SpeciesTile({ commonName, scientificName, category, taxonId, observationCount, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={commonName} style={{ flex: 1 }}>
      <TaxonPortrait taxonId={taxonId} category={category} height={148} />
      <View style={{ paddingTop: theme.space[12], paddingBottom: theme.space[16], gap: 4 }}>
        <Text variant="kicker" color="secondary">
          {category}
        </Text>
        <Text variant="title" style={{ fontSize: 22, lineHeight: 26 }}>
          {commonName}
        </Text>
        <Text variant="scientific" color="secondary">
          {scientificName}
        </Text>
        {observationCount ? (
          <Text variant="bodySmall" color="tertiary">
            {observationCount === 1 ? '1 observation' : `${observationCount} observations`}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
