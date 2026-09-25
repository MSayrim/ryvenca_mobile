import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View, useWindowDimensions } from 'react-native';

import {
  EmptyState,
  ErrorState,
  GarmentCard,
  GarmentGridSkeleton,
  OutfitCard,
  OutfitCardSkeleton,
  Screen,
  ScreenHeader,
  Segmented,
} from '../../components';
import { useGarments, useSavedOutfits } from '../../hooks/queries';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { useTranslation } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { outfitGarmentIds } from '../../utils/outfit';

type Tab = 'outfits' | 'garments';

const FAVORITE_FILTER = { favorite: true } as const;

export function FavoritesScreen({ navigation, route }: RootScreenProps<'Favorites'>) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>(route.params?.tab ?? 'outfits');
  const saved = useSavedOutfits();
  const garments = useGarments(FAVORITE_FILTER, { enabled: tab === 'garments' });
  const pullSaved = usePullToRefresh(saved.refetch);
  const pullGarments = usePullToRefresh(garments.refetch);
  const { width } = useWindowDimensions();
  const columns = width >= 820 ? 4 : width >= 600 ? 3 : 2;

  return (
    <Screen>
      <ScreenHeader title={t('favorites.title')} onBack={() => navigation.goBack()} />
      <View style={styles.tabs}>
        <Segmented<Tab>
          options={[
            { value: 'outfits', label: t('favorites.tabs.outfits') },
            { value: 'garments', label: t('favorites.tabs.garments') },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {tab === 'outfits' ? (
        saved.isLoading ? (
          <View style={styles.pad}>
            <OutfitCardSkeleton />
          </View>
        ) : saved.isError ? (
          <ErrorState error={saved.error} onRetry={() => void saved.refetch()} />
        ) : (
          <FlatList
            data={saved.data ?? []}
            keyExtractor={(o) => o.key}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl {...pullSaved} tintColor={colors.softBrown} />
            }
            ItemSeparatorComponent={Separator}
            renderItem={({ item }) => (
              <OutfitCard
                variant="editorial"
                outfit={item}
                onPress={() => navigation.navigate('OutfitDetail', { ids: outfitGarmentIds(item) })}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                title={t('favorites.emptyOutfits.title')}
                text={t('favorites.emptyOutfits.text')}
                actionLabel={t('favorites.emptyOutfits.action')}
                onAction={() => navigation.navigate('Main', { screen: 'Suggestions' })}
              />
            }
          />
        )
      ) : garments.isLoading ? (
        <GarmentGridSkeleton />
      ) : garments.isError ? (
        <ErrorState error={garments.error} onRetry={() => void garments.refetch()} />
      ) : (
        <FlatList
          key={`fav-${columns}`}
          data={garments.data ?? []}
          numColumns={columns}
          keyExtractor={(g) => String(g.id)}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.grid}
          refreshControl={
            <RefreshControl {...pullGarments} tintColor={colors.softBrown} />
          }
          renderItem={({ item }) => (
            <View style={{ flex: 1 / columns }}>
              <GarmentCard garment={item} onPress={() => navigation.navigate('GarmentDetail', { id: item.id })} />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              title={t('favorites.emptyGarments.title')}
              text={t('favorites.emptyGarments.text')}
              actionLabel={t('favorites.emptyGarments.action')}
              onAction={() => navigation.navigate('Main', { screen: 'Wardrobe' })}
            />
          }
        />
      )}
    </Screen>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  tabs: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  pad: { padding: spacing.md },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxxl, flexGrow: 1, maxWidth: 1120, width: '100%', alignSelf: 'center' },
  separator: { height: spacing.lg },
  grid: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxxl, gap: spacing.lg, flexGrow: 1 },
  column: { gap: spacing.sm },
});
