import { Pressable, View } from 'react-native';
import type { OrganismCategory } from '@/src/domain/taxa/types';
import { useTheme } from '../theme';
import { TaxonPortrait } from './TaxonPortrait';
import { Text } from './Text';

type Props = {
  category: OrganismCategory;
  taxonId: string;
  clue?: string | null;
  onPress: () => void;
};

export function MysterySpeciesTile({ category, taxonId, clue, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Undiscovered ${category}`}
      style={{ flex: 1 }}>
      <TaxonPortrait taxonId={taxonId} category={category} discovered={false} height={148} />
      <View style={{ paddingTop: theme.space[12], paddingBottom: theme.space[16], gap: 4 }}>
        <Text variant="kicker" color="tertiary">
          Nearby
        </Text>
        <Text variant="title" style={{ fontSize: 22, lineHeight: 26 }}>
          Undiscovered
        </Text>
        {clue ? (
          <Text variant="bodySmall" color="secondary">
            {clue}
          </Text>
        ) : (
          <Text variant="bodySmall" color="tertiary">
            This is something real that exists near you.
          </Text>
        )}
      </View>
    </Pressable>
  );
}
