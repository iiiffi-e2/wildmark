import { Pressable, View } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

type Props = {
  name: string;
  description: string;
  discovered: number;
  total: number;
  onPress: () => void;
};

export function CollectionCard({ name, description, discovered, total, onPress }: Props) {
  const theme = useTheme();
  const progress = total === 0 ? 0 : discovered / total;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${discovered} of ${total}`}
      style={{
        paddingVertical: theme.space[20],
        borderBottomWidth: 1,
        borderBottomColor: theme.color.border.subtle,
      }}>
      <Text variant="kicker" color="mark">
        {discovered} / {total}
      </Text>
      <Text variant="title" style={{ marginTop: theme.space[8] }}>
        {name}
      </Text>
      <Text variant="bodySmall" color="secondary" style={{ marginTop: theme.space[8] }}>
        {description}
      </Text>
      <View
        style={{
          marginTop: theme.space[16],
          height: 2,
          backgroundColor: theme.color.border.subtle,
        }}>
        <View
          style={{
            width: `${Math.round(progress * 100)}%`,
            height: 2,
            backgroundColor: theme.color.discovery.mark,
          }}
        />
      </View>
    </Pressable>
  );
}
