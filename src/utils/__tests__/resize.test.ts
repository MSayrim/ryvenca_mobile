import { MAX_UPLOAD_EDGE, computeResizeTarget, resizeActionFor } from '../resize';

describe('computeResizeTarget', () => {
  it('returns null when the image already fits', () => {
    expect(computeResizeTarget({ width: 1200, height: 1600 })).toBeNull();
    expect(computeResizeTarget({ width: 1600, height: 1600 })).toBeNull();
    expect(computeResizeTarget({ width: 800, height: 600 })).toBeNull();
  });

  it('scales portrait photos by the long (height) edge', () => {
    expect(computeResizeTarget({ width: 3024, height: 4032 })).toEqual({ width: 1200, height: 1600 });
  });

  it('scales landscape photos by the long (width) edge', () => {
    expect(computeResizeTarget({ width: 4032, height: 3024 })).toEqual({ width: 1600, height: 1200 });
  });

  it('preserves aspect ratio with rounding', () => {
    const t = computeResizeTarget({ width: 3000, height: 4001 })!;
    expect(t.height).toBe(MAX_UPLOAD_EDGE);
    expect(t.width).toBe(Math.round(3000 * (1600 / 4001)));
  });

  it('supports a custom max edge and ignores invalid input', () => {
    expect(computeResizeTarget({ width: 2000, height: 1000 }, 1000)).toEqual({ width: 1000, height: 500 });
    expect(computeResizeTarget({ width: 0, height: 1000 })).toBeNull();
    expect(computeResizeTarget({ width: NaN, height: 5000 })).toBeNull();
  });
});

describe('resizeActionFor', () => {
  it('passes only the long edge to the manipulator', () => {
    expect(resizeActionFor({ width: 3024, height: 4032 })).toEqual({ height: 1600 });
    expect(resizeActionFor({ width: 4032, height: 3024 })).toEqual({ width: 1600 });
    expect(resizeActionFor({ width: 4000, height: 4000 })).toEqual({ width: 1600 });
    expect(resizeActionFor({ width: 1000, height: 1000 })).toBeNull();
  });
});
