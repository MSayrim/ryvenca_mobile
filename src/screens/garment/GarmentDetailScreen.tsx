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
import type { RootScreenProps } from '../../navigation/types';
import { colors, radius, spacing } from '../../theme';
import { confirm, notify } from '../../utils/confirm';
import { outfitGarmentIds } from '../../utils/outfit';

export function GarmentDetailScreen({ navigation, route }: RootScreenProps<'GarmentDetail'>) {
  const { id } = route.params;
  const garmentQuery = useGarment(id);
  const garment = garmentQuery.data;
  const favorite = useToggleGarmentFavorite();
  const remove = useDeleteGarment();
  const toast = useToast();

  const onDelete = async () => {
    const ok = await confirm({
      title: 'Bu parçayı silmek istiyor musun?',
      message: 'Bu parçayı içeren kayıtlı kombinler de silinecek.',
      confirmText: 'Sil',
      destructive: true,
    });
    if (!ok) return;
    remove.mutate(id, {
      onSuccess: () => {
        toast.show('Parça silindi');
        navigation.goBack();
      },
      onError: (e) => notify('Silinemedi', errorMessage(e)),
    });
  };

  return (
    <Screen>
      <ScreenHeader
        title="Parça Detayı"
        onBack={() => navigation.goBack()}
        right={
          garment ? (
            <IconButton
              icon={Heart}
              accessibilityLabel={garment.favorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
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
              label="Düzenle"
              icon={Pencil}
              onPress={() => navigation.navigate('GarmentEdit', { id })}
              style={styles.flex}
            />
            <OutlineButton label="Sil" icon={Trash2} danger onPress={onDelete} loading={remove.isPending} style={styles.flex} />
          </View>
          <Pairings garmentId={id} onOpenGarment={(g) => navigation.push('GarmentDetail', { id: g.id })} onOpenOutfit={(ids) => navigation.navigate('OutfitDetail', { ids })} onAdd={() => navigation.navigate('Main', { screen: 'Upload' })} />
        </ScrollView>
      )}
    </Screen>
  );
}

function GarmentInfo({ garment }: { garment: Garment }) {
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
        {garment.pattern ? <Chip static size="sm" label="Desenli" /> : null}
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
  const pairings = usePairings(garmentId);
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(290, Math.round(width * 0.72));
  const data = pairings.data;

  return (
    <View style={styles.pairings}>
      <View style={styles.pairingsHeader}>
        <Typography variant="eyebrow">Anahtar özellik</Typography>
        <Typography variant="display" accessibilityRole="header">
          Bununla Ne Gider?
        </Typography>
        <Typography variant="small">Dolabındaki parçalardan bu parçayla en iyi eşleşenler.</Typography>
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
            <Typography variant="small">Bu parçaya uygun eşleşme bulunamadı.</Typography>
          ) : null}

          <SectionHeader title="Bu parçayla kombinler" style={styles.outfitsHeader} />
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
                ? 'Bu parçayla henüz kombin oluşturamadık.'
                : 'Kombin oluşturabilmemiz için birkaç parça daha ekle.'}
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
    paddingLeft: 4,
    paddingRight: spacing.sm,
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
