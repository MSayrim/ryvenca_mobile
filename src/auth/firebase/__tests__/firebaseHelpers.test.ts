import { ApiError } from '../../../api/errors';
import { i18n } from '../../../i18n/i18n';
import { AuthFlowError, authErrorMessage, firebaseErrorReason, toAuthFlowError } from '../errors';
import { NONCE_CHARSET, createAppleNonce, displayNameFromParts, nonceFromBytes } from '../nonce';

// Node built-ins (the project does not ship @types/node; only what this test needs is typed).
declare const require: (id: string) => unknown;
const nodeCrypto = require('crypto') as {
  createHash(alg: string): { update(value: string, enc: string): { digest(enc: string): string } };
  randomBytes(count: number): Uint8Array;
};
const sha256Hex = async (value: string) => nodeCrypto.createHash('sha256').update(value, 'utf8').digest('hex');

afterEach(async () => {
  await i18n.changeLanguage('tr');
});

describe('Apple nonce', () => {
  it('maps bytes onto the charset', () => {
    expect(nonceFromBytes([0, 1, 63, 64, 255], 5)).toBe('01_0_');
    expect(nonceFromBytes([10, 36], 1)).toBe(NONCE_CHARSET[10]);
    expect(NONCE_CHARSET).toHaveLength(64);
  });

  it('creates a 32 character raw nonce and its SHA-256 hex digest', async () => {
    const nonce = await createAppleNonce({ randomBytes: (n) => nodeCrypto.randomBytes(n), sha256Hex });
    expect(nonce.raw).toHaveLength(32);
    expect(nonce.raw).toMatch(/^[0-9A-Za-z_-]{32}$/);
    expect(nonce.hashed).toBe(await sha256Hex(nonce.raw));
    expect(nonce.hashed).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces a different nonce every time', async () => {
    const deps = { randomBytes: (n: number) => nodeCrypto.randomBytes(n), sha256Hex };
    const [a, b] = await Promise.all([createAppleNonce(deps), createAppleNonce(deps)]);
    expect(a.raw).not.toBe(b.raw);
  });

  it('builds the display name from Apple name parts', () => {
    expect(displayNameFromParts({ givenName: 'Ayşe', familyName: 'Yılmaz' })).toBe('Ayşe Yılmaz');
    expect(displayNameFromParts({ givenName: ' Ali ', middleName: null, familyName: '' })).toBe('Ali');
    expect(displayNameFromParts({ nickname: 'ay' })).toBe('ay');
    expect(displayNameFromParts({ givenName: null, familyName: null })).toBeNull();
    expect(displayNameFromParts(null)).toBeNull();
  });
});

describe('Firebase error mapping', () => {
  it('maps Firebase codes to reasons', () => {
    expect(firebaseErrorReason('auth/invalid-credential')).toBe('wrongCredentials');
    expect(firebaseErrorReason('auth/wrong-password')).toBe('wrongCredentials');
    expect(firebaseErrorReason('auth/email-already-in-use')).toBe('emailInUse');
    expect(firebaseErrorReason('weak-password')).toBe('weakPassword');
    expect(firebaseErrorReason('auth/network-request-failed')).toBe('network');
    expect(firebaseErrorReason('auth/account-exists-with-different-credential')).toBe('accountExists');
    expect(firebaseErrorReason('auth/something-new')).toBe('generic');
    expect(firebaseErrorReason(null)).toBe('generic');
  });

  it('produces localized messages (tr source, en)', async () => {
    const error = { code: 'auth/email-already-in-use', message: '[auth/email-already-in-use] native text' };
    expect(authErrorMessage(error)).toBe('Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.');
    await i18n.changeLanguage('en');
    expect(authErrorMessage(error)).toBe('An account with this email already exists. Try signing in.');
    expect(authErrorMessage(new Error('boom'))).toBe('Sign-in could not be completed. Please try again.');
  });

  it('keeps server errors (already localized) and AuthFlowErrors untouched', () => {
    const server = new ApiError(403, 'ACCOUNT_DISABLED', 'Hesabın devre dışı bırakıldı.');
    expect(toAuthFlowError(server)).toBe(server);
    expect(authErrorMessage(server)).toBe('Hesabın devre dışı bırakıldı.');
    const flow = new AuthFlowError('appleFailed');
    expect(toAuthFlowError(flow)).toBe(flow);
    expect(flow.reason).toBe('appleFailed');
  });

  it('uses the fallback reason for unknown errors', () => {
    const converted = toAuthFlowError({ code: 'ERR_WHATEVER' }, 'googleFailed');
    expect(converted).toBeInstanceOf(AuthFlowError);
    expect((converted as AuthFlowError).reason).toBe('googleFailed');
  });
});
