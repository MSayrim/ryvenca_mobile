import { forwardRef, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useLanguage } from '../i18n';
import { colors, fonts, radius, resolveTextStyle, spacing } from '../theme';
import { Typography } from './Typography';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string | null;
  right?: ReactNode;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField({ label, error, right, style, ...rest }, ref) {
  const [focused, setFocused] = useState(false);
  const { typography } = useLanguage();
  return (
    <View style={styles.wrap}>
      {label ? (
        <Typography variant="smallMedium" style={styles.label}>
          {label}
        </Typography>
      ) : null}
      <View style={[styles.field, focused && styles.focused, !!error && styles.errorBorder]}>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.softBrown}
          accessibilityLabel={label ?? rest.placeholder}
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={resolveTextStyle([styles.input, style], typography)}
        />
        {right}
      </View>
      {error ? (
        <Typography variant="small" color={colors.danger} style={styles.error}>
          {error}
        </Typography>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { color: colors.text },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  focused: { borderColor: colors.softBrown },
  errorBorder: { borderColor: colors.danger },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 12,
    // The focused border is drawn by the field wrapper; hide the browser focus ring in the web preview.
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : null),
  },
  error: { marginTop: 0 },
});
