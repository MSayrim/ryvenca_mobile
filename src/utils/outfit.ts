import type { Garment, Outfit, OutfitRole } from '../api/types';

export const ROLE_ORDER: readonly OutfitRole[] = ['OUTERWEAR', 'TOP', 'DRESS', 'BOTTOM', 'SHOES', 'BAG', 'ACCESSORY'];

/** Garment ids of an outfit, sorted ascending (matches the backend `key`). */
export function outfitGarmentIds(outfit: Pick<Outfit, 'items'>): number[] {
  return outfit.items.map((i) => i.garment.id).sort((a, b) => a - b);
}

export function sortIds(ids: readonly number[]): number[] {
  return [...new Set(ids)].sort((a, b) => a - b);
}

/** Parses "3-12-40" style keys back into ids. */
export function idsFromKey(key: string): number[] {
  return sortIds(
    key
      .split(/[-,]/)
      .map((s) => Number(s))
      .filter((n) => Number.isInteger(n) && n > 0),
  );
}

/** Random positive 31-bit seed for "Suggest Again". */
export function randomSeed(): number {
  return Math.floor(Math.random() * 2_147_483_646) + 1;
}

/** Shallow-patch every Outfit with `key` inside an arbitrary query payload (lists, wrappers, home). */
export function patchOutfitsInData<T>(data: T, key: string, patch: Partial<Outfit>): T {
  const patchOutfit = (o: Outfit): Outfit => (o.key === key ? { ...o, ...patch } : o);
  const patchList = (list: unknown): unknown =>
    Array.isArray(list) ? list.map((o) => (isOutfit(o) ? patchOutfit(o) : o)) : list;

  if (data == null) return data;
  if (Array.isArray(data)) return patchList(data) as T;
  if (isOutfit(data)) return patchOutfit(data) as T;
  if (typeof data === 'object') {
    const record = data as Record<string, unknown>;
    let changed = false;
    const next: Record<string, unknown> = { ...record };
    for (const field of ['outfits', 'todaysSuggestions'] as const) {
      if (Array.isArray(record[field])) {
        next[field] = patchList(record[field]);
        changed = true;
      }
    }
    return (changed ? next : data) as T;
  }
  return data;
}

/** Shallow-patch every Garment with `id` inside an arbitrary query payload. */
export function patchGarmentsInData<T>(data: T, id: number, patch: Partial<Garment>): T {
  const visit = (value: unknown, depth: number): unknown => {
    if (depth > 5 || value == null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map((v) => visit(v, depth + 1));
    const record = value as Record<string, unknown>;
    if (isGarment(record)) return record.id === id ? { ...record, ...patch } : record;
    const next: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(record)) next[k] = visit(v, depth + 1);
    return next;
  };
  return visit(data, 0) as T;
}

function isOutfit(value: unknown): value is Outfit {
  return typeof value === 'object' && value !== null && 'key' in value && 'items' in value;
}

function isGarment(value: Record<string, unknown>): boolean {
  return typeof value.id === 'number' && 'subcategory' in value && 'imageId' in value;
}
