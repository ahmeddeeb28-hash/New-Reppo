import { Platform } from 'react-native';

/** Glance colour tokens — cinematic dark, one amber accent. */
export const C = {
  ink: '#0B0B0C',
  black: '#000000',
  graphite: '#1C1C1F',
  line: '#2C2C30',
  fog: '#A1A1A8',
  paper: '#F5F5F7',
  tally: '#FFB020',
  tallySoft: 'rgba(255,176,32,0.18)',
  rec: '#FF453A',
  ok: '#7CFFB2',
} as const;

export const DisplayFont = 'SpaceGrotesk_700Bold';
export const DisplayFontMedium = 'SpaceGrotesk_600SemiBold';

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

/** Reader colour themes. */
export const ReaderThemes = {
  night: { label: 'Night', bg: '#000000', fg: '#F5F5F7', guide: C.tally },
  amber: { label: 'Amber', bg: '#000000', fg: '#FFC75A', guide: '#F5F5F7' },
  paper: { label: 'Paper', bg: '#F5F5F7', fg: '#0B0B0C', guide: C.tally },
  contrast: { label: 'Contrast', bg: '#000000', fg: '#FFF34D', guide: '#FFFFFF' },
} as const;
export type ReaderThemeKey = keyof typeof ReaderThemes;

export const LineSpacing = { tight: 1.2, normal: 1.34, airy: 1.6 } as const;
export type LineSpacingKey = keyof typeof LineSpacing;
