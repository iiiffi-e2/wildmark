import Svg, { Path, Rect } from 'react-native-svg';
import { palette } from '../tokens/color';

type Props = {
  size?: number;
  color?: string;
  accent?: string;
};

export function WildmarkMarker({ size = 28, color = palette.deepInk, accent = palette.discovery }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 48" accessibilityRole="image">
      <Path
        d="M6 10 V6 H10 M30 6 H34 V10 M34 30 V38 H30 M10 38 H6 V30"
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
      <Rect x={17} y={19} width={6} height={6} fill={accent} />
      <Path d="M20 38 L12 46 H28 Z" fill={color} />
    </Svg>
  );
}
