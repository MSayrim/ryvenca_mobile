import { StyleSheet, View } from 'react-native';

import type { Garment } from '../api/types';
import { colors, radius } from '../theme';
import { GarmentPhoto } from './GarmentPhoto';
import { HangerIllustration } from './HangerIllustration';

const ROTATIONS = ['-6deg', '0deg', '5deg'] as const;

/** Overlapping stack of the user's own recent garments (white photo borders, soft shadow). */
export function FannedStack({ garments, width = 120 }: { garments: Garment[]; width?: number }) {
  const items = garments.slice(0, 3);
  if (items.length === 0) {
    return (
      <View style={[styles.empty, { width }]}>
        <HangerIllustration size={width} />
      </View>
    );
  }
  const cardWidth = width * 0.64;
  const offsets = items.length === 1 ? [0.18] : items.length === 2 ? [0.06, 0.3] : [0, 0.18, 0.36];
  return (
    <View style={{ width, height: cardWidth * 1.25 + 26 }} accessibilityLabel="Son eklediğin parçalar">
      {items.map((g, i) => (
        <View
          key={g.id}
          style={[
            styles.card,
            {
              width: cardWidth,
              left: width * (offsets[i] ?? 0),
              top: i === 1 ? 0 : 12,
              transform: [{ rotate: ROTATIONS[items.length === 1 ? 1 : i] ?? '0deg' }],
              zIndex: i === 1 ? 3 : i === 2 ? 2 : 1,
            },
          ]}
        >
          <GarmentPhoto uri={g.thumbnailUrl} radius={6} bordered={false} placeholderIconSize={18} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center' },
  card: {
    position: 'absolute',
    backgroundColor: colors.white,
    padding: 4,
    borderRadius: radius.sm,
    shadowColor: '#2A201B',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
});
