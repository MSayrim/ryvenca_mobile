import { Fragment } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { AppLinks } from '../api/types';
import { useTranslation } from '../i18n';
import { colors, spacing } from '../theme';
import { openLink, supportUrl } from '../utils/openLink';
import { Typography } from './Typography';

/** "Terms of Use · Privacy Policy · Support" — only the links the server provides (store review). */
export function LegalLinks({ links, style }: { links: AppLinks; style?: StyleProp<ViewStyle> }) {
  const { t } = useTranslation();
  const support = supportUrl(links);
  const items = [
    links.terms ? { key: 'terms', label: t('legal.terms'), url: links.terms } : null,
    links.privacyPolicy ? { key: 'privacy', label: t('legal.privacy'), url: links.privacyPolicy } : null,
    support ? { key: 'support', label: t('legal.support'), url: support } : null,
  ].filter((item): item is { key: string; label: string; url: string } => item !== null);

  if (items.length === 0) return null;

  return (
    <View style={[styles.row, style]}>
      {items.map((item, index) => (
        <Fragment key={item.key}>
          {index > 0 ? (
            <Typography variant="small" color={colors.textMuted} importantForAccessibility="no">
              ·
            </Typography>
          ) : null}
          <Typography
            variant="smallMedium"
            color={colors.textSecondary}
            style={styles.link}
            accessibilityRole="link"
            onPress={() => void openLink(item.url)}
            suppressHighlighting
          >
            {item.label}
          </Typography>
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: spacing.xs,
    rowGap: spacing.xxs,
  },
  link: { textDecorationLine: 'underline', paddingVertical: spacing.xxs },
});
