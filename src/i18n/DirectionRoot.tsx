import type { ReactNode } from 'react';

/**
 * Native: layout direction comes from I18nManager (forceRTL + reload), so nothing to wrap.
 * The web variant (DirectionRoot.web.tsx) provides react-native-web's direction context.
 */
export function DirectionRoot({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
