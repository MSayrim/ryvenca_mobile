import { ArrowRight, ChevronLeft, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorMessage } from '../../api';
import type { StylePreference, WardrobeType } from '../../api/types';
import { useSession, type LandingTab } from '../../auth/SessionProvider';
import {
  ErrorState,
  HowItWorksSteps,
  IconButton,
  PrimaryButton,
  ProgressDots,
  SecondaryButton,
  Skeleton,
  StylePicker,
  TextLink,
  Typography,
  WardrobeTypePicker,
  Wordmark,
} from '../../components';
import { useUpdateMe } from '../../hooks/mutations';
import { useMeta } from '../../hooks/useMeta';
import { colors, radius, spacing } from '../../theme';
import { toggleInList } from '../../utils/labels';

const STEP_COUNT = 3;

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { user, setLandingTab, signOut } = useSession();
  const { meta, isLoading, isError, refetch } = useMeta();
  const updateMe = useUpdateMe();

  const [step, setStep] = useState(0);
  const [wardrobeType, setWardrobeType] = useState<WardrobeType | null>(user?.wardrobeType ?? null);
  const [styles_, setStyles] = useState<StylePreference[]>(user?.stylePreferences ?? []);
  const [pending, setPending] = useState<LandingTab | null>(null);

  const finish = (landing: LandingTab) => {
    setPending(landing);
    setLandingTab(landing);
    updateMe.mutate(
      { wardrobeType, stylePreferences: styles_, onboardingCompleted: true },
      { onSettled: () => setPending(null) },
    );
  };

  const canContinue = step === 0 ? wardrobeType !== null : step === 1 ? styles_.length > 0 : true;

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.xs }]}>
      <View style={styles.topBar}>
        <View style={styles.side}>
          {step > 0 ? (
            <IconButton icon={ChevronLeft} iconSize={26} accessibilityLabel="Geri" onPress={() => setStep((s) => s - 1)} />
          ) : null}
        </View>
        <Wordmark size={17} />
        <View style={[styles.side, styles.sideRight]}>
          <TextLink label="Çıkış" color={colors.textSecondary} onPress={() => void signOut()} />
        </View>
      </View>
      <View style={styles.dots}>
        <ProgressDots count={STEP_COUNT} index={step} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.gap}>
            <Skeleton height={34} width="80%" />
            <Skeleton height={92} radius={radius.lg} />
            <Skeleton height={92} radius={radius.lg} />
            <Skeleton height={92} radius={radius.lg} />
          </View>
        ) : isError || !meta ? (
          <ErrorState error={null} onRetry={refetch} />
        ) : step === 0 ? (
          <View style={styles.gap}>
            <Typography variant="eyebrow">{`Merhaba ${user?.displayName ?? ''}`.trim()}</Typography>
            <Typography variant="display">Dolabını kime göre düzenleyelim?</Typography>
            <Typography variant="body" color={colors.textSecondary}>
              Kategoriler ve öneriler buna göre şekillenir. Sonra profilinden değiştirebilirsin.
            </Typography>
            <View style={styles.block}>
              <WardrobeTypePicker options={meta.wardrobeTypes} value={wardrobeType} onChange={setWardrobeType} />
            </View>
          </View>
        ) : step === 1 ? (
          <View style={styles.gap}>
            <Typography variant="display">Stilini nasıl tanımlarsın?</Typography>
            <Typography variant="body" color={colors.textSecondary}>
              Birden fazla seçebilirsin. En az bir stil seç.
            </Typography>
            <View style={styles.block}>
              <StylePicker options={meta.styles} value={styles_} onToggle={(c) => setStyles((l) => toggleInList(l, c))} />
            </View>
          </View>
        ) : (
          <View style={styles.gap}>
            <Typography variant="display">Nasıl çalışır?</Typography>
            <Typography variant="script">Stüdyo çekimi gerekmez. Kendi fotoğrafın yeterli! ♡</Typography>
            <View style={styles.block}>
              <HowItWorksSteps />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        {updateMe.isError ? (
          <Typography variant="small" color={colors.danger} align="center" accessibilityRole="alert">
            {errorMessage(updateMe.error)}
          </Typography>
        ) : null}
        {step < STEP_COUNT - 1 ? (
          <PrimaryButton
            label="Devam Et"
            iconRight={ArrowRight}
            disabled={!canContinue}
            onPress={() => setStep((s) => s + 1)}
            fullWidth
          />
        ) : (
          <>
            <PrimaryButton
              label="İlk parçanı ekle"
              icon={Plus}
              onPress={() => finish('Upload')}
              loading={pending === 'Upload'}
              disabled={pending !== null}
              fullWidth
            />
            <SecondaryButton
              label="Daha sonra"
              onPress={() => finish('Home')}
              loading={pending === 'Home'}
              disabled={pending !== null}
              fullWidth
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xs },
  side: { width: 80, flexDirection: 'row' },
  sideRight: { justifyContent: 'flex-end', paddingRight: spacing.xs },
  dots: { alignItems: 'center', paddingVertical: spacing.sm },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, maxWidth: 560, width: '100%', alignSelf: 'center' },
  gap: { gap: spacing.sm },
  block: { marginTop: spacing.md },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.background,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
});
