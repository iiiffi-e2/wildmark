export const palette = {
  deepInk: '#141918',
  warmBone: '#F2EFE6',
  fieldGray: '#7C817B',
  discovery: '#C7F24B',
  bird: '#5B8FA8',
  insect: '#C4923A',
  plant: '#5E7A4A',
  fungi: '#B45A3C',
  reptile: '#6B7F5A',
  mammal: '#A56B4B',
  amphibian: '#4F7A6A',
  aquatic: '#2F6F7A',
  warning: '#C47A3A',
  error: '#B5523C',
  success: '#6A8F4E',
} as const;

export type ColorSchemeName = 'light' | 'dark';

export type SemanticColors = {
  background: {
    primary: string;
    secondary: string;
    inverse: string;
    overlay: string;
  };
  text: {
    primary: string;
    secondary: string;
    inverse: string;
    tertiary: string;
  };
  action: {
    primary: string;
    onPrimary: string;
    secondary: string;
  };
  discovery: {
    mark: string;
  };
  status: {
    success: string;
    warning: string;
    error: string;
  };
  category: {
    bird: string;
    insect: string;
    plant: string;
    fungi: string;
    reptile: string;
    mammal: string;
    amphibian: string;
    aquatic: string;
  };
  border: {
    subtle: string;
    strong: string;
  };
};

export const lightColors: SemanticColors = {
  background: {
    primary: palette.warmBone,
    secondary: '#E7E3D6',
    inverse: palette.deepInk,
    overlay: 'rgba(20, 25, 24, 0.42)',
  },
  text: {
    primary: palette.deepInk,
    secondary: '#4F544F',
    inverse: palette.warmBone,
    tertiary: palette.fieldGray,
  },
  action: {
    primary: palette.discovery,
    onPrimary: palette.deepInk,
    secondary: '#D8D3C4',
  },
  discovery: {
    mark: palette.discovery,
  },
  status: {
    success: palette.success,
    warning: palette.warning,
    error: palette.error,
  },
  category: {
    bird: palette.bird,
    insect: palette.insect,
    plant: palette.plant,
    fungi: palette.fungi,
    reptile: palette.reptile,
    mammal: palette.mammal,
    amphibian: palette.amphibian,
    aquatic: palette.aquatic,
  },
  border: {
    subtle: 'rgba(20, 25, 24, 0.1)',
    strong: 'rgba(20, 25, 24, 0.22)',
  },
};

export const darkColors: SemanticColors = {
  background: {
    primary: palette.deepInk,
    secondary: '#1C221F',
    inverse: palette.warmBone,
    overlay: 'rgba(8, 10, 9, 0.55)',
  },
  text: {
    primary: palette.warmBone,
    secondary: '#B4B8B0',
    inverse: palette.deepInk,
    tertiary: '#8B9088',
  },
  action: {
    primary: palette.discovery,
    onPrimary: palette.deepInk,
    secondary: '#2A312C',
  },
  discovery: {
    mark: palette.discovery,
  },
  status: {
    success: palette.success,
    warning: palette.warning,
    error: palette.error,
  },
  category: {
    bird: palette.bird,
    insect: palette.insect,
    plant: palette.plant,
    fungi: palette.fungi,
    reptile: palette.reptile,
    mammal: palette.mammal,
    amphibian: palette.amphibian,
    aquatic: palette.aquatic,
  },
  border: {
    subtle: 'rgba(242, 239, 230, 0.08)',
    strong: 'rgba(242, 239, 230, 0.18)',
  },
};
