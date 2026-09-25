import {
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  Layers,
  Leaf,
  Palette,
  Share2,
  Sparkles,
  Sun,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, Share, StyleSheet, View, useWindowDimensions } from 'react-native';

import { errorMessage } from '../../api';
import type { Outfit, OutfitReason } from '../../api/types';
import {
  Chip,
  ErrorState,
  IconButton,
  OutfitCard,
  OutfitCollage,
  PrimaryButton,
  Screen,
  ScreenHeader,
  ScoreBreakdown,
  ScoreRing,
  SecondaryButton,
  SectionHeader,
  Skeleton,
  Typography,
} from '../../components';
import { useToggleSaveOutfit } from '../../hooks/mutations';
import { useEvaluateOutfit, useSimilarOutfits } from '../../hooks/queries';
import type { RootScreenProps } from '../../navigation/types';
import { colors, fonts, radius, spacing } from '../../theme';
import { notify } from '../../utils/confirm';
import { outfitGarmentIds, sortIds } from '../../utils/outfit';

const REASON_ICONS: Record<string, LucideIcon> = {
  COLOR: Palette,
  TEXTURE: Layers,
  OCCASION: CalendarDays,
  SEASON: Sun,
  STYLE: Sparkles,
};

export function OutfitDetailScreen({ navigation, route }: RootScreenProps<'OutfitDetail'>) {
  const ids = useMemo(() => sortIds(route.params.ids), [route.params.ids]);
  const outfitQuery = useEvaluateOutfit(ids);
  const outfit = outfitQuery.data;
  const toggle = useToggleSaveOutfit();
  const [showSimilar, setShowSimilar] = useState(false);
  const similar = useSimilarOutfits(ids, showSimilar);
  const scrollRef = useRef<ScrollView>(null);
  const similarY = useRef(0);
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(290, Math.round(width * 0.72));

  const onShare = async (o: Outfit) => {
    const pieces = o.items.map((i) => `• ${i.garment.displayName}`).join('\n');
    try {
      await Share.share({
        title: o.title,
        message: `${o.title} — Uyum Skoru ${o.score}\n${o.description}\n\n${pieces}\n\nRYVENCA ile kendi dolabımdan oluşturdum.`,
      });
    } catch {
      // user dismissed / not supported
    }
  };

  const onSimilar = () => {
    setShowSimilar(true);
    setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, similarY.current - 12), animated: true }), 120);
  };

  const onToggleSave = (o: Outfit) =>
    toggle.mutate(o, { onError: (e) => notify('İşlem tamamlanamadı', errorMessage(e)) });

  return (
    <Screen>
      <ScreenHeader
        title="Kombin Detayı"
        onBack={() => navigation.goBack()}
        right={
          outfit ? (
            <>
              <IconButton icon={Share2} accessibilityLabel="Paylaş" onPress={() => void onShare(outfit)} />
              <IconButton
                icon={Bookmark}
                accessibilityLabel={outfit.saved ? 'Kaydedilenlerden çıkar' : 'Kombini kaydet'}
                selected={outfit.saved}
                fill={outfit.saved ? colors.ink : 'none'}
                disabled={toggle.isPending}
                onPress={() => onToggleSave(outfit)}
              />
            </>
          ) : null
        }
      />

      {outfitQuery.isLoading ? (
        <View style={styles.loading}>
          <Skeleton height={140} radius={radius.lg} />
          <Skeleton height={undefined} radius={radius.lg} style={styles.collageSkeleton} />
        </View>
      ) : outfitQuery.isError || !outfit ? (
        <ErrorState error={outfitQuery.error} title="Kombin yüklenemedi" onRetry={() => void outfitQuery.refetch()} />
      ) : (
        <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
          {/* Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryTop}>
              <View style={styles.flex}>
                {outfit.styleLabel ? <Typography variant="eyebrow">{outfit.styleLabel}</Typography> : null}
                <Typography variant="display" style={styles.title}>
                  {outfit.title}
                </Typography>
              </View>
              <ScoreRing score={outfit.score} size={100} />
            </View>
            <Typography variant="body" color={colors.textSecondary}>
              {outfit.description}
            </Typography>
          </View>

          {/* Collage */}
          <OutfitCollage
            items={outfit.items}
            heightRatio={1.18}
            gap={6}
            highRes
            showColorDots
            onPressItem={(item) => navigation.push('GarmentDetail', { id: item.garment.id })}
          />
          <Typography variant="caption" align="center">
            Parçaya dokunarak detayını görebilirsin
          </Typography>

          {/* Breakdown */}
          <View style={styles.card}>
            <SectionHeader title="Skor Dağılımı" />
            <ScoreBreakdown items={outfit.breakdown} />
          </View>

          {/* Reasons */}
          {outfit.reasons.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Neden Uyumlu?" />
              {outfit.reasons.map((reason) => (
                <ReasonCard key={`${reason.code}-${reason.title}`} reason={reason} />
              ))}
            </View>
          ) : null}

          {/* Venues */}
          {outfit.venues.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Uygun Ortamlar" />
              <View style={styles.wrap}>
                {outfit.venues.map((v) => (
                  <Chip key={v} static label={v} tone="outline" />
                ))}
              </View>
            </View>
          ) : null}

          {/* Palette */}
          {outfit.palette.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.paletteHead}>
                <Typography variant="h2">Renk Paleti</Typography>
                {outfit.paletteName ? (
                  <Typography style={styles.smallCaps}>{outfit.paletteName.toLocaleUpperCase('tr-TR')}</Typography>
                ) : null}
              </View>
              <View style={styles.palette}>
                {outfit.palette.map((p) => (
                  <View key={`${p.color}-${p.hex}`} style={styles.paletteItem} accessibilityLabel={p.label}>
                    <View style={[styles.paletteCircle, { backgroundColor: p.hex }]} />
                    <Typography variant="caption" color={colors.textSecondary} numberOfLines={1}>
                      {p.label}
                    </Typography>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Actions */}
          <View style={styles.actions}>
            <PrimaryButton
              label={outfit.saved ? 'Kaydedildi' : 'Kombini Kaydet'}
              icon={outfit.saved ? BookmarkCheck : Bookmark}
              onPress={() => onToggleSave(outfit)}
              loading={toggle.isPending}
              fullWidth
            />
            <SecondaryButton label="Benzer Kombinler" icon={Layers} onPress={onSimilar} fullWidth />
          </View>

          {/* Similar */}
          <View
            onLayout={(e) => {
              similarY.current = e.nativeEvent.layout.y;
            }}
            style={styles.section}
          >
            {showSimilar ? (
              <>
                <SectionHeader title="Benzer Kombinler" />
                {similar.isLoading ? (
                  <View style={styles.similarLoading}>
                    <ActivityIndicator color={colors.softBrown} />
                  </View>
                ) : similar.isError ? (
                  <ErrorState compact error={similar.error} onRetry={() => void similar.refetch()} />
                ) : (similar.data?.outfits.length ?? 0) === 0 ? (
                  <Typography variant="small">Şimdilik benzer bir kombin bulamadık.</Typography>
                ) : (
                  <FlatList
                    horizontal
                    data={similar.data?.outfits ?? []}
                    keyExtractor={(o) => o.key}
                    showsHorizontalScrollIndicator={false}
                    style={styles.bleed}
                    contentContainerStyle={styles.hList}
                    renderItem={({ item }) => (
                      <OutfitCard
                        outfit={item}
                        width={cardWidth}
                        onPress={() => navigation.push('OutfitDetail', { ids: outfitGarmentIds(item) })}
                      />
                    )}
                  />
                )}
              </>
            ) : null}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

function ReasonCard({ reason }: { reason: OutfitReason }) {
  const Icon = REASON_ICONS[reason.code] ?? (reason.code === 'SEASON' ? Leaf : Sparkles);
  return (
    <View style={styles.reason}>
      <View style={styles.reasonIcon}>
        <Icon size={20} color={colors.brown} strokeWidth={1.5} />
      </View>
      <View style={styles.flex}>
        <Typography variant="bodySemiBold">{reason.title}</Typography>
        <Typography variant="small" style={styles.reasonText}>
          {reason.text}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { padding: spacing.md, gap: spacing.md },
  collageSkeleton: { aspectRatio: 1 / 1.18 },
  content: { padding: spacing.md, paddingBottom: spacing.xxxl, gap: spacing.lg, maxWidth: 720, width: '100%', alignSelf: 'center' },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { marginTop: 4, fontSize: 30, lineHeight: 34 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  section: { gap: spacing.sm },
  reason: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  reasonIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonText: { marginTop: 2 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  paletteHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.xs },
  smallCaps: { fontFamily: fonts.bodySemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.softBrown },
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  paletteItem: { alignItems: 'center', gap: 6, width: 60 },
  paletteCircle: { width: 48, height: 48, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  actions: { gap: spacing.sm, marginTop: spacing.xs },
  similarLoading: { paddingVertical: spacing.xl },
  bleed: { marginHorizontal: -spacing.md, flexGrow: 0 },
  hList: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
});
