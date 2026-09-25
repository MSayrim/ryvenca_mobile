import { Search } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../theme';
import { IconButton } from './Buttons';
import { HangerIcon } from './HangerIcon';
import { Wordmark } from './Wordmark';

/**
 * Header on the main tabs: hanger (→ Dolabım) · centered wordmark + tagline · search (→ wardrobe search).
 */
export function AppHeader({ onPressHanger, onPressSearch }: { onPressHanger: () => void; onPressSearch: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
      <IconButton accessibilityLabel="Dolabım" onPress={onPressHanger}>
        <HangerIcon size={24} color={colors.ink} />
      </IconButton>
      <Wordmark size={19} tagline />
      <IconButton icon={Search} accessibilityLabel="Dolabında ara" onPress={onPressSearch} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
    backgroundColor: colors.background,
  },
});
