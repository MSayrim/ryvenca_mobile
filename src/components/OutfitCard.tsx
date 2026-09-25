import { Bookmark, BookmarkCheck, Heart } from 'lucide-react-native';
import { Pressable, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';

import type { Outfit } from '../api/types';
import { useToggleSaveOutfit } from '../hooks/mutations';
import { useFormatters, useTranslation } from '../i18n';
import { clampScore } from '../utils/labels';
import { colors, radius, shadow, spacing } from '../theme';
import { PrimaryButton, SecondaryButton } from './Buttons';
import { OutfitCollage } from './OutfitCollage';
import { ScorePill } from './ScorePill';
import { Typography } from './Typography';
import { useDirection } from './useDirection';

export interface OutfitCardProps {
  outfit: Outfit;
  onPress: () => void;
  /** compact: home carousel card · editorial: large Suggestions card. */
  variant?: 'compact' | 'editorial';
  width?: number;
  style?: StyleProp<ViewStyle>;
}

export function OutfitCard({ outfit, onPress, variant = 'compact', width, style }: OutfitCardProps) {
  const { t } = useTranslation();
  const format = useFormatters();
  const toggle = useToggleSaveOutfit();
  const busy = toggle.isPending;
  const onToggleSave = () => {
    if (!busy) toggle.mutate(outfit);
  };

  if (variant === 'editorial') {
    return <EditorialCard outfit={outfit} onPress={onPress} onToggleSave={onToggleSave} busy={busy} style={style} />;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('outfit.cardA11y', {
        title: outfit.title,
        score: t('outfit.scorePill', { percent: format.percent(clampScore(outfit.score)) }),
      })}
      style={({ pressed }) => [styles.compact, width ? { width } : null, pressed && styles.pressed, style]}
    >
      <View>
        <OutfitCollage items={outfit.items} heightRatio={1.05} />
        <View style={styles.pillOverlay} pointerEvents="none">
          <ScorePill score={outfit.score} size="sm" />
        </View>
        <Pressable
          onPress={onToggleSave}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={outfit.saved ? t('outfit.unsave') : t('outfit.save')}
          accessibilityState={{ selected: outfit.saved, busy }}
          style={styles.heart}
        >
          <Heart
            size={18}
            strokeWidth={1.5}
            color={outfit.saved ? colors.danger : colors.ink}
            fill={outfit.saved ? colors.danger : 'none'}
          />
        </Pressable>
      </View>
      <View style={styles.compactBody}>
        <Typography variant="h3" numberOfLines={1}>
          {outfit.title}
        </Typography>
        <Typography variant="small" numberOfLines={2}>
          {outfit.description}
        </Typography>
        <SecondaryButton
          size="sm"
          label={outfit.saved ? t('common.saved') : t('outfit.saveThis')}
          icon={outfit.saved ? BookmarkCheck : Bookmark}
          onPress={onToggleSave}
          loading={busy}
          style={styles.saveButton}
        />
      </View>
    </Pressable>
  );
}

function EditorialCard({
  outfit,
  onPress,
  onToggleSave,
  busy,
  style,
}: {
  outfit: Outfit;
  onPress: () => void;
  onToggleSave: () => void;
  busy: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTranslation();
  const { ForwardArrow } = useDirection();
  const { width } = useWindowDimensions();
  const sideBySide = width >= 640;
  return (
    <View style={[styles.editorial, sideBySide && styles.editorialRow, style]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={t('outfit.collageA11y', { title: outfit.title })}
        style={sideBySide ? styles.editorialCollageSide : undefined}
      >
        <OutfitCollage items={outfit.items} heightRatio={sideBySide ? 1.15 : 1} />
      </Pressable>
      <View style={[styles.editorialText, sideBySide && styles.editorialTextSide]}>
        <View style={styles.metaRow}>
          <ScorePill score={outfit.score} />
          {outfit.styleLabel ? (
            <Typography variant="eyebrow" color={colors.textMuted}>
              {outfit.styleLabel}
            </Typography>
          ) : null}
        </View>
        <Typography variant="h1" style={styles.editorialTitle}>
          {outfit.title}
        </Typography>
        <Typography variant="body" color={colors.textSecondary}>
          {outfit.description}
        </Typography>
        <View style={styles.actions}>
          <PrimaryButton label={t('outfit.viewDetail')} iconEnd={ForwardArrow} size="sm" onPress={onPress} style={styles.flex} />
          <SecondaryButton
            label={outfit.saved ? t('common.saved') : t('common.save')}
            icon={outfit.saved ? BookmarkCheck : Bookmark}
            size="sm"
            onPress={onToggleSave}
            loading={busy}
            style={styles.flex}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compact: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  pressed: { opacity: 0.92 },
  heart: {
    position: 'absolute',
    top: 10,
    end: 10,
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: 'rgba(255,253,249,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactBody: { paddingHorizontal: spacing.xs, paddingTop: spacing.sm, paddingBottom: spacing.xxs, gap: 6 },
  pillOverlay: { position: 'absolute', start: 10, bottom: 10 },
  flex: { flex: 1 },
  saveButton: { marginTop: spacing.xxs },
  editorial: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  editorialRow: { flexDirection: 'row-reverse', gap: spacing.md },
  editorialCollageSide: { flex: 1 },
  editorialText: { paddingHorizontal: spacing.xs, paddingTop: spacing.md, paddingBottom: spacing.xs, gap: spacing.xs },
  editorialTextSide: { flex: 1, justifyContent: 'center' },
  editorialTitle: { marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
});
