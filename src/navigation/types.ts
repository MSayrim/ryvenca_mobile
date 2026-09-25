import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { Category, Occasion } from '../api/types';

export type MainTabParamList = {
  Home: undefined;
  /** `focusSearch` / `nonce` are timestamps so repeated navigations re-trigger the effect. */
  Wardrobe: { category?: Category | null; focusSearch?: number; nonce?: number } | undefined;
  Upload: { nonce?: number } | undefined;
  Suggestions: { seed?: number; occasion?: Occasion | null } | undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  GarmentDetail: { id: number };
  GarmentEdit: { id: number };
  OutfitDetail: { ids: number[] };
  Favorites: { tab?: 'outfits' | 'garments' } | undefined;
  WardrobeStats: undefined;
  HowItWorks: undefined;
  EditPreferences: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
