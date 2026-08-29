import { Pressable, View } from 'react-native';
import { WildmarkSymbol } from '../icons/WildmarkSymbol';
import { useTheme } from '../theme';
import { Text } from './Text';

type Props = {
  onPress: () => void;
};

export function ScanButton({ onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Scan"
      style={({ pressed }) => ({
        backgroundColor: theme.color.action.primary,
        minHeight: 72,
        paddingHorizontal: theme.space[24],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        opacity: pressed ? 0.86 : 1,
      })}>
      <View>
        <Text variant="kicker" style={{ color: theme.color.action.onPrimary }}>
          Find something wild
        </Text>
        <Text variant="title" style={{ color: theme.color.action.onPrimary, marginTop: 4 }}>
          Scan
        </Text>
      </View>
      <WildmarkSymbol size={36} color={theme.color.action.onPrimary} accent={theme.color.action.onPrimary} />
    </Pressable>
  );
}
