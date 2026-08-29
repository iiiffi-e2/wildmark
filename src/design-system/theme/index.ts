import { createContext, useContext } from 'react';
import {
  darkColors,
  lightColors,
  type ColorSchemeName,
  type SemanticColors,
} from '../tokens/color';
import { motion } from '../tokens/motion';
import { radius } from '../tokens/radius';
import { space } from '../tokens/spacing';
import { fonts, typeScale } from '../tokens/typography';

export type Theme = {
  scheme: ColorSchemeName;
  color: SemanticColors;
  space: typeof space;
  radius: typeof radius;
  fonts: typeof fonts;
  type: typeof typeScale;
  motion: typeof motion;
};

export function createTheme(scheme: ColorSchemeName): Theme {
  return {
    scheme,
    color: scheme === 'dark' ? darkColors : lightColors,
    space,
    radius,
    fonts,
    type: typeScale,
    motion,
  };
}

export const ThemeContext = createContext<Theme>(createTheme('light'));

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
