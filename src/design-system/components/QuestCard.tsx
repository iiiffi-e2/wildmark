import { Pressable, View } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

type Props = {
  name: string;
  description: string;
  current: number;
  target: number;
  completed: boolean;
  onPress: () => void;
};

export function QuestCard({ name, description, current, target, completed, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={name}
      style={{
        paddingVertical: theme.space[20],
        borderBottomWidth: 1,
        borderBottomColor: theme.color.border.subtle,
      }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text variant="title" style={{ flex: 1, paddingRight: theme.space[16] }}>
          {name}
        </Text>
        <Text variant="kicker" color={completed ? 'mark' : 'secondary'}>
          {completed ? 'Marked' : `${current}/${target}`}
        </Text>
      </View>
      <Text variant="bodySmall" color="secondary" style={{ marginTop: theme.space[8] }}>
        {description}
      </Text>
    </Pressable>
  );
}
