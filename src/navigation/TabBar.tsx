import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { House, Lightbulb, Plus, UserRound, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HangerIcon } from '../components/HangerIcon';
import { Typography } from '../components/Typography';
import { useTranslation } from '../i18n';
import { colors, fonts, shadow } from '../theme';
import type { MainTabParamList } from './types';

type TabName = keyof MainTabParamList;

const TABS = {
  Home: { label: 'tabs.home', icon: House },
  Wardrobe: { label: 'tabs.wardrobe', icon: 'hanger' },
  Upload: { label: 'tabs.upload', icon: 'plus' },
  Suggestions: { label: 'tabs.suggestions', icon: Lightbulb },
  Profile: { label: 'tabs.profile', icon: UserRound },
} as const satisfies Record<TabName, { label: `tabs.${string}`; icon: LucideIcon | 'hanger' | 'plus' }>;

/**
 * 5-tab bar with a raised round ink "+" (Upload) button in the center. The row follows the layout
 * direction, so in RTL the tabs are mirrored (Home on the right).
 */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]} accessibilityRole="tablist">
      {state.routes.map((route, index) => {
        const name = route.name as TabName;
        const config = TABS[name];
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        const color = focused ? colors.ink : colors.textMuted;

        if (config.icon === 'plus') {
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={t('tabs.uploadA11y')}
              style={styles.item}
            >
              <View style={styles.raised}>
                <Plus size={28} color={colors.surface} strokeWidth={1.8} />
              </View>
              <Typography style={[styles.label, { color }, focused && styles.labelActive]} numberOfLines={1}>
                {t(config.label)}
              </Typography>
            </Pressable>
          );
        }

        const Icon = config.icon;
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={t(config.label)}
            style={styles.item}
          >
            <View style={styles.iconWrap}>
              {Icon === 'hanger' ? (
                <HangerIcon size={24} color={color} strokeWidth={focused ? 1.8 : 1.5} />
              ) : (
                <Icon size={23} color={color} strokeWidth={focused ? 1.8 : 1.5} />
              )}
            </View>
            <Typography style={[styles.label, { color }, focused && styles.labelActive]} numberOfLines={1}>
              {t(config.label)}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 6,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', minHeight: 50, gap: 3 },
  iconWrap: { height: 28, alignItems: 'center', justifyContent: 'center' },
  raised: {
    width: 58,
    height: 58,
    borderRadius: 999,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
    borderWidth: 4,
    borderColor: colors.background,
    ...shadow.lifted,
  },
  label: { fontFamily: fonts.bodyMedium, fontSize: 11, lineHeight: 14 },
  labelActive: { fontFamily: fonts.bodySemiBold },
});
