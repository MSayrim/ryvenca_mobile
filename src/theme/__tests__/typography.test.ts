import { StyleSheet, type TextStyle } from 'react-native';

import { fonts } from '../tokens';
import { resolveTextStyle, typographyProfile } from '../typography';

const flat = (style: unknown) => StyleSheet.flatten(style as TextStyle) as TextStyle;

describe('language-aware typography', () => {
  const heading: TextStyle = { fontFamily: fonts.display, fontSize: 28, lineHeight: 33, letterSpacing: -0.3 };
  const body: TextStyle = { fontFamily: fonts.bodySemiBold, fontSize: 15, lineHeight: 21 };
  const eyebrow: TextStyle = { fontFamily: fonts.bodySemiBold, fontSize: 11, lineHeight: 14, letterSpacing: 1.6 };
  const script: TextStyle = { fontFamily: fonts.script, fontSize: 21, lineHeight: 24 };

  it('keeps the brand fonts untouched for Latin languages', () => {
    for (const lang of ['tr', 'en', 'es', 'fr', 'pt', 'de', 'id']) {
      expect(resolveTextStyle(heading, typographyProfile(lang))).toBe(heading);
    }
  });

  it('switches to system fonts with explicit weights for scripts the brand fonts do not cover', () => {
    for (const lang of ['zh', 'ja', 'ko', 'hi', 'bn', 'ar', 'ur']) {
      const profile = typographyProfile(lang);
      const h = flat(resolveTextStyle(heading, profile));
      expect(h.fontFamily).toBeUndefined();
      expect(h.fontWeight).toBe('600');
      expect(h.letterSpacing).toBe(0);
      const b = flat(resolveTextStyle(body, profile));
      expect(b.fontFamily).toBeUndefined();
      expect(b.fontWeight).toBe('600');
      // Caveat accents fall back to the (system) body font at a smaller size.
      const s = flat(resolveTextStyle(script, profile));
      expect(s.fontFamily).toBeUndefined();
      expect(s.fontSize).toBeLessThan(21);
    }
  });

  it('raises line heights for tall scripts and drops tracking that breaks joining', () => {
    const ar = flat(resolveTextStyle(eyebrow, typographyProfile('ar')));
    expect(ar.letterSpacing).toBe(0);
    expect(ar.lineHeight).toBeGreaterThanOrEqual(Math.ceil(11 * 1.55));
    const hi = flat(resolveTextStyle(body, typographyProfile('hi')));
    expect(hi.lineHeight).toBeGreaterThanOrEqual(Math.ceil(15 * 1.55));
    const ur = flat(resolveTextStyle(body, typographyProfile('ur')));
    expect(ur.lineHeight).toBeGreaterThan(hi.lineHeight ?? 0);
  });

  it('keeps Inter/Caveat for Russian but replaces Fraunces (no Cyrillic) with a serif', () => {
    const profile = typographyProfile('ru');
    const h = flat(resolveTextStyle(heading, profile));
    expect(h.fontFamily).not.toBe(fonts.display);
    expect(h.fontFamily).toBeTruthy();
    expect(flat(resolveTextStyle(body, profile)).fontFamily).toBe(fonts.bodySemiBold);
    expect(flat(resolveTextStyle(script, profile)).fontFamily).toBe(fonts.script);
  });

  it('keeps Fraunces/Inter for Vietnamese but not Caveat', () => {
    const profile = typographyProfile('vi');
    expect(flat(resolveTextStyle(heading, profile)).fontFamily).toBe(fonts.display);
    expect(flat(resolveTextStyle(script, profile)).fontFamily).toBe(fonts.bodyMedium);
  });
});
