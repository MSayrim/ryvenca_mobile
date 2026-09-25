import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { colors, fonts, typeScale } from '../theme';

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
}

export function Typography({ variant = 'body', color, align, style, children, ...rest }: TypographyProps) {
  // Eyebrows are upper-cased in JS with the Turkish locale (CSS/native textTransform would turn "i" into "I").
  const content = variant === 'eyebrow' && typeof children === 'string' ? children.toLocaleUpperCase('tr-TR') : children;
  return (
    <Text
      maxFontSizeMultiplier={1.4}
      {...rest}
      style={[styles[variant], color ? { color } : null, align ? { textAlign: align } : null, style]}
    >
      {content}
    </Text>
  );
}

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
