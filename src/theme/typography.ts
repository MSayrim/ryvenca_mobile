import { Platform, StyleSheet, type StyleProp, type TextStyle } from 'react-native';

import { fonts } from './tokens';

/**
 * Language-aware typography.
 *
 * The brand fonts only cover some scripts: Fraunces (display) = Latin + Vietnamese, Inter (body) =
 * Latin + Cyrillic + Vietnamese, Caveat (script accents) = Latin + Cyrillic. For other scripts we switch
 * to the platform's system fonts (which ship Noto/Hiragino/PingFang/… glyphs) so nothing renders as
 * tofu, keep the intended weight via `fontWeight`, raise too-tight line heights for tall scripts
 * (Devanagari, Bengali, Arabic, Nastaliq Urdu, CJK) and drop letter-spacing that would break joined
 * scripts. Latin languages keep the exact original styles.
 */

type DisplayFont = 'fraunces' | 'serif' | 'system';
type BodyFont = 'inter' | 'system';
type ScriptFont = 'caveat' | 'body';

export interface TypographyProfile {
  display: DisplayFont;
  body: BodyFont;
  /** Caveat accent, or the body font for scripts Caveat does not cover. */
  script: ScriptFont;
  /** Minimum lineHeight / fontSize ratio (0 = keep design line heights). */
  minLineHeight: number;
  /** Letter-spacing breaks Arabic joining and looks wrong on CJK/Indic scripts. */
  letterSpacing: boolean;
}

const LATIN: TypographyProfile = { display: 'fraunces', body: 'inter', script: 'caveat', minLineHeight: 0, letterSpacing: true };

const PROFILES: Record<string, TypographyProfile> = {
  tr: LATIN,
  en: LATIN,
  es: LATIN,
  fr: LATIN,
  pt: LATIN,
  de: LATIN,
  id: LATIN,
  // Stacked Vietnamese diacritics need a little more room; Caveat has no Vietnamese glyphs.
  vi: { display: 'fraunces', body: 'inter', script: 'body', minLineHeight: 1.3, letterSpacing: true },
  // Fraunces has no Cyrillic → platform serif keeps the editorial look; Inter and Caveat cover Cyrillic.
  ru: { display: 'serif', body: 'inter', script: 'caveat', minLineHeight: 0, letterSpacing: true },
  zh: { display: 'system', body: 'system', script: 'body', minLineHeight: 1.4, letterSpacing: false },
  ja: { display: 'system', body: 'system', script: 'body', minLineHeight: 1.4, letterSpacing: false },
  ko: { display: 'system', body: 'system', script: 'body', minLineHeight: 1.4, letterSpacing: false },
  hi: { display: 'system', body: 'system', script: 'body', minLineHeight: 1.55, letterSpacing: false },
  bn: { display: 'system', body: 'system', script: 'body', minLineHeight: 1.55, letterSpacing: false },
  ar: { display: 'system', body: 'system', script: 'body', minLineHeight: 1.55, letterSpacing: false },
  // Nastaliq (iOS default for Urdu) is very tall.
  ur: { display: 'system', body: 'system', script: 'body', minLineHeight: 1.85, letterSpacing: false },
};

export function typographyProfile(lang: string): TypographyProfile {
  return PROFILES[lang] ?? LATIN;
}

export function isDefaultProfile(profile: TypographyProfile): boolean {
  return profile === LATIN;
}

type Role = { kind: 'display' | 'body' | 'script'; weight: TextStyle['fontWeight'] };

const ROLES: Record<string, Role> = {
  [fonts.display]: { kind: 'display', weight: '500' },
  [fonts.displayRegular]: { kind: 'display', weight: '400' },
  [fonts.displaySemiBold]: { kind: 'display', weight: '600' },
  [fonts.body]: { kind: 'body', weight: '400' },
  [fonts.bodyMedium]: { kind: 'body', weight: '500' },
  [fonts.bodySemiBold]: { kind: 'body', weight: '600' },
  [fonts.script]: { kind: 'script', weight: '500' },
};

const PLATFORM_SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' });

/** Maps a brand font family to the family/weight to use for the given profile. */
function bodyFamily(weight: TextStyle['fontWeight'], profile: TypographyProfile): Pick<TextStyle, 'fontFamily' | 'fontWeight'> {
  if (profile.body === 'inter') {
    const family = weight === '600' ? fonts.bodySemiBold : weight === '500' ? fonts.bodyMedium : fonts.body;
    return { fontFamily: family };
  }
  return { fontFamily: undefined, fontWeight: weight };
}

/** Size factor when a Caveat accent falls back to the body font (Caveat runs small). */
const SCRIPT_FALLBACK_SCALE = 0.76;

/**
 * Returns a flattened text style adapted to the language profile. For the Latin profile the input is
 * returned untouched (no flattening), so existing screens render exactly as designed.
 */
export function resolveTextStyle(style: StyleProp<TextStyle>, profile: TypographyProfile): StyleProp<TextStyle> {
  if (isDefaultProfile(profile)) return style;
  const flat: TextStyle = { ...(StyleSheet.flatten(style) ?? {}) };
  const role = typeof flat.fontFamily === 'string' ? ROLES[flat.fontFamily] : undefined;

  if (role) {
    if (role.kind === 'display') {
      if (profile.display === 'serif') {
        flat.fontFamily = PLATFORM_SERIF;
        flat.fontWeight = role.weight;
      } else if (profile.display === 'system') {
        flat.fontFamily = undefined;
        flat.fontWeight = role.weight === '400' ? '500' : '600';
      }
    } else if (role.kind === 'body') {
      Object.assign(flat, bodyFamily(role.weight, profile));
    } else if (profile.script === 'body') {
      Object.assign(flat, bodyFamily('500', profile));
      if (typeof flat.fontSize === 'number') flat.fontSize = Math.round(flat.fontSize * SCRIPT_FALLBACK_SCALE);
      if (typeof flat.lineHeight === 'number') flat.lineHeight = Math.round(flat.lineHeight * SCRIPT_FALLBACK_SCALE * 1.15);
    }
  }

  if (!profile.letterSpacing && flat.letterSpacing) flat.letterSpacing = 0;
  if (profile.minLineHeight > 0 && typeof flat.fontSize === 'number') {
    // Headlines need proportionally less extra leading than running text.
    const ratio = flat.fontSize >= 24 ? 1 + (profile.minLineHeight - 1) * 0.65 : profile.minLineHeight;
    const min = Math.ceil(flat.fontSize * ratio);
    if (typeof flat.lineHeight !== 'number' || flat.lineHeight < min) flat.lineHeight = min;
  }
  return flat;
}
