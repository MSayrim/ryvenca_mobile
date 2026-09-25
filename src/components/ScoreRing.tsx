import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, fonts } from '../theme';
import { clampScore } from '../utils/labels';
import { Typography } from './Typography';

/** Circular "Uyum Skoru" ring: ink stroke on a beige track, number in Fraunces. */
export function ScoreRing({ score, size = 112, strokeWidth = 7, label = 'Uyum Skoru' }: {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string | null;
}) {
  const value = clampScore(score);
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = (value / 100) * circumference;
  return (
    <View style={{ width: size, height: size }} accessibilityRole="progressbar" accessibilityLabel={`${label ?? 'Uyum Skoru'} ${value}`} accessibilityValue={{ min: 0, max: 100, now: value }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.beige} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.ink}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        {label ? (
          <Typography variant="caption" color={colors.textMuted} style={styles.label}>
            {label.toLocaleUpperCase('tr-TR')}
          </Typography>
        ) : null}
        <Typography style={[styles.number, { fontSize: size * 0.32, lineHeight: size * 0.38 }]}>{value}</Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 9.5, letterSpacing: 0.4 },
  number: { fontFamily: fonts.display, color: colors.ink },
});
