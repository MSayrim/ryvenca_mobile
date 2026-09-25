import { LANGUAGE_CODES } from '../languages';

// Node built-ins (the project does not ship @types/node; only what this test needs is typed).
declare const require: (id: string) => unknown;
declare const __dirname: string;
const fs = require('fs') as { readFileSync(file: string, encoding: 'utf8'): string; readdirSync(dir: string): string[] };
const path = require('path') as { join(...parts: string[]): string };

/**
 * Locale files must stay structurally identical to the source (tr.json) so translators can work from
 * any of them: same keys, same {{placeholders}} per key. Plural keys may use any CLDR suffix
 * (_zero/_one/_two/_few/_many/_other) as the language needs, but must always keep `_other`.
 */

const LOCALES_DIR = path.join(__dirname, '..', '..', 'locales');
const NATIVE_DIR = path.join(LOCALES_DIR, 'native');
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;
const PLACEHOLDER = /\{\{\s*([^\s},]+)[^}]*\}\}/g;

type Flat = Record<string, string>;

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function flatten(value: unknown, prefix = '', out: Flat = {}): Flat {
  if (typeof value === 'string') {
    out[prefix] = value;
    return out;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`"${prefix}" must be a string or an object, got ${JSON.stringify(value)}`);
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key.includes('.')) throw new Error(`Key "${prefix}${key}" must not contain "."`);
    flatten(child, prefix ? `${prefix}.${key}` : key, out);
  }
  return out;
}

function placeholders(text: string): string[] {
  return [...new Set([...text.matchAll(PLACEHOLDER)].map((m) => m[1] as string))].sort();
}

interface Shape {
  plain: Map<string, string>;
  plural: Map<string, Map<string, string>>; // base → suffix → text
}

function shape(flat: Flat): Shape {
  const plain = new Map<string, string>();
  const plural = new Map<string, Map<string, string>>();
  for (const [key, text] of Object.entries(flat)) {
    const m = PLURAL_SUFFIX.exec(key);
    if (m) {
      const base = key.slice(0, -m[0].length);
      if (!plural.has(base)) plural.set(base, new Map());
      plural.get(base)?.set(m[1] as string, text);
    } else {
      plain.set(key, text);
    }
  }
  return { plain, plural };
}

const source = shape(flatten(readJson(path.join(LOCALES_DIR, 'tr.json'))));

describe('locale files', () => {
  it('exist for exactly the 16 supported languages', () => {
    const files = fs
      .readdirSync(LOCALES_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''))
      .sort();
    expect(files).toEqual([...LANGUAGE_CODES].sort());
  });

  it('source (tr) has plural forms for its categories and no empty strings', () => {
    expect(source.plain.size).toBeGreaterThan(100);
    for (const [base, forms] of source.plural) {
      expect(`${base}:${[...forms.keys()].sort().join(',')}`).toBe(`${base}:one,other`);
    }
  });

  it.each([...LANGUAGE_CODES])('%s.json has the same keys and placeholders as tr.json', (code) => {
    const locale = shape(flatten(readJson(path.join(LOCALES_DIR, `${code}.json`))));

    // Same plain keys, same plural bases.
    expect([...locale.plain.keys()].sort()).toEqual([...source.plain.keys()].sort());
    expect([...locale.plural.keys()].sort()).toEqual([...source.plural.keys()].sort());

    for (const [key, text] of locale.plain) {
      expect(`${key}: ${text.trim().length > 0}`).toBe(`${key}: true`);
      expect(`${key}: ${placeholders(text).join(',')}`).toBe(`${key}: ${placeholders(source.plain.get(key) ?? '').join(',')}`);
    }

    for (const [base, forms] of locale.plural) {
      expect(`${base}: has _other ${forms.has('other')}`).toBe(`${base}: has _other true`);
      const sourceVars = new Set([...(source.plural.get(base)?.values() ?? [])].flatMap(placeholders));
      const required = [...sourceVars].filter((v) => v !== 'count').sort();
      for (const [suffix, text] of forms) {
        const vars = placeholders(text);
        expect(`${base}_${suffix}: ${text.trim().length > 0}`).toBe(`${base}_${suffix}: true`);
        // Every form keeps the non-count variables; {{count}} may be omitted (e.g. Arabic "one"/"two").
        expect(`${base}_${suffix}: ${vars.filter((v) => v !== 'count').join(',')}`).toBe(
          `${base}_${suffix}: ${required.join(',')}`,
        );
        expect(vars.every((v) => sourceVars.has(v))).toBe(true);
      }
    }
  });

  it.each([...LANGUAGE_CODES])('native/%s.json (iOS permission texts) matches native/tr.json', (code) => {
    const reference = Object.keys(flatten(readJson(path.join(NATIVE_DIR, 'tr.json')))).sort();
    const locale = flatten(readJson(path.join(NATIVE_DIR, `${code}.json`)));
    expect(Object.keys(locale).sort()).toEqual(reference);
    expect(Object.values(locale).every((v) => v.trim().length > 0)).toBe(true);
  });
});
