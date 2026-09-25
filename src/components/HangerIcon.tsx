import Svg, { Path } from 'react-native-svg';

import { colors } from '../theme';

export interface HangerIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/** Brand motif: thin-line clothes hanger (24×24 grid, lucide-compatible stroke). */
export function HangerIcon({ size = 24, color = colors.ink, strokeWidth = 1.5 }: HangerIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.6 5.4a2.4 2.4 0 1 1 3.3 2.2c-.55.23-.9.76-.9 1.36V9.6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 9.6 2.9 16.1a1.1 1.1 0 0 0 .64 2H20.46a1.1 1.1 0 0 0 .64-2L12 9.6Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
