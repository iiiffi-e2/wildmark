import { useEffect } from 'react';
import Animated, {
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { palette } from '../tokens/color';
import { motion } from '../tokens/motion';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

export type WildmarkTargetState =
  | 'idle'
  | 'focusing'
  | 'subjectDetected'
  | 'identifying'
  | 'resolved'
  | 'failed';

type Props = {
  state: WildmarkTargetState;
  size?: number;
  color?: string;
  accent?: string;
};

function completenessFor(state: WildmarkTargetState): number {
  switch (state) {
    case 'idle':
      return 0.28;
    case 'subjectDetected':
      return 0.48;
    case 'focusing':
      return 0.66;
    case 'identifying':
      return 0.84;
    case 'resolved':
      return 1;
    case 'failed':
      return 0.4;
  }
}

export function WildmarkTarget({
  state,
  size = 168,
  color = palette.warmBone,
  accent = palette.discovery,
}: Props) {
  const reduceMotion = useReducedMotion();
  const completeness = useSharedValue(completenessFor(state));

  useEffect(() => {
    completeness.value = reduceMotion
      ? completenessFor(state)
      : withTiming(completenessFor(state), { duration: motion.focus });
  }, [completeness, reduceMotion, state]);

  const frameProps = useAnimatedProps(() => ({
    strokeOpacity: 0.35 + completeness.value * 0.55,
  }));
  const markProps = useAnimatedProps(() => ({
    opacity: completeness.value > 0.9 ? 1 : 0.15 + completeness.value * 0.4,
  }));

  const inset = 18;
  const arm = 28;
  return (
    <Svg width={size} height={size} viewBox="0 0 180 180" accessibilityLabel="Wildmark scan target">
      <AnimatedPath
        animatedProps={frameProps}
        d={`M${inset} ${inset + arm} V${inset} H${inset + arm}`}
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
      <AnimatedPath
        animatedProps={frameProps}
        d={`M${180 - inset - arm} ${inset} H${180 - inset} V${inset + arm}`}
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
      <AnimatedPath
        animatedProps={frameProps}
        d={`M${180 - inset} ${180 - inset - arm} V${180 - inset} H${180 - inset - arm}`}
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
      <AnimatedPath
        animatedProps={frameProps}
        d={`M${inset + arm} ${180 - inset} H${inset} V${180 - inset - arm}`}
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
      <AnimatedRect animatedProps={markProps} x={84} y={84} width={12} height={12} fill={accent} />
    </Svg>
  );
}
