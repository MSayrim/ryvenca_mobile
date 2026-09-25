import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorMessage } from '../../api';
import type { StylePreference, WardrobeType } from '../../api/types';
import { useCurrentUser } from '../../auth/SessionProvider';
import {
  ErrorState,
  PrimaryButton,
  Screen,
  ScreenHeader,
  Skeleton,
  StylePicker,
  TextField,
  Typography,
  WardrobeTypePicker,
  useToast,
} from '../../components';
import { useUpdateMe } from '../../hooks/mutations';
import { useMeta } from '../../hooks/useMeta';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { toggleInList } from '../../utils/labels';

/** Edit wardrobe type + style preferences (same controls as onboarding) and display name. */
export function EditPreferencesScreen({ navigation }: RootScreenProps<'EditPreferences'>) {
  const insets = useSafeAreaInsets();
  const user = useCurrentUser();
  const { meta, isLoading, isError, refetch } = useMeta();
  const updateMe = useUpdateMe();
  const toast = useToast();

  const [displayName, setDisplayName] = useState(user.displayName);
  const [wardrobeType, setWardrobeType] = useState<WardrobeType | null>(user.wardrobeType);
  const [stylePrefs, setStylePrefs] = useState<StylePreference[]>(user.stylePreferences);

  const canSave = !!displayName.trim() && !!wardrobeType && stylePrefs.length > 0;

  const onSave = () =>
    updateMe.mutate(
      { displayName: displayName.trim(), wardrobeType, stylePreferences: stylePrefs },
      {
        onSuccess: () => {
          toast.show('Tercihlerin güncellendi');
          navigation.goBack();
        },
      },
    );

  return (
    <Screen>
      <ScreenHeader title="Tercihlerim" onBack={() => navigation.goBack()} />
      {isLoading ? (
        <View style={styles.content}>
          <Skeleton height={92} />
          <Skeleton height={92} />
        </View>
      ) : isError || !meta ? (
        <ErrorState error={null} onRetry={refetch} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextField label="Adın" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" />
          <View style={styles.group}>
            <Typography variant="h2">Dolabını kime göre düzenleyelim?</Typography>
            <WardrobeTypePicker options={meta.wardrobeTypes} value={wardrobeType} onChange={setWardrobeType} />
          </View>
          <View style={styles.group}>
            <Typography variant="h2">Stilini nasıl tanımlarsın?</Typography>
            <Typography variant="small">En az bir stil seç.</Typography>
            <StylePicker options={meta.styles} value={stylePrefs} onToggle={(c) => setStylePrefs((l) => toggleInList(l, c))} />
          </View>
        </ScrollView>
      )}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        {updateMe.isError ? (
          <Typography variant="small" color={colors.danger} align="center">
            {errorMessage(updateMe.error)}
          </Typography>
        ) : null}
        <PrimaryButton label="Kaydet" onPress={onSave} disabled={!canSave} loading={updateMe.isPending} fullWidth />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.xl, paddingBottom: spacing.xxl, maxWidth: 720, width: '100%', alignSelf: 'center' },
  group: { gap: spacing.sm },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.background,
  },
});
