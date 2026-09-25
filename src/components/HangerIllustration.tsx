import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '../theme';

/** Line-art hanger illustration for empty states / empty hero. */
export function HangerIllustration({ size = 140 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 140 140" fill="none">
      <Circle cx={70} cy={74} r={56} fill={colors.cream} />
      <Circle cx={112} cy={30} r={4} fill={colors.beige} />
      <Circle cx={24} cy={46} r={2.5} fill={colors.sand} />
      <Path
        d="M60 38a10 10 0 1 1 13.8 9.25c-2.3.95-3.8 3.2-3.8 5.7V57"
        stroke={colors.brown}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M70 57 30 85.5c-3.3 2.35-1.64 7.5 2.4 7.5h75.2c4.04 0 5.7-5.15 2.4-7.5L70 57Z"
        stroke={colors.brown}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* draped scarf */}
      <Path
        d="M48 72c4 10 3 22-2 32M92 72c-4 10-3 22 2 32"
        stroke={colors.sand}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="1 5"
      />
      <Path d="M40 112h60" stroke={colors.beige} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
