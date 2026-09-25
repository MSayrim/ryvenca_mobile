import { View } from 'react-native';

import { colors } from '../theme';

/** Small garment color dot with a white 2px ring. */
export function ColorDot({ hex, size = 12, ring = 2 }: { hex: string; size?: number; ring?: number }) {
  return (
    <View
      style={{
        width: size + ring * 2,
        height: size + ring * 2,
        borderRadius: 999,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 999,
          backgroundColor: hex,
          borderWidth: 0.5,
          borderColor: 'rgba(0,0,0,0.08)',
        }}
      />
    </View>
  );
}
