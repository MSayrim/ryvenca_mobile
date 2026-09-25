import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import type { ColorName, Occasion, Season } from '../../api/types';
import { BottomSheet, Chip, ColorSwatch, PrimaryButton, SecondaryButton, Typography } from '../../components';
import { useMeta } from '../../hooks/useMeta';
import { useTranslation } from '../../i18n';
import { colors, spacing } from '../../theme';
import { toggleInList } from '../../utils/labels';

export interface SheetFilters {
  colors: ColorName[];
  seasons: Season[];
  occasions: Occasion[];
  favoritesOnly: boolean;
}

export const EMPTY_SHEET_FILTERS: SheetFilters = { colors: [], seasons: [], occasions: [], favoritesOnly: false };

export function countSheetFilters(f: SheetFilters): number {
  return f.colors.length + f.seasons.length + f.occasions.length + (f.favoritesOnly ? 1 : 0);
}

/** Filter sheet: color swatches, season, occasion, "favorites only". */
export function WardrobeFilterSheet({
  visible,
  initial,
  onClose,
  onApply,
}: {
  visible: boolean;
  initial: SheetFilters;
  onClose: () => void;
  onApply: (filters: SheetFilters) => void;
}) {
  const { t } = useTranslation();
  const { meta } = useMeta();
  const [draft, setDraft] = useState<SheetFilters>(initial);

  // Reset the draft each time the sheet opens.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft(initial);
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t('wardrobe.filterSheet.title')}
      footer={
        <>
          <SecondaryButton label={t('wardrobe.filterSheet.clear')} onPress={() => setDraft(EMPTY_SHEET_FILTERS)} style={styles.flex} />
          <PrimaryButton label={t('wardrobe.filterSheet.apply')} onPress={() => onApply(draft)} style={styles.flex} />
        </>
      }
    >
      <View style={styles.group}>
        <Typography variant="eyebrow">{t('wardrobe.filterSheet.color')}</Typography>
        <View style={styles.swatches}>
          {(meta?.colors ?? []).map((c) => (
            <ColorSwatch
              key={c.code}
              hex={c.hex}
              label={c.label}
              size={30}
              selected={draft.colors.includes(c.code)}
              onPress={() => setDraft((d) => ({ ...d, colors: toggleInList(d.colors, c.code) }))}
            />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <Typography variant="eyebrow">{t('wardrobe.filterSheet.season')}</Typography>
        <View style={styles.chips}>
          {(meta?.seasons ?? []).map((s) => (
            <Chip
              key={s.code}
              label={s.label}
              selected={draft.seasons.includes(s.code)}
              onPress={() => setDraft((d) => ({ ...d, seasons: toggleInList(d.seasons, s.code) }))}
            />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <Typography variant="eyebrow">{t('wardrobe.filterSheet.occasion')}</Typography>
        <View style={styles.chips}>
          {(meta?.occasions ?? []).map((o) => (
            <Chip
              key={o.code}
              label={o.label}
              selected={draft.occasions.includes(o.code)}
              onPress={() => setDraft((d) => ({ ...d, occasions: toggleInList(d.occasions, o.code) }))}
            />
          ))}
        </View>
      </View>

      <View style={styles.switchRow}>
        <Typography variant="bodyMedium" style={styles.flex}>
          {t('wardrobe.filterSheet.favoritesOnly')}
        </Typography>
        <Switch
          value={draft.favoritesOnly}
          onValueChange={(v) => setDraft((d) => ({ ...d, favoritesOnly: v }))}
          trackColor={{ false: colors.beige, true: colors.ink }}
          thumbColor={colors.surface}
          ios_backgroundColor={colors.beige}
          accessibilityLabel={t('wardrobe.filterSheet.favoritesOnly')}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  group: { gap: spacing.sm },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  switchRow: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
});
