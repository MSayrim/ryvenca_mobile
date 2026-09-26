import * as AppleAuthentication from 'expo-apple-authentication';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '../../theme';

/**
 * The system Sign in with Apple button (Apple HIG: native control, black style, "Continue with Apple"
 * label localized by iOS). Only rendered on iOS when available (see useAuthOptions).
 */
export function AppleSignInButton({
  onPress,
  loading,
  disabled,
}: {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.wrap, (disabled || loading) && styles.inactive]} pointerEvents={disabled || loading ? 'none' : 'auto'}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={25}
        style={styles.button}
        onPress={onPress}
      />
      {loading ? (
        <View style={styles.spinner} pointerEvents="none">
          <ActivityIndicator color={colors.white} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  inactive: { opacity: 0.6 },
  button: { width: '100%', height: 50 },
  spinner: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    end: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
});
