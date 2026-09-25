import { ChartColumn, ChevronRight, CircleHelp, Heart, LogOut, Pencil, Trash2, type LucideIcon } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { errorMessage } from '../../api';
import { useCurrentUser, useSession } from '../../auth/SessionProvider';
import { AppHeader, Chip, OutlineButton, Screen, SecondaryButton, Typography } from '../../components';
import { useDeleteAccount } from '../../hooks/mutations';
import { useMeta } from '../../hooks/useMeta';
import type { TabScreenProps } from '../../navigation/types';
import { TOUCH_TARGET, colors, fonts, radius, spacing } from '../../theme';
import { confirm, notify } from '../../utils/confirm';
import { initialOf } from '../../utils/labels';

export function ProfileScreen({ navigation }: TabScreenProps<'Profile'>) {
  const user = useCurrentUser();
  const { signOut } = useSession();
  const { labels } = useMeta();
  const deleteAccount = useDeleteAccount();

  const onLogout = async () => {
    const ok = await confirm({ title: 'Çıkış yapmak istiyor musun?', confirmText: 'Çıkış Yap' });
    if (ok) await signOut();
  };

  const onDelete = async () => {
    const ok = await confirm({
      title: 'Hesabını silmek istediğine emin misin?',
      message: 'Hesabın, dolabındaki tüm parçalar, fotoğraflar ve kayıtlı kombinlerin kalıcı olarak silinecek. Bu işlem geri alınamaz.',
      confirmText: 'Hesabı Sil',
      destructive: true,
    });
    if (!ok) return;
    deleteAccount.mutate(undefined, { onError: (e) => notify('Hesap silinemedi', errorMessage(e)) });
  };

  return (
    <Screen>
      <AppHeader
        onPressHanger={() => navigation.navigate('Wardrobe', undefined)}
        onPressSearch={() => navigation.navigate('Wardrobe', { focusSearch: Date.now() })}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identity}>
          <View style={styles.avatar} accessibilityLabel={`${user.displayName} profil resmi`}>
            <Typography style={styles.avatarText}>{initialOf(user.displayName)}</Typography>
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
            <Typography variant="h3">Tercihlerim</Typography>
            <SecondaryButton label="Düzenle" icon={Pencil} size="sm" onPress={() => navigation.navigate('EditPreferences')} />
          </View>
          <View style={styles.prefRow}>
            <Typography variant="eyebrow">Dolap</Typography>
            <Typography variant="bodyMedium">{user.wardrobeType ? labels.wardrobeType(user.wardrobeType) : 'Seçilmedi'}</Typography>
          </View>
          <View style={styles.prefRow}>
            <Typography variant="eyebrow">Stil</Typography>
            <View style={styles.chips}>
              {user.stylePreferences.length > 0 ? (
                user.stylePreferences.map((s) => <Chip key={s} static size="sm" label={labels.style(s)} />)
              ) : (
                <Typography variant="small">Seçilmedi</Typography>
              )}
            </View>
          </View>
        </View>

        <View style={styles.links}>
          <LinkRow icon={Heart} label="Favorilerim" onPress={() => navigation.navigate('Favorites')} />
          <LinkRow icon={ChartColumn} label="Dolap istatistikleri" onPress={() => navigation.navigate('WardrobeStats')} />
          <LinkRow icon={CircleHelp} label="Nasıl çalışır?" onPress={() => navigation.navigate('HowItWorks')} last />
        </View>

        <View style={styles.bottomActions}>
          <SecondaryButton label="Çıkış Yap" icon={LogOut} onPress={() => void onLogout()} fullWidth />
          <OutlineButton
            label="Hesabı Sil"
            icon={Trash2}
            danger
            onPress={() => void onDelete()}
            loading={deleteAccount.isPending}
            fullWidth
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function LinkRow({ icon: Icon, label, onPress, last }: { icon: LucideIcon; label: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.link, !last && styles.linkDivider, pressed && styles.pressed]}
    >
      <Icon size={20} color={colors.brown} strokeWidth={1.5} />
      <Typography variant="bodyMedium" style={styles.flex}>
        {label}
      </Typography>
      <ChevronRight size={18} color={colors.textMuted} strokeWidth={1.5} />
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
});
