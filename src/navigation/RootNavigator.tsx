import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import { useSession } from '../auth/SessionProvider';
import { ErrorState, Wordmark } from '../components';
import { useMetaQuery } from '../hooks/useMeta';
import { AuthScreen } from '../screens/auth/AuthScreen';
import { FavoritesScreen } from '../screens/favorites/FavoritesScreen';
import { GarmentDetailScreen } from '../screens/garment/GarmentDetailScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { OutfitDetailScreen } from '../screens/outfit/OutfitDetailScreen';
import { EditPreferencesScreen } from '../screens/profile/EditPreferencesScreen';
import { HowItWorksScreen } from '../screens/profile/HowItWorksScreen';
import { WardrobeStatsScreen } from '../screens/profile/WardrobeStatsScreen';
import { GarmentEditScreen } from '../screens/upload/UploadScreen';
import { colors, spacing } from '../theme';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { status, user, restoreError, retryRestore } = useSession();
  // Meta is public: start fetching it immediately, once per app session.
  useMetaQuery();

  if (status === 'restoring') {
    return (
      <View style={styles.center}>
        <Wordmark size={30} tagline />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.center}>
        <Wordmark size={26} />
        <ErrorState error={null} message={restoreError} title="Bağlantı kurulamadı" onRetry={retryRestore} />
      </View>
    );
  }

  const signedIn = status === 'signedIn' && user;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      {!signedIn ? (
        <Stack.Screen name="Auth" component={AuthScreen} options={{ animationTypeForReplace: 'pop' }} />
      ) : !user.onboardingCompleted ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="GarmentDetail" component={GarmentDetailScreen} />
          <Stack.Screen name="GarmentEdit" component={GarmentEditScreen} />
          <Stack.Screen name="OutfitDetail" component={OutfitDetailScreen} />
          <Stack.Screen name="Favorites" component={FavoritesScreen} />
          <Stack.Screen name="WardrobeStats" component={WardrobeStatsScreen} />
          <Stack.Screen name="HowItWorks" component={HowItWorksScreen} />
          <Stack.Screen name="EditPreferences" component={EditPreferencesScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.md,
  },
});
