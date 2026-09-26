import {
  ChartColumn,
  CircleHelp,
  ExternalLink,
  FileText,
  Heart,
  Languages,
  LifeBuoy,
  LogOut,
  Pencil,
  ShieldCheck,
  Trash2,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { installedAppVersion, installedBuildNumber } from '../../appConfig/buildInfo';
import { useAppConfig } from '../../appConfig/useAppConfig';
import { useCurrentUser, useSession } from '../../auth/SessionProvider';
import {
  AppHeader,
  Chip,
  LanguageSheet,
  OutlineButton,
  Screen,
  SecondaryButton,
  Typography,
  useDirection,
} from '../../components';
import { useMeta } from '../../hooks/useMeta';
import { languageInfo, useLanguage, useTranslation } from '../../i18n';
import type { TabScreenProps } from '../../navigation/types';
import { TOUCH_TARGET, colors, fonts, radius, spacing } from '../../theme';
import { confirm } from '../../utils/confirm';
import { initialOf } from '../../utils/labels';
import { openLink, supportUrl } from '../../utils/openLink';

export function ProfileScreen({ navigation }: TabScreenProps<'Profile'>) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const user = useCurrentUser();
  const { signOut } = useSession();
  const { labels } = useMeta();
  const { links } = useAppConfig();
  const [languageOpen, setLanguageOpen] = useState(false);
  const support = supportUrl(links);
  const legalRows = [
    links.privacyPolicy ? { key: 'privacy', icon: ShieldCheck, label: t('legal.privacy'), url: links.privacyPolicy } : null,
    links.terms ? { key: 'terms', icon: FileText, label: t('legal.terms'), url: links.terms } : null,
    support ? { key: 'support', icon: LifeBuoy, label: t('legal.support'), url: support } : null,
  ].filter((row): row is { key: string; icon: LucideIcon; label: string; url: string } => row !== null);
  const version = installedAppVersion();
  const build = installedBuildNumber();

  const onLogout = async () => {
    const ok = await confirm({ title: t('profile.logout.confirm'), confirmText: t('profile.logout.action') });
    if (ok) await signOut();
  };

  return (
    <Screen>
      <AppHeader
        onPressHanger={() => navigation.navigate('Wardrobe', undefined)}
        onPressSearch={() => navigation.navigate('Wardrobe', { focusSearch: Date.now() })}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identity}>
          <View style={styles.avatar} accessibilityLabel={t('profile.avatarA11y', { name: user.displayName })}>
            <Typography style={styles.avatarText}>{initialOf(user.displayName, language)}</Typography>
          </View>
          <View style={styles.flex}>
            <Typography variant="h1" numberOfLines={1}>
              {user.displayName}
            </Typography>
            <Typography variant="small" numberOfLines={1}>
              {user.email}
            </Typography>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Typography variant="h3">{t('profile.preferences')}</Typography>
            <SecondaryButton label={t('common.edit')} icon={Pencil} size="sm" onPress={() => navigation.navigate('EditPreferences')} />
          </View>
          <View style={styles.prefRow}>
            <Typography variant="eyebrow">{t('profile.wardrobeType')}</Typography>
            <Typography variant="bodyMedium">
              {user.wardrobeType ? labels.wardrobeType(user.wardrobeType) : t('common.notSelected')}
            </Typography>
          </View>
          <View style={styles.prefRow}>
            <Typography variant="eyebrow">{t('profile.style')}</Typography>
            <View style={styles.chips}>
              {user.stylePreferences.length > 0 ? (
                user.stylePreferences.map((s) => <Chip key={s} static size="sm" label={labels.style(s)} />)
              ) : (
                <Typography variant="small">{t('common.notSelected')}</Typography>
              )}
            </View>
          </View>
        </View>

        <View style={styles.links}>
          <LinkRow icon={Heart} label={t('profile.links.favorites')} onPress={() => navigation.navigate('Favorites')} />
          <LinkRow icon={ChartColumn} label={t('profile.links.stats')} onPress={() => navigation.navigate('WardrobeStats')} />
          <LinkRow
            icon={Languages}
            label={t('profile.links.language')}
            value={languageInfo(language).nativeName}
            valueLang={language}
            onPress={() => setLanguageOpen(true)}
          />
          <LinkRow icon={CircleHelp} label={t('howItWorks.title')} onPress={() => navigation.navigate('HowItWorks')} last />
        </View>

        {legalRows.length > 0 ? (
          <View style={styles.section}>
            <Typography variant="eyebrow" style={styles.sectionTitle}>
              {t('profile.help')}
            </Typography>
            <View style={styles.links}>
              {legalRows.map((row, index) => (
                <LinkRow
                  key={row.key}
                  icon={row.icon}
                  label={row.label}
                  external
                  onPress={() => void openLink(row.url)}
                  last={index === legalRows.length - 1}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.bottomActions}>
          <SecondaryButton label={t('profile.logout.action')} icon={LogOut} onPress={() => void onLogout()} fullWidth />
          <OutlineButton
            label={t('profile.deleteAccount.action')}
            icon={Trash2}
            danger
            onPress={() => navigation.navigate('DeleteAccount')}
            fullWidth
          />
        </View>
        {version ? (
          <Typography variant="caption" align="center" color={colors.textMuted}>
            {t('profile.version', { version: build ? `${version} (${build})` : version })}
          </Typography>
        ) : null}
      </ScrollView>
      <LanguageSheet visible={languageOpen} onClose={() => setLanguageOpen(false)} />
    </Screen>
  );
}

function LinkRow({
  icon: Icon,
  label,
  value,
  valueLang,
  onPress,
  last,
  external,
}: {
  icon: LucideIcon;
  label: string;
  /** Opens a web page (shows an external-link icon instead of the chevron). */
  external?: boolean;
  /** Current value shown before the chevron (e.g. the selected language). */
  value?: string;
  valueLang?: string;
  onPress: () => void;
  last?: boolean;
}) {
  const { ForwardChevron } = useDirection();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={external ? 'link' : 'button'}
      accessibilityLabel={value ? `${label}: ${value}` : label}
      style={({ pressed }) => [styles.link, !last && styles.linkDivider, pressed && styles.pressed]}
    >
      <Icon size={20} color={colors.brown} strokeWidth={1.5} />
      <Typography variant="bodyMedium" style={styles.flex}>
        {label}
      </Typography>
      {value ? (
        <Typography variant="small" lang={valueLang} numberOfLines={1}>
          {value}
        </Typography>
      ) : null}
      {external ? (
        <ExternalLink size={16} color={colors.textMuted} strokeWidth={1.5} />
      ) : (
        <ForwardChevron size={18} color={colors.textMuted} strokeWidth={1.5} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxxl, gap: spacing.lg, maxWidth: 720, width: '100%', alignSelf: 'center' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 999,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.surface },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  prefRow: { gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  links: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  link: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: TOUCH_TARGET + 12 },
  linkDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  pressed: { opacity: 0.7 },
  bottomActions: { gap: spacing.sm, marginTop: spacing.xs },
  section: { gap: spacing.xs },
  sectionTitle: { paddingHorizontal: spacing.xxs },
});
