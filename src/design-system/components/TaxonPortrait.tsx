import { View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import type { OrganismCategory } from '@/src/domain/taxa/types';
import { useTheme } from '../theme';

type Props = {
  taxonId: string;
  category: OrganismCategory;
  discovered?: boolean;
  height?: number;
};

function hash(value: string): number {
  return [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function TaxonPortrait({ taxonId, category, discovered = true, height = 220 }: Props) {
  const theme = useTheme();
  const ink = hash(taxonId);
  const accent = theme.color.category[category];
  const muted = discovered ? accent : theme.color.text.tertiary;
  const ground = discovered ? theme.color.background.inverse : theme.color.background.secondary;

  return (
    <View style={{ height, backgroundColor: ground, overflow: 'hidden' }}>
      <Svg width="100%" height="100%" viewBox="0 0 300 220" preserveAspectRatio="xMidYMid slice">
        <Ellipse cx={150} cy={210} rx={160} ry={48} fill={discovered ? `${muted}55` : `${muted}22`} />
        <Circle cx={70 + (ink % 40)} cy={50} r={36} fill={`${muted}${discovered ? '33' : '18'}`} />
        <Circle cx={230 - (ink % 30)} cy={70} r={22} fill={`${muted}${discovered ? '22' : '10'}`} />
        {category === 'bird' ? (
          <Path d="M70 140 C110 70 190 70 230 130 C200 110 170 150 150 160 C130 150 100 120 70 140 Z" fill={muted} />
        ) : null}
        {category === 'insect' ? (
          <Path d="M150 70 C190 90 200 140 150 170 C100 140 110 90 150 70 Z" fill={muted} />
        ) : null}
        {category === 'plant' ? (
          <Path d="M150 190 V70 M150 110 C110 80 90 120 150 140 C210 120 190 80 150 110" stroke={muted} strokeWidth={8} fill="none" />
        ) : null}
        {category === 'fungi' ? (
          <Path d="M90 120 C150 40 210 120 210 120 H90 Z M140 120 V180 H160 V120" fill={muted} />
        ) : null}
        {category === 'reptile' || category === 'amphibian' ? (
          <Path d="M60 140 C110 110 200 110 250 150 C210 160 160 170 120 160 C90 170 70 160 60 140 Z" fill={muted} />
        ) : null}
        {category === 'mammal' ? (
          <Path d="M80 150 C110 90 200 90 230 150 C200 180 110 180 80 150 Z" fill={muted} />
        ) : null}
        {category === 'aquatic' ? (
          <Path d="M50 120 C120 80 200 80 260 130 C200 110 140 160 50 120 Z" fill={muted} />
        ) : null}
      </Svg>
    </View>
  );
}
