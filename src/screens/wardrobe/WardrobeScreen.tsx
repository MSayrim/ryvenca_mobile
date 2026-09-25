import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import type { Category, GarmentFilters } from '../../api/types';
import {
  AppHeader,
  Chip,
  EmptyState,
  ErrorState,
  GarmentCard,
  GarmentGridSkeleton,
  Screen,
  Typography,
} from '../../components';
import { useGarments } from '../../hooks/queries';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { useMeta } from '../../hooks/useMeta';
import type { TabScreenProps } from '../../navigation/types';
import { TOUCH_TARGET, colors, fonts, radius, spacing } from '../../theme';
import { EMPTY_SHEET_FILTERS, WardrobeFilterSheet, countSheetFilters, type SheetFilters } from './WardrobeFilterSheet';

export function WardrobeScreen({ navigation, route }: TabScreenProps<'Wardrobe'>) {
  const { meta } = useMeta();
  const { width } = useWindowDimensions();
  const searchRef = useRef<TextInput>(null);

  const [category, setCategory] = useState<Category | null>(route.params?.category ?? null);
  const [query, setQuery] = useState('');
  const [sheetFilters, setSheetFilters] = useState<SheetFilters>(EMPTY_SHEET_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query.trim(), 300);

  // Deep links from Home / header: preselect category, focus search.
  const paramCategory = route.params?.category;
  const paramNonce = route.params?.nonce;
  const [seenNonce, setSeenNonce] = useState(paramNonce);
  if (paramNonce !== seenNonce) {
    setSeenNonce(paramNonce);
    if (paramNonce !== undefined) setCategory(paramCategory ?? null);
  }

  const focusSearch = route.params?.focusSearch;
  useEffect(() => {
    if (focusSearch) {
      const t = setTimeout(() => searchRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [focusSearch]);

  const filters = useMemo<GarmentFilters>(
    () => ({
      category: category ? [category] : undefined,
      color: sheetFilters.colors.length ? sheetFilters.colors : undefined,
      season: sheetFilters.seasons.length ? sheetFilters.seasons : undefined,
      occasion: sheetFilters.occasions.length ? sheetFilters.occasions : undefined,
      favorite: sheetFilters.favoritesOnly || undefined,
      q: debouncedQuery || undefined,
    }),
    [category, sheetFilters, debouncedQuery],
  );

  const garments = useGarments(filters);
  const pull = usePullToRefresh(garments.refetch);
  const list = garments.data ?? [];
  const activeSheetCount = countSheetFilters(sheetFilters);
  const hasAnyFilter = !!category || activeSheetCount > 0 || !!debouncedQuery;
  const columns = width >= 1100 ? 5 : width >= 820 ? 4 : width >= 600 ? 3 : 2;

  const goUpload = () => navigation.navigate('Upload', undefined);

  return (
    <Screen>
      <AppHeader
        onPressHanger={() => setCategory(null)}
        onPressSearch={() => searchRef.current?.focus()}
      />
      <View style={styles.top}>
        <View style={styles.titleRow}>
          <Typography variant="h1" accessibilityRole="header">
            Dolabım
          </Typography>
          {garments.data ? (
            <Typography variant="body" color={colors.textMuted} style={styles.count}>
              {`${list.length} parça`}
            </Typography>
          ) : null}
        </View>

        <View style={styles.searchRow}>
          <View style={styles.search}>
            <Search size={18} color={colors.textMuted} strokeWidth={1.5} />
            <TextInput
              ref={searchRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Dolabında ara (ör. blazer)"
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              returnKeyType="search"
              autoCorrect={false}
              accessibilityLabel="Dolabında ara"
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Aramayı temizle">
                <X size={18} color={colors.textMuted} strokeWidth={1.5} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={() => setSheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={activeSheetCount ? `Filtrele, ${activeSheetCount} filtre aktif` : 'Filtrele'}
            style={({ pressed }) => [styles.filterButton, activeSheetCount > 0 && styles.filterButtonActive, pressed && styles.pressed]}
          >
            <SlidersHorizontal size={18} color={activeSheetCount ? colors.surface : colors.ink} strokeWidth={1.5} />
            <Typography style={[styles.filterLabel, activeSheetCount > 0 && { color: colors.surface }]}>
              {activeSheetCount ? `Filtrele · ${activeSheetCount}` : 'Filtrele'}
            </Typography>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
          <Chip label="Tümü" selected={category === null} onPress={() => setCategory(null)} />
          {(meta?.categories ?? []).map((c) => (
            <Chip key={c.code} label={c.label} selected={category === c.code} onPress={() => setCategory(c.code)} />
          ))}
        </ScrollView>
      </View>

      {garments.isLoading ? (
        <GarmentGridSkeleton />
      ) : garments.isError && !garments.data ? (
        <ErrorState error={garments.error} onRetry={() => void garments.refetch()} />
      ) : (
        <FlatList
          key={`cols-${columns}`}
          data={list}
          numColumns={columns}
          keyExtractor={(g) => String(g.id)}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.grid}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl {...pull} tintColor={colors.softBrown} />
          }
          renderItem={({ item }) => (
            <View style={{ flex: 1 / columns }}>
              <GarmentCard garment={item} onPress={() => navigation.navigate('GarmentDetail', { id: item.id })} />
            </View>
          )}
          ListEmptyComponent={
            hasAnyFilter ? (
              <EmptyState
                title="Sonuç bulunamadı"
                text="Bu filtrelere uyan bir parça yok. Filtreleri değiştirmeyi dene."
                actionLabel="Filtreleri Temizle"
                onAction={() => {
                  setCategory(null);
                  setQuery('');
                  setSheetFilters(EMPTY_SHEET_FILTERS);
                }}
              />
            ) : (
              <EmptyState
                title="Dolabın seni bekliyor"
                text="Kıyafetlerinin fotoğrafını çek, dolabın kendiliğinden düzenlensin."
                actionLabel="İlk parçanı ekle"
                onAction={goUpload}
              />
            )
          }
        />
      )}

      <WardrobeFilterSheet
        visible={sheetOpen}
        initial={sheetFilters}
        onClose={() => setSheetOpen(false)}
        onApply={(next) => {
          setSheetFilters(next);
          setSheetOpen(false);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: spacing.md, gap: spacing.sm, paddingBottom: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  count: { marginLeft: 2 },
  searchRow: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: TOUCH_TARGET,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 10,
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : null),
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  filterButtonActive: { backgroundColor: colors.ink },
  filterLabel: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  pressed: { opacity: 0.85 },
  chipsScroll: { marginHorizontal: -spacing.md, flexGrow: 0 },
  chips: { gap: spacing.xs, paddingHorizontal: spacing.md },
  grid: { paddingHorizontal: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.xxxl, gap: spacing.lg, flexGrow: 1 },
  column: { gap: spacing.sm },
});
