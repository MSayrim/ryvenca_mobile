import { CheckCircle2 } from 'lucide-react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing } from '../theme';
import { Typography } from './Typography';

interface ToastContextValue {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => undefined });

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (text: string) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(text);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setMessage(null));
      }, 2400);
    },
    [opacity],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.wrap, { top: insets.top + spacing.xs, opacity }]}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          <View style={styles.toast}>
            <CheckCircle2 size={18} color={colors.surface} strokeWidth={1.5} />
            <Typography variant="bodyMedium" color={colors.surface}>
              {message}
            </Typography>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 1000 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadow.lifted,
  },
});
