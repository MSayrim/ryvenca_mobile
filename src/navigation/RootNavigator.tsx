import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, StyleSheet, View } from 'react-native';

import { installedAppVersion } from '../appConfig/buildInfo';
import { useAppConfigQuery } from '../appConfig/useAppConfig';
import { isUpdateRequired } from '../appConfig/version';
import { useSession } from '../auth/SessionProvider';
import { ErrorState, Wordmark } from '../components';
import { useMetaQuery } from '../hooks/useMeta';
import { useLanguage, useTranslation } from '../i18n';
import { DeleteAccountScreen } from '../screens/account/DeleteAccountScreen';
import { DeletionRequestScreen } from '../screens/account/DeletionRequestScreen';
import { AuthScreen } from '../screens/auth/AuthScreen';
import { EmailAuthScreen } from '../screens/auth/EmailAuthScreen';
import { FavoritesScreen } from '../screens/favorites/FavoritesScreen';
import { AccountDeletedScreen, MaintenanceScreen, UpdateRequiredScreen } from '../screens/gate/GateScreens';
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
  const { status, user, restoreError, retryRestore, notice, dismissNotice } = useSession();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  // Meta is public: start fetching it immediately, once per app session.
  useMetaQuery();
  // Public app configuration: auth providers, links, maintenance, minimum versions.
  const configQuery = useAppConfigQuery();
  const config = configQuery.data;

  if (!config) {
    if (configQuery.isError) {
      return (
        <View style={styles.center}>
          <Wordmark size={26} />
          <ErrorState
            error={configQuery.error}
            title={t('errors.connectionFailed')}
            onRetry={() => void configQuery.refetch()}
          />
        </View>
      );
    }
    return (
      <View style={styles.center}>
        <Wordmark size={30} tagline />
      </View>
    );
  }

  if (config.maintenance.enabled) {
    return (
      <MaintenanceScreen
        config={config}
        onRetry={() => void configQuery.refetch()}
        retrying={configQuery.isFetching}
      />
    );
  }

  const installed = installedAppVersion();
  const required = Platform.OS === 'ios' ? config.minVersion.ios : Platform.OS === 'android' ? config.minVersion.android : null;
  if (installed && required && isUpdateRequired(installed, required)) {
    return <UpdateRequiredScreen config={config} installed={installed} required={required} />;
  }

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
        <ErrorState error={null} message={restoreError} title={t('errors.connectionFailed')} onRetry={retryRestore} />
      </View>
    );
  }

  const signedIn = status === 'signedIn' && user;

  if (!signedIn && notice?.kind === 'deleted') {
    return <AccountDeletedScreen onContinue={dismissNotice} />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        // Pushes come in from the trailing edge (Android needs the explicit mirror; iOS follows RTL natively).
        animation: isRTL && Platform.OS === 'android' ? 'slide_from_left' : 'slide_from_right',
      }}
    >
      {!signedIn ? (
        <>
          <Stack.Screen name="Auth" component={AuthScreen} options={{ animationTypeForReplace: 'pop' }} />
          <Stack.Screen name="EmailAuth" component={EmailAuthScreen} />
          <Stack.Screen name="DeletionRequest" component={DeletionRequestScreen} />
        </>
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
          <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
          <Stack.Screen name="DeletionRequest" component={DeletionRequestScreen} />
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
