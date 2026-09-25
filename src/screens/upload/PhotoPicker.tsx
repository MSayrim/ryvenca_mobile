import { Camera, ImagePlus, RefreshCw } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { GarmentPhoto, HangerIcon, OutlineButton, PrimaryButton, SecondaryButton, Typography } from '../../components';
import { useLanguage, useTranslation } from '../../i18n';
import { colors, radius, spacing } from '../../theme';

export type UploadStatus = 'idle' | 'preparing' | 'uploading' | 'done' | 'error';

/** Photo card: 4:5 preview + camera / gallery buttons + analyzing shimmer. */
export function PhotoPicker({
  previewUri,
  status,
  errorText,
  onCamera,
  onLibrary,
  onRetry,
}: {
  previewUri: string | null;
  status: UploadStatus;
  errorText: string | null;
  onCamera: () => void;
  onLibrary: () => void;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();
  const busy = status === 'preparing' || status === 'uploading';
  return (
    <View style={styles.card}>
      <View style={styles.previewWrap}>
        {previewUri ? (
          <View>
            <GarmentPhoto uri={previewUri} radius={radius.lg} priority="high" accessibilityLabel={t('upload.photo.selectedA11y')} />
            {busy ? (
              <AnalyzingOverlay label={status === 'preparing' ? t('upload.photo.preparing') : t('upload.photo.analyzing')} />
            ) : null}
          </View>
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.placeholderIcon}>
              <HangerIcon size={40} color={colors.softBrown} strokeWidth={1.3} />
            </View>
            <Typography variant="h3" align="center">
              {t('upload.photo.addTitle')}
            </Typography>
            <Typography variant="small" align="center" style={styles.helper}>
              {t('upload.photo.helper')}
            </Typography>
          </View>
        )}
      </View>

      {status === 'error' && errorText ? (
        <View style={styles.errorRow} accessibilityRole="alert">
          <Typography variant="small" color={colors.danger} style={styles.flex}>
            {errorText}
          </Typography>
          {onRetry ? <OutlineButton label={t('common.retry')} icon={RefreshCw} size="sm" onPress={onRetry} /> : null}
        </View>
      ) : null}

      <View style={styles.buttons}>
        <PrimaryButton label={t('upload.photo.camera')} icon={Camera} onPress={onCamera} disabled={busy} style={styles.flex} size="sm" />
        <SecondaryButton label={t('upload.photo.library')} icon={ImagePlus} onPress={onLibrary} disabled={busy} style={styles.flex} size="sm" />
      </View>
      <Typography variant="script" align="center">
        {t('accents.noStudioNeeded')}
      </Typography>
    </View>
  );
}

function AnalyzingOverlay({ label }: { label: string }) {
  const { isRTL } = useLanguage();
  const [x] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(x, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [x]);
  // The shimmer sweeps in the reading direction.
  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: isRTL ? [420, -260] : [-260, 420] });
  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]} accessibilityLiveRegion="polite" accessibilityLabel={label}>
      <Animated.View style={[styles.shimmer, { transform: [{ translateX }, { skewX: '-18deg' }] }]} />
      <View style={styles.overlayLabel}>
        <Typography variant="smallMedium" color={colors.ink}>
          {label}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  previewWrap: { width: '100%', maxWidth: 420, alignSelf: 'center' },
  placeholder: {
    aspectRatio: 4 / 5,
    borderRadius: radius.lg,
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.xs,
  },
  placeholderIcon: {
    width: 76,
    height: 76,
    borderRadius: 999,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  helper: { maxWidth: 280 },
  buttons: { flexDirection: 'row', gap: spacing.xs },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.xxs },
  overlay: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: 'rgba(250,247,242,0.35)', justifyContent: 'flex-end' },
  shimmer: { position: 'absolute', top: -40, bottom: -40, width: 120, backgroundColor: 'rgba(255,253,249,0.55)' },
  overlayLabel: {
    alignSelf: 'center',
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255,253,249,0.92)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
});
