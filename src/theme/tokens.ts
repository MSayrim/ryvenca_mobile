/**
 * RYVENCA design tokens — names and values follow docs/PRODUCT_SPEC.md exactly.
 */
export const colors = {
  background: '#FAF7F2',
  surface: '#FFFDF9',
  surfaceAlt: '#F2EDE5',
  cream: '#EFE7DB',
  beige: '#D9CBB6',
  sand: '#C4B196',
  softBrown: '#8B6F55',
  brown: '#5C4433',
  ink: '#2A201B',
  text: '#231B16',
  textSecondary: '#6F655C',
  textMuted: '#9A9087',
  border: '#E7DFD3',
  divider: '#EEE8DF',
  success: '#3F5A3A',
  successBg: '#E4EADF',
  danger: '#A4453A',
  overlay: 'rgba(42,32,27,0.55)',
  white: '#FFFFFF',
  /** Unified "warm grade" laid over every garment photo. */
  warmGrade: 'rgba(139,111,85,0.06)',
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40. */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

/** Font family names as registered by `useFonts` (see theme/fonts.ts). */
export const fonts = {
  display: 'Fraunces_500Medium',
  displayRegular: 'Fraunces_400Regular',
  displaySemiBold: 'Fraunces_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  script: 'Caveat_500Medium',
} as const;

export const typeScale = {
  display: { fontSize: 34, lineHeight: 38 },
  h1: { fontSize: 28, lineHeight: 33 },
  h2: { fontSize: 22, lineHeight: 27 },
  h3: { fontSize: 18, lineHeight: 23 },
  body: { fontSize: 15, lineHeight: 21 },
  small: { fontSize: 13, lineHeight: 18 },
  caption: { fontSize: 11, lineHeight: 14 },
} as const;

export const shadow = {
  soft: {
    shadowColor: '#2A201B',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  lifted: {
    shadowColor: '#2A201B',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;

/** Minimum touch target (accessibility). */
export const TOUCH_TARGET = 44;

export const theme = { colors, radius, spacing, fonts, typeScale, shadow } as const;
export type Theme = typeof theme;
