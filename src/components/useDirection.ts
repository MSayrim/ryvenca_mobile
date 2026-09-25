import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react-native';

import { useLanguage } from '../i18n';

/**
 * Direction-aware icons/glyphs for the current layout: "forward" points right in LTR and left in RTL
 * (ar, ur); the back chevron is mirrored accordingly.
 */
export function useDirection() {
  const { isRTL } = useLanguage();
  return {
    isRTL,
    ForwardArrow: isRTL ? ArrowLeft : ArrowRight,
    BackChevron: isRTL ? ChevronRight : ChevronLeft,
    ForwardChevron: isRTL ? ChevronLeft : ChevronRight,
    /** Text arrow for inline links ("See All →"). */
    arrow: isRTL ? '←' : '→',
  };
}
