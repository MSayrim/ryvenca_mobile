import type { OutfitRole } from '../api/types';

export interface CollageRect {
  /** Index into the original items array. */
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isHero: boolean;
}

export interface CollageOptions {
  width: number;
  height: number;
  gap?: number;
  /** Fraction of the width used by the hero column (default 0.6). */
  heroRatio?: number;
  /** Fraction of the height used by the top block when a second row is needed (default 0.68). */
  topRatio?: number;
}

/** Hero priority: OUTERWEAR, else DRESS, else TOP, else the first item. */
export function pickHeroIndex(roles: readonly OutfitRole[]): number {
  if (roles.length === 0) return -1;
  for (const preferred of ['OUTERWEAR', 'DRESS', 'TOP'] as const) {
    const i = roles.indexOf(preferred);
    if (i >= 0) return i;
  }
  return 0;
}

/**
 * Splits the non-hero items into a right column and an optional bottom row.
 * rest ≤ 3 → all in the right column; 4 → 2 + 2; 5 → 3 + 2; 6 → 3 + 3; more → 3 + (rest − 3).
 */
export function splitRest(restCount: number): { right: number; bottom: number } {
  if (restCount <= 3) return { right: restCount, bottom: 0 };
  const bottom = restCount === 4 ? 2 : restCount - 3;
  return { right: restCount - bottom, bottom };
}

function stack(count: number, total: number, gap: number): { offset: number; size: number }[] {
  if (count <= 0) return [];
  const size = (total - gap * (count - 1)) / count;
  return Array.from({ length: count }, (_, i) => ({ offset: i * (size + gap), size }));
}

/**
 * Editorial "mood board" layout for 1–7 outfit items:
 * a tall hero tile on the left (~60% width), the rest stacked in a right column (2–3 tiles),
 * and — for 5+ items — a second row spanning the full width under the hero block.
 */
export function computeCollageLayout(roles: readonly OutfitRole[], options: CollageOptions): CollageRect[] {
  const { width, height, gap = 5, heroRatio = 0.6, topRatio = 0.68 } = options;
  const n = roles.length;
  if (n === 0 || width <= 0 || height <= 0) return [];

  const heroIndex = pickHeroIndex(roles);
  if (n === 1) {
    return [{ index: heroIndex, x: 0, y: 0, width, height, isHero: true }];
  }

  const restIndices = roles.map((_, i) => i).filter((i) => i !== heroIndex);
  const { right, bottom } = splitRest(restIndices.length);

  const topHeight = bottom > 0 ? Math.round((height - gap) * topRatio) : height;
  const heroWidth = Math.round((width - gap) * heroRatio);
  const rightWidth = width - gap - heroWidth;

  const rects: CollageRect[] = [
    { index: heroIndex, x: 0, y: 0, width: heroWidth, height: topHeight, isHero: true },
  ];

  stack(right, topHeight, gap).forEach(({ offset, size }, i) => {
    rects.push({
      index: restIndices[i] as number,
      x: heroWidth + gap,
      y: offset,
      width: rightWidth,
      height: size,
      isHero: false,
    });
  });

  if (bottom > 0) {
    const bottomY = topHeight + gap;
    const bottomHeight = height - bottomY;
    stack(bottom, width, gap).forEach(({ offset, size }, i) => {
      rects.push({
        index: restIndices[right + i] as number,
        x: offset,
        y: bottomY,
        width: size,
        height: bottomHeight,
        isHero: false,
      });
    });
  }

  return rects;
}
