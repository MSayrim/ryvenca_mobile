import { Heart, Layers, Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import type { Category, Garment } from '../../api/types';
import {
  AppHeader,
  Chip,
  ErrorState,
  FannedStack,
  GarmentThumb,
  HangerIcon,
  OutfitCard,
  OutfitCardSkeleton,
  PrimaryButton,
  ReadinessBanner,
  Screen,
  SecondaryButton,
  SectionHeader,
  Skeleton,
  StatCard,
  Typography,
  useDirection,
} from '../../components';
import { useMeta } from '../../hooks/useMeta';
import { useHome } from '../../hooks/queries';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { useTranslation } from '../../i18n';
import type { TabScreenProps } from '../../navigation/types';
import { colors, radius, spacing } from '../../theme';
import { heroGarments } from '../../utils/hero';
import { outfitGarmentIds, randomSeed } from '../../utils/outfit';

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const { t } = useTranslation();
  const { ForwardArrow } = useDirection();
  const home = useHome();
  const pull = usePullToRefresh(home.refetch);
  const { meta } = useMeta();
  const { width } = useWindowDimensions();
  const [category, setCategory] = useState<Category | null>(null);

  const recent = useMemo<Garment[]>(() => {
    const list = home.data?.recentGarments ?? [];
    return category ? list.filter((g) => g.category === category) : list;
  }, [home.data, category]);

  const goUpload = () => navigation.navigate('Upload', undefined);
  const goWardrobe = (cat?: Category | null) => navigation.navigate('Wardrobe', { category: cat ?? null, nonce: Date.now() });
  const goSearch = () => navigation.navigate('Wardrobe', { focusSearch: Date.now() });
  const goSuggest = () => navigation.navigate('Suggestions', { seed: randomSeed() });

  const data = home.data;
  const readiness = data?.readiness;
  const showReadiness = !!readiness && (!readiness.ready || readiness.garmentCount < readiness.recommendedMinimum);
  const cardWidth = Math.min(300, Math.round(width * 0.74));

  return (
    <Screen>
      <AppHeader onPressHanger={() => goWardrobe(null)} onPressSearch={goSearch} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl {...pull} tintColor={colors.softBrown} />
        }
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Typography variant="script">{t('accents.sameYouBetterOutfits')}</Typography>
            <Typography variant="display" style={styles.heroTitle}>
              {t('home.hero.title')}
            </Typography>
            <Typography variant="small" color={colors.textSecondary}>
              {t('home.hero.text')}
            </Typography>
            <PrimaryButton label={t('home.hero.cta')} iconEnd={ForwardArrow} size="sm" onPress={goSuggest} style={styles.heroCta} />
          </View>
          <View style={styles.heroArt}>
            {home.isLoading ? (
              <Skeleton width={104} height={130} radius={radius.sm} />
            ) : (
              <FannedStack garments={heroGarments(data?.recentGarments ?? [])} width={116} />
            )}
          </View>
        </View>

        {home.isError && !data ? (
          <ErrorState error={home.error} onRetry={() => void home.refetch()} />
        ) : (
          <>
            {/* Stats */}
            <View style={styles.stats}>
              {data ? (
                <>
                  <StatCard
                    icon={<HangerIcon size={18} color={colors.brown} />}
                    value={data.stats.garmentCount}
                    label={t('home.stats.garments')}
                    onPress={() => goWardrobe(null)}
                  />
                  <StatCard
                    icon={<Layers size={17} color={colors.brown} strokeWidth={1.5} />}
                    value={data.stats.readyOutfitCount}
                    label={t('home.stats.readyOutfits')}
                    onPress={() => navigation.navigate('Suggestions', undefined)}
                  />
                  <StatCard
                    icon={<Heart size={17} color={colors.brown} strokeWidth={1.5} />}
                    value={data.stats.favoriteCount}
                    label={t('home.stats.favorites')}
                    onPress={() => navigation.navigate('Favorites', undefined)}
                  />
                </>
              ) : (
                [0, 1, 2].map((i) => <Skeleton key={i} height={100} radius={radius.md} style={styles.flex} />)
              )}
            </View>

            {showReadiness && readiness ? (
              <View style={styles.inset}>
                <ReadinessBanner readiness={readiness} onAdd={goUpload} />
              </View>
            ) : null}

            {/* Wardrobe */}
            <View style={styles.section}>
              <SectionHeader title={t('home.wardrobe.title')} actionLabel={t('common.seeAll')} onAction={() => goWardrobe(category)} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.chips}>
                {(meta?.categories ?? []).map((c) => (
                  <Chip
                    key={c.code}
                    label={c.label}
                    selected={category === c.code}
                    onPress={() => setCategory((cur) => (cur === c.code ? null : c.code))}
                  />
                ))}
              </ScrollView>
              {home.isLoading ? (
                <View style={styles.row}>
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} width={104} height={130} radius={radius.md} />
                  ))}
                </View>
              ) : recent.length > 0 ? (
                <FlatList
                  horizontal
                  data={recent}
                  keyExtractor={(g) => String(g.id)}
                  showsHorizontalScrollIndicator={false}
                  style={styles.bleed}
                  contentContainerStyle={styles.hList}
                  renderItem={({ item }) => (
                    <GarmentThumb garment={item} onPress={() => navigation.navigate('GarmentDetail', { id: item.id })} />
                  )}
                />
              ) : (
                <View style={styles.inlineEmpty}>
                  <Typography variant="small" style={styles.flex}>
                    {category ? t('home.wardrobe.emptyCategory') : t('home.wardrobe.empty')}
                  </Typography>
                  <SecondaryButton label={t('common.addPiece')} icon={Plus} size="sm" onPress={goUpload} />
                </View>
              )}
            </View>

            {/* Today's suggestions */}
            <View style={styles.section}>
              <SectionHeader
                title={t('home.today.title')}
                actionLabel={t('common.seeAll')}
                onAction={() => navigation.navigate('Suggestions', undefined)}
              />
              {home.isLoading ? (
                <View style={styles.row}>
                  <OutfitCardSkeleton width={cardWidth} />
                </View>
              ) : data && data.todaysSuggestions.length > 0 ? (
                <FlatList
                  horizontal
                  data={data.todaysSuggestions}
                  keyExtractor={(o) => o.key}
                  showsHorizontalScrollIndicator={false}
                  style={styles.bleed}
                  contentContainerStyle={styles.hListOutfits}
                  snapToInterval={cardWidth + spacing.sm}
                  decelerationRate="fast"
                  renderItem={({ item }) => (
                    <OutfitCard
                      outfit={item}
                      width={cardWidth}
                      onPress={() => navigation.navigate('OutfitDetail', { ids: outfitGarmentIds(item) })}
                    />
                  )}
                />
              ) : (
                <View style={styles.inlineEmpty}>
                  <Typography variant="small" style={styles.flex}>
                    {readiness && !readiness.ready
                      ? t('home.today.notReady')
                      : t('home.today.empty')}
                  </Typography>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl, gap: spacing.xl, paddingTop: spacing.xs },
  flex: { flex: 1 },
  hero: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroText: { flex: 1, gap: 6 },
  heroTitle: { marginTop: 2 },
  heroCta: { alignSelf: 'flex-start', marginTop: spacing.xs },
  heroArt: { width: 116, alignItems: 'center', justifyContent: 'center', marginStart: spacing.xs },
  inset: { paddingHorizontal: spacing.md },
  stats: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md },
  section: { gap: spacing.sm, paddingHorizontal: spacing.md },
  bleed: { marginHorizontal: -spacing.md, flexGrow: 0 },
  chips: { gap: spacing.xs, paddingHorizontal: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  hList: { gap: spacing.sm, paddingHorizontal: spacing.md },
  hListOutfits: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md, paddingTop: 2 },
  inlineEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
});
