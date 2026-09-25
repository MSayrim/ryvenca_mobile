import type { Meta } from '../../api/types';
import {
  buildLabels,
  clampScore,
  confidenceLabel,
  confidenceLevel,
  humanizeCode,
  initialOf,
  readinessProgress,
  scoreLabel,
  subcategoriesFor,
  toggleInList,
} from '../labels';

const meta: Meta = {
  wardrobeTypes: [
    { code: 'WOMEN', label: 'Kadın' },
    { code: 'MEN', label: 'Erkek' },
  ],
  styles: [{ code: 'SMART_CASUAL', label: 'Smart Casual', description: 'Rahat ama özenli' }],
  categories: [
    { code: 'TOP', label: 'Üst', pluralLabel: 'Üstler', subcategories: [{ code: 'SHIRT', label: 'Gömlek' }] },
    { code: 'OUTERWEAR', label: 'Ceket', pluralLabel: 'Ceketler', subcategories: [{ code: 'BLAZER', label: 'Blazer' }] },
  ],
  colors: [{ code: 'BEIGE', label: 'Bej', hex: '#CDB89A' }],
  seasons: [
    { code: 'SPRING', label: 'İlkbahar' },
    { code: 'AUTUMN', label: 'Sonbahar' },
  ],
  occasions: [{ code: 'OFFICE', label: 'Ofis' }],
};

describe('buildLabels', () => {
  const labels = buildLabels(meta);

  it('resolves labels from meta', () => {
    expect(labels.wardrobeType('WOMEN')).toBe('Kadın');
    expect(labels.style('SMART_CASUAL')).toBe('Smart Casual');
    expect(labels.category('OUTERWEAR')).toBe('Ceket');
    expect(labels.categoryPlural('TOP')).toBe('Üstler');
    expect(labels.subcategory('BLAZER', 'OUTERWEAR')).toBe('Blazer');
    expect(labels.subcategory('SHIRT')).toBe('Gömlek');
    expect(labels.color('BEIGE')).toBe('Bej');
    expect(labels.colorHex('BEIGE')).toBe('#CDB89A');
    expect(labels.season('AUTUMN')).toBe('Sonbahar');
    expect(labels.occasion('OFFICE')).toBe('Ofis');
    expect(labels.seasons(['SPRING', 'AUTUMN'])).toBe('İlkbahar, Sonbahar');
  });

  it('falls back to a humanized code for unknown values and handles empty input', () => {
    expect(labels.color('LIGHT_BLUE')).toBe('Light blue');
    expect(labels.subcategory('T_SHIRT', 'TOP')).toBe('T shirt');
    expect(labels.category(null)).toBe('');
    expect(buildLabels(undefined).season('WINTER')).toBe('Winter');
  });
});

describe('helpers', () => {
  it('humanizeCode', () => {
    expect(humanizeCode('SMART_CASUAL')).toBe('Smart casual');
    expect(humanizeCode('')).toBe('');
  });

  it('subcategoriesFor filters by category', () => {
    expect(subcategoriesFor(meta, 'TOP')).toEqual([{ code: 'SHIRT', label: 'Gömlek' }]);
    expect(subcategoriesFor(meta, 'SHOES')).toEqual([]);
    expect(subcategoriesFor(undefined, 'TOP')).toEqual([]);
    expect(subcategoriesFor(meta, null)).toEqual([]);
  });

  it('confidence levels and Turkish labels', () => {
    expect(confidenceLevel(0.82)).toBe('high');
    expect(confidenceLevel(0.7)).toBe('high');
    expect(confidenceLevel(0.5)).toBe('medium');
    expect(confidenceLevel(0.2)).toBe('low');
    expect(confidenceLevel(NaN)).toBe('low');
    expect(confidenceLabel(0.9)).toBe('yüksek güven');
    expect(confidenceLabel(0.45)).toBe('orta güven');
    expect(confidenceLabel(0.1)).toBe('düşük güven');
  });

  it('score formatting clamps and rounds', () => {
    expect(scoreLabel(92)).toBe('Uyum %92');
    expect(scoreLabel(91.6)).toBe('Uyum %92');
    expect(clampScore(140)).toBe(100);
    expect(clampScore(-3)).toBe(0);
  });

  it('readinessProgress', () => {
    expect(readinessProgress(3, 8)).toBeCloseTo(0.375);
    expect(readinessProgress(12, 8)).toBe(1);
    expect(readinessProgress(0, 0)).toBe(1);
  });

  it('initialOf uses Turkish upper-casing', () => {
    expect(initialOf('ayşe')).toBe('A');
    expect(initialOf('ipek')).toBe('İ');
    expect(initialOf('  ')).toBe('R');
  });

  it('toggleInList adds and removes', () => {
    expect(toggleInList(['A'], 'B')).toEqual(['A', 'B']);
    expect(toggleInList(['A', 'B'], 'A')).toEqual(['B']);
  });
});
