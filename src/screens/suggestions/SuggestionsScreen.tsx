import { Shuffle } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import type { Occasion, Season } from '../../api/types';
import {
  AppHeader,
  Chip,
  EmptyState,
  ErrorState,
  OutfitCard,
  OutfitCardSkeleton,
  ReadinessBanner,
  Screen,
  SecondaryButton,
  Segmented,
  Typography,
} from '../../components';
import { useSuggestions } from '../../hooks/queries';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { useMeta } from '../../hooks/useMeta';
import type { TabScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { outfitGarmentIds, randomSeed } from '../../utils/outfit';

const LIMIT = 10;

export function SuggestionsScreen({ navigation, route }: TabScreenProps<'Suggestions'>) {
  const { meta, labels } = useMeta();
  const [occasion, setOccasion] = useState<Occasion | null>(route.params?.occasion ?? null);
  const [season, setSeason] = useState<Season | null>(null);
  const [seed, setSeed] = useState<number | null>(route.params?.seed ?? null);

  // "Kombin Öner →" from Home passes a fresh random seed (adjust state when params change).
  const paramSeed = route.params?.seed;
  const paramOccasion = route.params?.occasion;
  const [seenParams, setSeenParams] = useState({ seed: paramSeed, occasion: paramOccasion });
  if (seenParams.seed !== paramSeed || seenParams.occasion !== paramOccasion) {
    setSeenParams({ seed: paramSeed, occasion: paramOccasion });
    if (paramSeed && paramSeed !== seenParams.seed) setSeed(paramSeed);
    if (paramOccasion !== undefined && paramOccasion !== seenParams.occasion) setOccasion(paramOccasion);
  }

  const suggestions = useSuggestions({ occasion, season, seed, limit: LIMIT });
  const pull = usePullToRefresh(suggestions.refetch);
  const data = suggestions.data;
  const effectiveSeason = season ?? data?.season ?? null;
  const readiness = data?.readiness;

  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <View style={styles.flex}>
          <Typography variant="h1" accessibilityRole="header">
            Öneriler
          </Typography>
          <Typography variant="body" color={colors.textSecondary}>
            Dolabındaki fotoğraflarla hazırlanan kombinler.
          </Typography>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.chips}>
        <Chip label="Tümü" selected={occasion === null} onPress={() => setOccasion(null)} />
        {(meta?.occasions ?? []).map((o) => (
          <Chip key={o.code} label={o.label} selected={occasion === o.code} onPress={() => setOccasion(o.code)} />
        ))}
      </ScrollView>

      <Segmented<Season>
        size="sm"
        options={(meta?.seasons ?? []).map((s) => ({ value: s.code, label: s.label }))}
        value={effectiveSeason}
        onChange={setSeason}
      />
      <View style={styles.controls}>
        <Typography variant="small" style={styles.flex}>
          {data ? `${data.outfits.length} kombin · ${labels.season(data.season)}` : ' '}
        </Typography>
        <SecondaryButton
          label="Yeniden Öner"
          icon={Shuffle}
          size="sm"
          onPress={() => setSeed(randomSeed())}
          accessibilityHint="Yeni kombin önerileri getirir"
        />
      </View>
      {suggestions.isFetching && !suggestions.isLoading ? (
        <View style={styles.fetching}>
          <ActivityIndicator size="small" color={colors.softBrown} />
          <Typography variant="caption">Kombinler hazırlanıyor…</Typography>
        </View>
      ) : null}
      {readiness && !readiness.ready ? (
        <ReadinessBanner readiness={readiness} onAdd={() => navigation.navigate('Upload', undefined)} title="Önerilere az kaldı" />
      ) : null}
    </View>
  );

  return (
    <Screen>
      <AppHeader
        onPressHanger={() => navigation.navigate('Wardrobe', undefined)}
        onPressSearch={() => navigation.navigate('Wardrobe', { focusSearch: Date.now() })}
      />
      <FlatList
        data={data?.outfits ?? []}
        keyExtractor={(o) => o.key}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl {...pull} tintColor={colors.softBrown} />
        }
        renderItem={({ item }) => (
          <OutfitCard
            variant="editorial"
            outfit={item}
            onPress={() => navigation.navigate('OutfitDetail', { ids: outfitGarmentIds(item) })}
          />
        )}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          suggestions.isLoading ? (
            <View style={styles.skeletons}>
              <OutfitCardSkeleton />
              <OutfitCardSkeleton />
            </View>
          ) : suggestions.isError ? (
            <ErrorState error={suggestions.error} onRetry={() => void suggestions.refetch()} />
          ) : readiness && !readiness.ready ? (
            <EmptyState
              title="Önce birkaç parça ekleyelim"
              text="Kombin önerebilmemiz için en az bir üst, bir alt (ya da elbise) ve bir ayakkabı gerekiyor."
              actionLabel="Parça Ekle"
              onAction={() => navigation.navigate('Upload', undefined)}
            />
          ) : (
            <EmptyState
              title="Bu filtrelere uygun kombin yok"
              text="Farklı bir kullanım alanı ya da mevsim seçmeyi dene."
              actionLabel="Tüm Kombinleri Gör"
              onAction={() => {
                setOccasion(null);
                setSeason(null);
              }}
            />
          )
        }
      />
    </Screen>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxxl, maxWidth: 1120, width: '100%', alignSelf: 'center' },
  header: { gap: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end' },
  bleed: { marginHorizontal: -spacing.md, flexGrow: 0 },
  chips: { gap: spacing.xs, paddingHorizontal: spacing.md },
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  fetching: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  separator: { height: spacing.lg },
  skeletons: { gap: spacing.lg },
});
