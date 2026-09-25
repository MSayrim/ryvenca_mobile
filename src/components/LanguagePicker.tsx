import { Check, Languages } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { languageInfo, pickerLanguages, useLanguage, useTranslation, type LanguageCode } from '../i18n';
import { useMetaQuery } from '../hooks/useMeta';
import { useSetLanguage } from '../hooks/useSetLanguage';
import { TOUCH_TARGET, colors, radius, spacing } from '../theme';
import { BottomSheet } from './BottomSheet';
import { Typography } from './Typography';

/**
 * Bottom sheet listing the 16 languages by native name. The list is static (works before `/api/meta`
 * loads); server labels are used when `/api/meta` returns `languages`.
 */
export function LanguageSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const setLanguage = useSetLanguage();
  const meta = useMetaQuery();
  const options = pickerLanguages(meta.data?.languages);

  const choose = (code: LanguageCode) => {
    onClose();
    void setLanguage(code);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('language.choose')}>
      <View style={styles.list} accessibilityRole="radiogroup">
        {options.map((option, index) => {
          const selected = option.code === language;
          return (
            <Pressable
              key={option.code}
              onPress={() => choose(option.code)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={option.nativeName}
              accessibilityLanguage={option.code}
              style={({ pressed }) => [styles.row, index > 0 && styles.divider, pressed && styles.pressed]}
            >
              <Typography variant={selected ? 'bodySemiBold' : 'bodyMedium'} lang={option.code} style={styles.flex}>
                {option.nativeName}
              </Typography>
              {selected ? <Check size={18} color={colors.ink} strokeWidth={2} /> : null}
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

/** Compact pill ("文A English") that opens the language sheet — used on the auth screens. */
export function LanguageButton({ style }: { style?: StyleProp<ViewStyle> }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const name = languageInfo(language).nativeName;
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('language.buttonA11y', { language: name })}
        hitSlop={6}
        style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
      >
        <Languages size={16} color={colors.ink} strokeWidth={1.5} />
        <Typography variant="smallMedium" numberOfLines={1}>
          {name}
        </Typography>
      </Pressable>
      <LanguageSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: TOUCH_TARGET + 6 },
  divider: { borderTopWidth: 1, borderTopColor: colors.divider },
  pressed: { opacity: 0.7 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignSelf: 'flex-end',
  },
});
