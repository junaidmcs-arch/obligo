import { COLOR_THEMES, type ColorTheme } from '@/models/types';

export const DEFAULT_COLOR_THEME: ColorTheme = 'forest';
export type PaletteColors = Record<
  | 'bg'
  | 'surface'
  | 'text'
  | 'muted'
  | 'border'
  | 'primary'
  | 'primary-hover'
  | 'on-primary'
  | 'soft',
  string
>;
interface Palette {
  name: string;
  description: string;
  light: PaletteColors;
  dark: PaletteColors;
}

// Semantic tokens keep every screen in sync. Status/category colours are independent.
export const palettes: Record<ColorTheme, Palette> = {
  forest: {
    name: 'Forest',
    description: 'Calm green',
    light: {
      bg: '#f6f8f7',
      surface: '#ffffff',
      text: '#263a35',
      muted: '#56665e',
      border: '#dce5e0',
      primary: '#176b50',
      'primary-hover': '#11573f',
      'on-primary': '#ffffff',
      soft: '#e8f3ed',
    },
    dark: {
      bg: '#14201c',
      surface: '#1c2925',
      text: '#e4eee8',
      muted: '#a4b6ac',
      border: '#33463d',
      primary: '#7ed2aa',
      'primary-hover': '#a0e4c2',
      'on-primary': '#102b20',
      soft: '#263e32',
    },
  },
  ocean: {
    name: 'Ocean',
    description: 'Fresh blue',
    light: {
      bg: '#f5f8fc',
      surface: '#ffffff',
      text: '#20354c',
      muted: '#52667c',
      border: '#dbe4ef',
      primary: '#1d5db5',
      'primary-hover': '#164a92',
      'on-primary': '#ffffff',
      soft: '#e8f0fc',
    },
    dark: {
      bg: '#111d2b',
      surface: '#1a293a',
      text: '#e6effa',
      muted: '#a5b6cb',
      border: '#34475e',
      primary: '#8bbdff',
      'primary-hover': '#b3d4ff',
      'on-primary': '#102d51',
      soft: '#233d5d',
    },
  },
  violet: {
    name: 'Violet',
    description: 'Soft purple',
    light: {
      bg: '#f8f6fc',
      surface: '#ffffff',
      text: '#352b48',
      muted: '#6a5c7c',
      border: '#e5dfee',
      primary: '#7040b5',
      'primary-hover': '#59318f',
      'on-primary': '#ffffff',
      soft: '#f0eafa',
    },
    dark: {
      bg: '#1d1728',
      surface: '#2a2238',
      text: '#efe8fa',
      muted: '#bdb0d0',
      border: '#483957',
      primary: '#c8a5f8',
      'primary-hover': '#dbc3fc',
      'on-primary': '#302046',
      soft: '#3d2d54',
    },
  },
  rose: {
    name: 'Rose',
    description: 'Warm pink',
    light: {
      bg: '#fcf6f8',
      surface: '#ffffff',
      text: '#472b37',
      muted: '#7b5866',
      border: '#eedde4',
      primary: '#ad355f',
      'primary-hover': '#8e294d',
      'on-primary': '#ffffff',
      soft: '#fbeaf0',
    },
    dark: {
      bg: '#27171e',
      surface: '#36232c',
      text: '#fae8ef',
      muted: '#cfafbd',
      border: '#583b49',
      primary: '#f5a0bd',
      'primary-hover': '#fac0d4',
      'on-primary': '#4b1d2e',
      soft: '#532c3c',
    },
  },
  amber: {
    name: 'Amber',
    description: 'Golden warmth',
    light: {
      bg: '#fcf9f2',
      surface: '#fffefa',
      text: '#44351f',
      muted: '#73634a',
      border: '#e8dfcc',
      primary: '#885411',
      'primary-hover': '#6c410c',
      'on-primary': '#ffffff',
      soft: '#f9eed8',
    },
    dark: {
      bg: '#241e14',
      surface: '#32291c',
      text: '#f5eddd',
      muted: '#c5b59a',
      border: '#504430',
      primary: '#edbf69',
      'primary-hover': '#f5d493',
      'on-primary': '#3b280b',
      soft: '#4b391d',
    },
  },
  slate: {
    name: 'Slate',
    description: 'Quiet neutral',
    light: {
      bg: '#f6f7f9',
      surface: '#ffffff',
      text: '#283342',
      muted: '#5b6777',
      border: '#dfe3e9',
      primary: '#48566b',
      'primary-hover': '#334155',
      'on-primary': '#ffffff',
      soft: '#e9edf3',
    },
    dark: {
      bg: '#171b22',
      surface: '#222833',
      text: '#e9edf4',
      muted: '#b0bac9',
      border: '#3b4656',
      primary: '#bdcce1',
      'primary-hover': '#d7e2f1',
      'on-primary': '#243247',
      soft: '#334054',
    },
  },
};

export function isColorTheme(value: unknown): value is ColorTheme {
  return typeof value === 'string' && COLOR_THEMES.some((id) => id === value);
}

export function resolveColorTheme(value: unknown): ColorTheme {
  return isColorTheme(value) ? value : DEFAULT_COLOR_THEME;
}
