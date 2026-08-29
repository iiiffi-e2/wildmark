import { View } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

type Props = {
  label: string;
  previous: number;
  current: number;
  total?: number;
  complete?: boolean;
};

export function ProgressDelta({ label, previous, current, total, complete }: Props) {
  const theme = useTheme();
  if (previous === current && !complete) {
    return null;
  }
  return (
    <View style={{ paddingVertical: theme.space[8] }}>
      <Text variant="kicker" color={complete ? 'mark' : 'secondary'}>
        {complete ? 'Complete' : label}
      </Text>
      <Text variant="title" style={{ marginTop: 4 }}>
        {label}
      </Text>
      <Text variant="body" color="secondary" style={{ marginTop: 4 }}>
        {total != null ? `${previous} / ${total}  →  ${current} / ${total}` : `${previous}  →  ${current}`}
      </Text>
    </View>
  );
}
