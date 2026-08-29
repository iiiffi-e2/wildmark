import { View } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

type Props = {
  title: string;
  body: string;
};

export function EmptyState({ title, body }: Props) {
  const theme = useTheme();
  return (
    <View style={{ paddingVertical: theme.space[48], maxWidth: 320 }}>
      <Text variant="title">{title}</Text>
      <Text variant="body" color="secondary" style={{ marginTop: theme.space[12] }}>
        {body}
      </Text>
    </View>
  );
}
