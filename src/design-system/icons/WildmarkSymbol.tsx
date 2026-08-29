import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { palette } from '../tokens/color';

type Props = {
  size?: number;
  color?: string;
  accent?: string;
  completeness?: number;
};

export function WildmarkSymbol({
  size = 32,
  color = palette.deepInk,
  accent = palette.discovery,
  completeness = 1,
}: Props) {
  const inset = 5;
  const arm = 11;
  const shown = Math.max(0, Math.min(1, completeness));
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityRole="image">
      {shown > 0.15 ? <Path d={`M${inset} ${inset + arm} V${inset} H${inset + arm}`} stroke={color} strokeWidth={2.4} fill="none" /> : null}
      {shown > 0.35 ? (
        <Path d={`M${48 - inset - arm} ${inset} H${48 - inset} V${inset + arm}`} stroke={color} strokeWidth={2.4} fill="none" />
      ) : null}
      {shown > 0.55 ? (
        <Path
          d={`M${48 - inset} ${48 - inset - arm} V${48 - inset} H${48 - inset - arm}`}
          stroke={color}
          strokeWidth={2.4}
          fill="none"
        />
      ) : null}
      {shown > 0.75 ? (
        <Path d={`M${inset + arm} ${48 - inset} H${inset} V${48 - inset - arm}`} stroke={color} strokeWidth={2.4} fill="none" />
      ) : null}
      {shown > 0.9 ? <Rect x={21} y={21} width={6} height={6} fill={accent} /> : <Circle cx={24} cy={24} r={2.2} fill={accent} />}
    </Svg>
  );
}
