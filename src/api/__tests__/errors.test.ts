import { buildQueryString } from '../client';
import { ApiError, errorMessage, firstFieldError, genericErrorMessage, parseApiError } from '../errors';
import { normalizeBaseUrl } from '../../config';
import { i18n } from '../../i18n/i18n';

afterEach(async () => {
  await i18n.changeLanguage('tr');
});

describe('parseApiError', () => {
  it('parses the documented error body', () => {
    const body = JSON.stringify({
      status: 400,
      error: 'VALIDATION_ERROR',
      message: 'Türkçe açıklama',
      fieldErrors: { email: 'Geçerli bir e-posta gir' },
    });
    const err = parseApiError(400, body);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('Türkçe açıklama');
    expect(err.fieldErrors).toEqual({ email: 'Geçerli bir e-posta gir' });
    expect(firstFieldError(err)).toBe('Geçerli bir e-posta gir');
  });

  it('falls back to localized defaults (Turkish source language) for empty or non-JSON bodies', () => {
    const unauthorized = parseApiError(401, '');
    expect(unauthorized.code).toBe('UNAUTHORIZED');
    expect(unauthorized.isUnauthorized).toBe(true);
    expect(unauthorized.message).toMatch(/giriş/);

    const html = parseApiError(502, '<html>Bad gateway</html>');
    expect(html.code).toBe('INTERNAL_ERROR');
    expect(html.status).toBe(502);
    expect(html.message).toMatch(/Sunucuda/);

    const tooLarge = parseApiError(413, null);
    expect(tooLarge.code).toBe('PAYLOAD_TOO_LARGE');
    expect(tooLarge.message).toBe('Fotoğraf çok büyük. En fazla 15 MB yükleyebilirsin.');
  });

  it('uses the current UI language for client-side fallbacks', async () => {
    await i18n.changeLanguage('en');
    expect(parseApiError(401, '').message).toBe('Your session has expired. Please sign in again.');
    expect(parseApiError(413, null).message).toBe('The photo is too large. You can upload up to 15 MB.');
    expect(errorMessage('boom')).toBe('Something went wrong. Please try again.');
    // Server messages are already localized and are passed through untouched.
    expect(parseApiError(404, JSON.stringify({ error: 'NOT_FOUND', message: 'Pièce introuvable' })).message).toBe(
      'Pièce introuvable',
    );
  });

  it('ignores malformed fields', () => {
    const err = parseApiError(409, JSON.stringify({ error: 'CONFLICT', message: '  ', fieldErrors: { a: 1, b: 'ok' } }));
    expect(err.code).toBe('CONFLICT');
    expect(err.message).toBe('Bu işlem mevcut kayıtlarla çakışıyor.');
    expect(err.fieldErrors).toEqual({ b: 'ok' });
    expect(parseApiError(400, '[1,2]').fieldErrors).toEqual({});
  });

  it('errorMessage returns user-presentable text', () => {
    expect(errorMessage(new ApiError(404, 'NOT_FOUND', 'Parça bulunamadı'))).toBe('Parça bulunamadı');
    expect(errorMessage(new Error('TypeError: x is undefined'))).toBe(genericErrorMessage());
    expect(errorMessage('boom')).toBe('Bir şeyler ters gitti. Lütfen tekrar dene.');
    expect(firstFieldError(new Error('x'))).toBeNull();
  });
});

describe('buildQueryString', () => {
  it('joins arrays with commas and skips empty values', () => {
    expect(
      buildQueryString({ category: ['TOP', 'BOTTOM'], color: [], favorite: true, q: '', season: undefined, seed: 0 }),
    ).toBe('?category=TOP,BOTTOM&favorite=true&seed=0');
    expect(buildQueryString({ items: [3, 12, 40] })).toBe('?items=3,12,40');
    expect(buildQueryString({ q: 'bej blazer' })).toBe('?q=bej%20blazer');
    expect(buildQueryString(undefined)).toBe('');
  });
});

describe('normalizeBaseUrl', () => {
  it('defaults and trims trailing slashes', () => {
    expect(normalizeBaseUrl(undefined)).toBe('http://localhost:8080');
    expect(normalizeBaseUrl('  ')).toBe('http://localhost:8080');
    expect(normalizeBaseUrl('http://10.0.2.2:8080/')).toBe('http://10.0.2.2:8080');
  });
});
