import { Platform } from 'react-native';

/** Glance colour tokens — deep violet glass, one lavender accent. */
export const C = {
  ink: '#0D0820',
  black: '#000000',
  graphite: '#1A1233',
  line: '#33285A',
  fog: '#B6ABD0',
  paper: '#F6F1FF',
  /** Icons, borders, glow. */
  accent: '#9B6BFF',
  /** Deep brand violet. */
  accentStrong: '#6D3BFF',
  /** Primary buttons (dark text on top). */
  accentPale: '#D9C4FF',
  accentSoft: 'rgba(155,107,255,0.2)',
  glass: 'rgba(22,14,48,0.72)',
  glassBorder: 'rgba(190,160,255,0.3)',
  rec: '#FF3B5C',
  ok: '#7CFFB2',
} as const;

export const DisplayFont = 'Inter_700Bold';
export const DisplayFontMedium = 'Inter_600SemiBold';

/** Script fonts the reader can use. */
export const ScriptFonts = {
  clean: {
    label: 'Clean',
    family: Platform.select({ ios: 'System', default: 'sans-serif' }),
    weight: '600' as const,
  },
  readable: {
    label: 'Readable',
    family: 'AtkinsonHyperlegible_700Bold',
    weight: undefined,
  },
  typewriter: {
    label: 'Typewriter',
    family: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    weight: '500' as const,
  },
  rounded: {
    label: 'Rounded',
    family: Platform.select({ ios: 'ui-rounded', default: 'sans-serif-medium' }),
    weight: '700' as const,
  },
} as const;
export type ScriptFontKey = keyof typeof ScriptFonts;

/** Reader colour themes. `bg` is the card tint; the card is translucent glass. */
export const ReaderThemes = {
  night: { label: 'Night', bg: '#0D0820', fg: '#F6F1FF', guide: '#B794FF' },
  lavender: { label: 'Lavender', bg: '#0D0820', fg: '#E2D2FF', guide: '#FFFFFF' },
  paper: { label: 'Paper', bg: '#F6F1FF', fg: '#0D0820', guide: '#6D3BFF' },
  contrast: { label: 'Contrast', bg: '#000000', fg: '#FFF34D', guide: '#FFFFFF' },
} as const;
export type ReaderThemeKey = keyof typeof ReaderThemes;

export const LineSpacing = { tight: 1.2, normal: 1.34, airy: 1.6 } as const;
export type LineSpacingKey = keyof typeof LineSpacing;

/** Turn a #RRGGBB colour into rgba() with the given alpha. */
export function withAlpha(hex: string, a: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
