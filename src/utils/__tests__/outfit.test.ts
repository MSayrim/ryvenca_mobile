import type { Garment, Outfit } from '../../api/types';
import { idsFromKey, outfitGarmentIds, patchGarmentsInData, patchOutfitsInData, randomSeed, sortIds } from '../outfit';
import { resolveMediaUrl } from '../media';

function garment(id: number, extra: Partial<Garment> = {}): Garment {
  return {
    id,
    name: null,
    displayName: `Parça ${id}`,
    category: 'TOP',
    subcategory: 'SHIRT',
    color: 'BEIGE',
    colorHex: '#C8B596',
    colorSource: 'AUTO',
    pattern: false,
    seasons: [],
    occasions: [],
    favorite: false,
    imageId: `img-${id}`,
    imageUrl: `http://localhost:8080/media/${id}-display.jpg`,
    thumbnailUrl: `http://localhost:8080/media/${id}-thumb.jpg`,
    createdAt: '',
    updatedAt: '',
    ...extra,
  };
}

function outfit(ids: number[], extra: Partial<Outfit> = {}): Outfit {
  return {
    key: [...ids].sort((a, b) => a - b).join('-'),
    title: 'Zamansız Şıklık',
    description: '',
    score: 90,
    breakdown: [],
    style: 'CLASSIC',
    styleLabel: 'Classic',
    primaryOccasion: 'OFFICE',
    occasions: [],
    venues: [],
    items: ids.map((id) => ({ role: 'TOP' as const, garment: garment(id) })),
    palette: [],
    paletteName: null,
    reasons: [],
    saved: false,
    savedId: null,
    ...extra,
  };
}

describe('outfit ids', () => {
  it('outfitGarmentIds sorts ascending', () => {
    expect(outfitGarmentIds(outfit([40, 3, 12]))).toEqual([3, 12, 40]);
  });
  it('sortIds de-duplicates', () => {
    expect(sortIds([5, 1, 5, 3])).toEqual([1, 3, 5]);
  });
  it('idsFromKey parses dash or comma keys', () => {
    expect(idsFromKey('3-12-40')).toEqual([3, 12, 40]);
    expect(idsFromKey('40,3,x')).toEqual([3, 40]);
  });
  it('randomSeed is a positive integer', () => {
    const s = randomSeed();
    expect(Number.isInteger(s)).toBe(true);
    expect(s).toBeGreaterThan(0);
  });
});

describe('patchOutfitsInData', () => {
  const a = outfit([1, 2, 3]);
  const b = outfit([4, 5, 6]);

  it('patches arrays, wrappers and single outfits by key', () => {
    expect(patchOutfitsInData([a, b], a.key, { saved: true })[0]!.saved).toBe(true);
    const wrapped = patchOutfitsInData({ outfits: [a, b], season: 'AUTUMN' }, b.key, { savedId: 9 });
    expect(wrapped.outfits[1]!.savedId).toBe(9);
    expect(wrapped.outfits[0]).toBe(a);
    expect(patchOutfitsInData(a, a.key, { saved: true }).saved).toBe(true);
    const home = patchOutfitsInData({ todaysSuggestions: [a] }, a.key, { saved: true });
    expect(home.todaysSuggestions[0]!.saved).toBe(true);
  });

  it('leaves unrelated data untouched', () => {
    expect(patchOutfitsInData(undefined, a.key, { saved: true })).toBeUndefined();
    const other = { stats: { garmentCount: 1 } };
    expect(patchOutfitsInData(other, a.key, { saved: true })).toBe(other);
  });
});

describe('patchGarmentsInData', () => {
  it('patches garments nested in lists, outfits and pairings', () => {
    const data = { anchor: garment(1), outfits: [outfit([1, 2])], list: [garment(2), garment(1)] };
    const next = patchGarmentsInData(data, 1, { favorite: true });
    expect(next.anchor.favorite).toBe(true);
    expect(next.outfits[0]!.items[0]!.garment.favorite).toBe(true);
    expect(next.outfits[0]!.items[1]!.garment.favorite).toBe(false);
    expect(next.list[1]!.favorite).toBe(true);
    expect(data.anchor.favorite).toBe(false);
  });
});

describe('resolveMediaUrl', () => {
  it('rewrites loopback media URLs to the configured API host', () => {
    expect(resolveMediaUrl('http://localhost:8080/media/a.jpg', 'http://10.0.2.2:8080')).toBe('http://10.0.2.2:8080/media/a.jpg');
    expect(resolveMediaUrl('http://127.0.0.1:8080/media/a.jpg', 'http://192.168.1.20:8080')).toBe(
      'http://192.168.1.20:8080/media/a.jpg',
    );
  });
  it('keeps absolute non-loopback URLs and loopback-to-loopback as-is', () => {
    expect(resolveMediaUrl('https://cdn.example.com/a.jpg', 'http://10.0.2.2:8080')).toBe('https://cdn.example.com/a.jpg');
    expect(resolveMediaUrl('http://localhost:8080/media/a.jpg', 'http://localhost:8080')).toBe('http://localhost:8080/media/a.jpg');
  });
  it('handles relative and empty URLs', () => {
    expect(resolveMediaUrl('/media/a.jpg', 'http://x:1')).toBe('http://x:1/media/a.jpg');
    expect(resolveMediaUrl(null, 'http://x:1')).toBeNull();
  });
});
