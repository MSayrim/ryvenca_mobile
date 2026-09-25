import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useSession } from '../auth/SessionProvider';
import { useTranslation } from '../i18n';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SuggestionsScreen } from '../screens/suggestions/SuggestionsScreen';
import { UploadScreen } from '../screens/upload/UploadScreen';
import { WardrobeScreen } from '../screens/wardrobe/WardrobeScreen';
import { colors } from '../theme';
import { TabBar } from './TabBar';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const { landingTab } = useSession();
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      initialRouteName={landingTab}
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('tabs.home') }} />
      <Tab.Screen name="Wardrobe" component={WardrobeScreen} options={{ title: t('tabs.wardrobe') }} />
      <Tab.Screen name="Upload" component={UploadScreen} options={{ title: t('tabs.uploadA11y') }} />
      <Tab.Screen name="Suggestions" component={SuggestionsScreen} options={{ title: t('tabs.suggestions') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('tabs.profile') }} />
    </Tab.Navigator>
  );
}
