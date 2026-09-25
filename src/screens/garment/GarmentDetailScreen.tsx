import { Heart, Pencil, Trash2 } from 'lucide-react-native';
import { FlatList, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { errorMessage } from '../../api';
import type { Garment } from '../../api/types';
import {
  Chip,
  ColorDot,
  ErrorState,
  GarmentPhoto,
  GarmentThumb,
  IconButton,
  OutfitCard,
  OutlineButton,
  ReadinessBanner,
  Screen,
  ScreenHeader,
  ScoreBadge,
  SecondaryButton,
  SectionHeader,
  Skeleton,
  Typography,
  useToast,
} from '../../components';
import { useDeleteGarment, useToggleGarmentFavorite } from '../../hooks/mutations';
import { useGarment, usePairings } from '../../hooks/queries';
import { useMeta } from '../../hooks/useMeta';
import { useTranslation } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { colors, radius, spacing } from '../../theme';
import { confirm, notify } from '../../utils/confirm';
import { outfitGarmentIds } from '../../utils/outfit';

export function GarmentDetailScreen({ navigation, route }: RootScreenProps<'GarmentDetail'>) {
  const { t } = useTranslation();
  const { id } = route.params;
  const garmentQuery = useGarment(id);
  const garment = garmentQuery.data;
  const favorite = useToggleGarmentFavorite();
  const remove = useDeleteGarment();
  const toast = useToast();

  const onDelete = async () => {
    const ok = await confirm({
      title: t('garment.delete.title'),
      message: t('garment.delete.message'),
      confirmText: t('common.delete'),
      destructive: true,
    });
    if (!ok) return;
    remove.mutate(id, {
      onSuccess: () => {
        toast.show(t('garment.delete.done'));
        navigation.goBack();
      },
      onError: (e) => notify(t('garment.delete.failed'), errorMessage(e)),
    });
  };

  return (
    <Screen>
      <ScreenHeader
        title={t('garment.detail.title')}
        onBack={() => navigation.goBack()}
        right={
          garment ? (
            <IconButton
              icon={Heart}
              accessibilityLabel={garment.favorite ? t('common.removeFromFavorites') : t('common.addToFavorites')}
              selected={garment.favorite}
              color={garment.favorite ? colors.danger : colors.ink}
              fill={garment.favorite ? colors.danger : 'none'}
              onPress={() => favorite.mutate(garment)}
            />
          ) : null
        }
      />
      {garmentQuery.isLoading ? (
        <View style={styles.pad}>
          <Skeleton height={undefined} radius={radius.lg} style={styles.photoSkeleton} />
          <Skeleton height={28} width="60%" style={styles.mt} />
        </View>
      ) : garmentQuery.isError || !garment ? (
        <ErrorState error={garmentQuery.error} onRetry={() => void garmentQuery.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.photoWrap}>
            <GarmentPhoto uri={garment.imageUrl} radius={radius.lg} priority="high" accessibilityLabel={garment.displayName} />
          </View>
          <GarmentInfo garment={garment} />
          <View style={styles.actions}>
            <SecondaryButton
              label={t('common.edit')}
              icon={Pencil}
              onPress={() => navigation.navigate('GarmentEdit', { id })}
              style={styles.flex}
            />
            <OutlineButton label={t('common.delete')} icon={Trash2} danger onPress={onDelete} loading={remove.isPending} style={styles.flex} />
          </View>
          <Pairings garmentId={id} onOpenGarment={(g) => navigation.push('GarmentDetail', { id: g.id })} onOpenOutfit={(ids) => navigation.navigate('OutfitDetail', { ids })} onAdd={() => navigation.navigate('Main', { screen: 'Upload' })} />
        </ScrollView>
      )}
    </Screen>
  );
}

function GarmentInfo({ garment }: { garment: Garment }) {
  const { t } = useTranslation();
  const { labels } = useMeta();
  return (
    <View style={styles.info}>
      <Typography variant="eyebrow">{labels.categoryPlural(garment.category)}</Typography>
      <Typography variant="h1">{garment.displayName}</Typography>
      <View style={styles.chips}>
        <Chip static size="sm" label={labels.category(garment.category)} />
        <Chip static size="sm" label={labels.subcategory(garment.subcategory, garment.category)} />
        <View style={styles.colorChip}>
          <ColorDot hex={garment.colorHex} size={10} />
          <Typography variant="smallMedium">{labels.color(garment.color)}</Typography>
        </View>
        {garment.pattern ? <Chip static size="sm" label={t('garment.patterned')} /> : null}
        {garment.seasons.map((s) => (
          <Chip key={s} static size="sm" tone="outline" label={labels.season(s)} />
        ))}
        {garment.occasions.map((o) => (
          <Chip key={o} static size="sm" tone="outline" label={labels.occasion(o)} />
        ))}
      </View>
    </View>
  );
}

function Pairings({
  garmentId,
  onOpenGarment,
  onOpenOutfit,
  onAdd,
}: {
  garmentId: number;
  onOpenGarment: (g: Garment) => void;
  onOpenOutfit: (ids: number[]) => void;
  onAdd: () => void;
}) {
  const { t } = useTranslation();
  const pairings = usePairings(garmentId);
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(290, Math.round(width * 0.72));
  const data = pairings.data;

  return (
    <View style={styles.pairings}>
      <View style={styles.pairingsHeader}>
        <Typography variant="eyebrow">{t('garment.pairings.eyebrow')}</Typography>
        <Typography variant="display" accessibilityRole="header">
          {t('garment.pairings.title')}
        </Typography>
        <Typography variant="small">{t('garment.pairings.text')}</Typography>
      </View>

      {pairings.isLoading ? (
        <View style={styles.row}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width={96} height={120} radius={radius.md} />
          ))}
        </View>
      ) : pairings.isError || !data ? (
        <ErrorState compact error={pairings.error} onRetry={() => void pairings.refetch()} />
      ) : (
        <>
          {!data.readiness.ready ? <ReadinessBanner readiness={data.readiness} onAdd={onAdd} /> : null}

          {data.matches.filter((m) => m.items.length > 0).map((match) => (
            <View key={match.role} style={styles.matchGroup}>
              <Typography variant="h3">{match.label}</Typography>
              <FlatList
                horizontal
                data={match.items}
                keyExtractor={(i) => String(i.garment.id)}
                showsHorizontalScrollIndicator={false}
                style={styles.bleed}
                contentContainerStyle={styles.hList}
                renderItem={({ item }) => (
                  <GarmentThumb garment={item.garment} width={96} onPress={() => onOpenGarment(item.garment)}>
                    <ScoreBadge score={item.score} />
                  </GarmentThumb>
                )}
              />
            </View>
          ))}

          {data.matches.every((m) => m.items.length === 0) && data.readiness.ready ? (
            <Typography variant="small">{t('garment.pairings.noMatches')}</Typography>
          ) : null}

          <SectionHeader title={t('garment.pairings.outfitsTitle')} style={styles.outfitsHeader} />
          {data.outfits.length > 0 ? (
            <FlatList
              horizontal
              data={data.outfits}
              keyExtractor={(o) => o.key}
              showsHorizontalScrollIndicator={false}
              style={styles.bleed}
              contentContainerStyle={styles.hListOutfits}
              renderItem={({ item }) => (
                <OutfitCard outfit={item} width={cardWidth} onPress={() => onOpenOutfit(outfitGarmentIds(item))} />
              )}
            />
          ) : (
            <Typography variant="small">
              {data.readiness.ready
                ? t('garment.pairings.noOutfits')
                : t('garment.pairings.notReady')}
            </Typography>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { padding: spacing.md },
  mt: { marginTop: spacing.md },
  photoSkeleton: { aspectRatio: 4 / 5 },
  content: { paddingBottom: spacing.xxxl, gap: spacing.lg },
  photoWrap: { paddingHorizontal: spacing.md, maxWidth: 560, width: '100%', alignSelf: 'center' },
  info: { paddingHorizontal: spacing.md, gap: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.xs },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingStart: 4,
    paddingEnd: spacing.sm,
    minHeight: 30,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md },
  pairings: {
    marginTop: spacing.xs,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.md,
    gap: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  pairingsHeader: { gap: 4 },
  row: { flexDirection: 'row', gap: spacing.sm },
  matchGroup: { gap: spacing.xs },
  bleed: { marginHorizontal: -spacing.md, flexGrow: 0 },
  hList: { gap: spacing.sm, paddingHorizontal: spacing.md },
  hListOutfits: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  outfitsHeader: { marginTop: spacing.xs },
});
