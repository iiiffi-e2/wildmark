import { Pressable, type AccessibilityRole } from 'react-native';
import { useTheme } from '../theme';
import { touchTarget } from '../tokens/spacing';
import { Text } from './Text';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  accessibilityRole?: AccessibilityRole;
};

export function Button({ label, onPress, variant = 'primary', disabled, accessibilityRole = 'button' }: Props) {
  const theme = useTheme();
  const background =
    variant === 'primary'
      ? theme.color.action.primary
      : variant === 'secondary'
        ? theme.color.action.secondary
        : 'transparent';
  const labelColor = variant === 'primary' ? 'inverse' : 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={label}
      style={({ pressed }) => ({
        minHeight: touchTarget,
        paddingHorizontal: theme.space[24],
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: background,
        borderRadius: theme.radius.sm,
        opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
        borderWidth: variant === 'ghost' ? 1 : 0,
        borderColor: theme.color.border.strong,
      })}>
      <Text variant="kicker" color={labelColor} style={{ color: variant === 'primary' ? theme.color.action.onPrimary : undefined }}>
        {label}
      </Text>
    </Pressable>
  );
}
