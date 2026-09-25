import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useSession } from '../auth/SessionProvider';
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
  return (
    <Tab.Navigator
      initialRouteName={landingTab}
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Ana Sayfa' }} />
      <Tab.Screen name="Wardrobe" component={WardrobeScreen} options={{ title: 'Dolabım' }} />
      <Tab.Screen name="Upload" component={UploadScreen} options={{ title: 'Kıyafet Yükle' }} />
      <Tab.Screen name="Suggestions" component={SuggestionsScreen} options={{ title: 'Öneriler' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}
