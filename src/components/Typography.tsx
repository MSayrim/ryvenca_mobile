import { Platform, StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { toUpperLocale, useLanguage } from '../i18n';
import { colors, fonts, resolveTextStyle, typeScale, typographyProfile } from '../theme';

export type TextVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodyMedium'
  | 'bodySemiBold'
  | 'small'
  | 'smallMedium'
  | 'caption'
  | 'eyebrow'
  | 'script'
  | 'number';

export interface TypographyProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  align?: TextStyle['textAlign'];
  /** Language of the text when it differs from the UI language (e.g. native names in the language picker). */
  lang?: string;
}

/**
 * All app text goes through here: variant styles + language-aware fonts (system fonts for scripts the
 * brand fonts do not cover, taller line heights for tall scripts; see theme/typography.ts).
 */
export function Typography({ variant = 'body', color, align, lang, style, children, ...rest }: TypographyProps) {
  const ui = useLanguage();
  const language = lang ?? ui.language;
  const typography = lang ? typographyProfile(lang) : ui.typography;
  // Eyebrows are upper-cased in JS with the UI locale (native textTransform would turn Turkish "i" into "I").
  const content = variant === 'eyebrow' && typeof children === 'string' ? toUpperLocale(children, language) : children;
  // Native aligns 'auto' text to the layout direction; react-native-web infers it per string (dir="auto"),
  // which would e.g. left-align Latin words in an RTL layout. Align web text to the layout start instead.
  const webStart = Platform.OS === 'web' && !align ? (ui.isRTL ? WEB_START_RTL : WEB_START_LTR) : null;
  return (
    <Text
      maxFontSizeMultiplier={1.4}
      {...rest}
      style={resolveTextStyle(
        [styles[variant], webStart, color ? { color } : null, align ? { textAlign: align } : null, style],
        typography,
      )}
    >
      {content}
    </Text>
  );
}

const WEB_START_LTR: TextStyle = { textAlign: 'left' };
const WEB_START_RTL: TextStyle = { textAlign: 'right' };

const styles = StyleSheet.create({
  display: { fontFamily: fonts.display, ...typeScale.display, color: colors.ink, letterSpacing: -0.4 },
  h1: { fontFamily: fonts.display, ...typeScale.h1, color: colors.ink, letterSpacing: -0.3 },
  h2: { fontFamily: fonts.display, ...typeScale.h2, color: colors.ink, letterSpacing: -0.2 },
  h3: { fontFamily: fonts.display, ...typeScale.h3, color: colors.ink },
  body: { fontFamily: fonts.body, ...typeScale.body, color: colors.text },
  bodyMedium: { fontFamily: fonts.bodyMedium, ...typeScale.body, color: colors.text },
  bodySemiBold: { fontFamily: fonts.bodySemiBold, ...typeScale.body, color: colors.text },
  small: { fontFamily: fonts.body, ...typeScale.small, color: colors.textSecondary },
  smallMedium: { fontFamily: fonts.bodyMedium, ...typeScale.small, color: colors.text },
  caption: { fontFamily: fonts.bodyMedium, ...typeScale.caption, color: colors.textMuted },
  eyebrow: {
    fontFamily: fonts.bodySemiBold,
    ...typeScale.caption,
    color: colors.softBrown,
    letterSpacing: 1.6,
  },
  script: { fontFamily: fonts.script, fontSize: 21, lineHeight: 24, color: colors.softBrown },
  number: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30, color: colors.ink },
});
