import type { OutfitRole } from '../../api/types';
import { computeCollageLayout, pickHeroIndex, splitRest, type CollageRect } from '../collageLayout';

const W = 300;
const H = 330;
const GAP = 5;

function overlaps(a: CollageRect, b: CollageRect): boolean {
  const eps = 0.01;
  return a.x < b.x + b.width - eps && b.x < a.x + a.width - eps && a.y < b.y + b.height - eps && b.y < a.y + a.height - eps;
}

function assertValidLayout(roles: OutfitRole[], rects: CollageRect[]) {
  expect(rects).toHaveLength(roles.length);
  // every item placed exactly once
  expect(new Set(rects.map((r) => r.index)).size).toBe(roles.length);
  for (const r of rects) {
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.y).toBeGreaterThanOrEqual(0);
    expect(r.x + r.width).toBeLessThanOrEqual(W + 0.01);
    expect(r.y + r.height).toBeLessThanOrEqual(H + 0.01);
    expect(r.width).toBeGreaterThan(0);
    expect(r.height).toBeGreaterThan(0);
  }
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      expect(overlaps(rects[i]!, rects[j]!)).toBe(false);
    }
  }
}

describe('pickHeroIndex', () => {
  it('prefers OUTERWEAR, then DRESS, then TOP', () => {
    expect(pickHeroIndex(['TOP', 'BOTTOM', 'SHOES', 'OUTERWEAR'])).toBe(3);
    expect(pickHeroIndex(['DRESS', 'SHOES', 'BAG'])).toBe(0);
    expect(pickHeroIndex(['SHOES', 'TOP', 'BOTTOM'])).toBe(1);
  });

  it('falls back to the first item, or -1 when empty', () => {
    expect(pickHeroIndex(['BOTTOM', 'SHOES'])).toBe(0);
    expect(pickHeroIndex([])).toBe(-1);
  });
});

describe('splitRest', () => {
  it.each([
    [0, 0, 0],
    [2, 2, 0],
    [3, 3, 0],
    [4, 2, 2],
    [5, 3, 2],
    [6, 3, 3],
  ])('rest=%i → right=%i, bottom=%i', (rest, right, bottom) => {
    expect(splitRest(rest)).toEqual({ right, bottom });
  });
});

describe('computeCollageLayout', () => {
  const cases: OutfitRole[][] = [
    ['TOP', 'BOTTOM', 'SHOES'],
    ['OUTERWEAR', 'TOP', 'BOTTOM', 'SHOES'],
    ['OUTERWEAR', 'TOP', 'BOTTOM', 'SHOES', 'BAG'],
    ['OUTERWEAR', 'TOP', 'BOTTOM', 'SHOES', 'BAG', 'ACCESSORY'],
    ['OUTERWEAR', 'TOP', 'DRESS', 'BOTTOM', 'SHOES', 'BAG', 'ACCESSORY'],
  ];

  it.each(cases.map((c) => [c.length, c] as const))('lays out %i items without overlap inside the frame', (_n, roles) => {
    const rects = computeCollageLayout(roles, { width: W, height: H, gap: GAP });
    assertValidLayout([...roles], rects);
  });

  it('gives the hero ~60% width and the full height for 3 items', () => {
    const rects = computeCollageLayout(['TOP', 'BOTTOM', 'SHOES'], { width: W, height: H, gap: GAP });
    const hero = rects.find((r) => r.isHero)!;
    expect(hero.index).toBe(0);
    expect(hero.width).toBeCloseTo((W - GAP) * 0.6, 0);
    expect(hero.height).toBe(H);
    const right = rects.filter((r) => !r.isHero);
    expect(right).toHaveLength(2);
    right.forEach((r) => expect(r.x).toBeCloseTo(hero.width + GAP, 5));
  });

  it('uses OUTERWEAR as hero even when listed later', () => {
    const rects = computeCollageLayout(['TOP', 'BOTTOM', 'SHOES', 'OUTERWEAR'], { width: W, height: H, gap: GAP });
    expect(rects.find((r) => r.isHero)!.index).toBe(3);
  });

  it('adds a second row under the hero for 5+ items', () => {
    const rects = computeCollageLayout(['OUTERWEAR', 'TOP', 'BOTTOM', 'SHOES', 'BAG'], { width: W, height: H, gap: GAP });
    const hero = rects.find((r) => r.isHero)!;
    const below = rects.filter((r) => r.y >= hero.height);
    expect(below).toHaveLength(2); // rest=4 → 2 in the right column + 2 in the bottom row
    expect(hero.height).toBeLessThan(H);
    // bottom row spans the full width
    const bottomRight = Math.max(...below.map((r) => r.x + r.width));
    expect(bottomRight).toBeCloseTo(W, 5);
  });

  it('handles a single item and invalid sizes gracefully', () => {
    expect(computeCollageLayout(['DRESS'], { width: W, height: H })).toEqual([
      { index: 0, x: 0, y: 0, width: W, height: H, isHero: true },
    ]);
    expect(computeCollageLayout([], { width: W, height: H })).toEqual([]);
    expect(computeCollageLayout(['TOP', 'BOTTOM'], { width: 0, height: H })).toEqual([]);
  });
});
