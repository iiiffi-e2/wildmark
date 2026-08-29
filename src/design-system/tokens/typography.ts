export const fonts = {
  display: 'Fraunces-Variable',
  ui: 'SourceSans3-Regular',
  uiMedium: 'SourceSans3-Medium',
  uiSemibold: 'SourceSans3-Semibold',
  scientific: 'SourceSans3-Italic',
  mono: 'SpaceMono',
} as const;

export const fontFallback = {
  display: 'Georgia',
  ui: 'System',
  scientific: 'Georgia',
};

export const typeScale = {
  kicker: { fontSize: 12, lineHeight: 16, letterSpacing: 1.6, textTransform: 'uppercase' as const },
  body: { fontSize: 16, lineHeight: 24, letterSpacing: 0.1 },
  bodySmall: { fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
  title: { fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
  display: { fontSize: 40, lineHeight: 44, letterSpacing: -0.8 },
  displayLarge: { fontSize: 56, lineHeight: 58, letterSpacing: -1.4 },
  scientific: { fontSize: 16, lineHeight: 22, letterSpacing: 0.15 },
};
