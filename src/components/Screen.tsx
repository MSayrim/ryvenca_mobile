import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '../theme';

/** Page container with the warm background. Headers handle the top safe area. */
export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function Centered({ children }: { children: ReactNode }) {
  return <View style={styles.centered}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
