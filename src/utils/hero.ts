import type { Category, Garment } from '../api/types';

/** Garment categories that make the most recognisable hero picture, best first. */
const HERO_PRIORITY: readonly Category[] = ['OUTERWEAR', 'TOP', 'DRESS', 'BOTTOM', 'SHOES', 'BAG', 'ACCESSORY'];

/**
 * Up to `count` garments for the home hero: clothing before shoes/bags/accessories, newest first
 * within the same category, and at most one piece per category while alternatives exist.
 */
export function heroGarments(garments: readonly Garment[], count = 3): Garment[] {
  const rank = (g: Garment) => HERO_PRIORITY.indexOf(g.category);
  const sorted = garments
    .map((g, index) => ({ g, index }))
    .sort((a, b) => rank(a.g) - rank(b.g) || a.index - b.index)
    .map(({ g }) => g);
  const picked: Garment[] = [];
  for (const g of sorted) {
    if (picked.length < count && !picked.some((p) => p.category === g.category)) picked.push(g);
  }
  for (const g of sorted) {
    if (picked.length < count && !picked.includes(g)) picked.push(g);
  }
  return picked;
}
