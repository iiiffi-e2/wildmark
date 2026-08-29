import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme } from '../theme';

type Variant = 'kicker' | 'body' | 'bodySmall' | 'title' | 'display' | 'displayLarge' | 'scientific';

type Props = RNTextProps & {
  variant?: Variant;
  color?: 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'mark';
};

export function Text({ variant = 'body', color = 'primary', style, ...props }: Props) {
  const theme = useTheme();
  const palette =
    color === 'mark'
      ? theme.color.discovery.mark
      : color === 'inverse'
        ? theme.color.text.inverse
        : theme.color.text[color];

  const fontFamily =
    variant === 'display' || variant === 'displayLarge' || variant === 'title'
      ? theme.fonts.display
      : variant === 'scientific'
        ? theme.fonts.scientific
        : variant === 'kicker'
          ? theme.fonts.uiSemibold
          : theme.fonts.ui;

  const scale = theme.type[variant];
  const composed: TextStyle = {
    color: palette,
    fontFamily,
    fontSize: scale.fontSize,
    lineHeight: scale.lineHeight,
    letterSpacing: scale.letterSpacing,
    fontStyle: variant === 'scientific' ? 'italic' : 'normal',
    textTransform: variant === 'kicker' ? 'uppercase' : 'none',
  };

  return <RNText style={[composed, style]} {...props} />;
}
