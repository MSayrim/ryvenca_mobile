import type { Garment } from '../../api/types';
import { heroGarments } from '../hero';

const g = (id: number, category: Garment['category']) => ({ id, category }) as Garment;

describe('heroGarments', () => {
  it('prefers clothing over shoes and bags, one per category', () => {
    const recent = [g(1, 'BAG'), g(2, 'SHOES'), g(3, 'TOP'), g(4, 'TOP'), g(5, 'OUTERWEAR'), g(6, 'BOTTOM')];
    expect(heroGarments(recent).map((x) => x.id)).toEqual([5, 3, 6]);
  });

  it('fills up with repeats when there are few categories', () => {
    expect(heroGarments([g(1, 'TOP'), g(2, 'TOP'), g(3, 'SHOES')]).map((x) => x.id)).toEqual([1, 3, 2]);
    expect(heroGarments([])).toEqual([]);
  });
});
