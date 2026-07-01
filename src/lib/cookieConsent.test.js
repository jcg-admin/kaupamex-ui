/**
 * Tests — cookieConsent.js (PracticaYoruba UI)
 *
 * Verifican el registro de consentimiento (LFPDPPP): opt-in por defecto,
 * escritura/lectura de la cookie `cookie_consent`, validez por version y por
 * antiguedad (12 meses), y normalizacion de elecciones.
 */
import {
  CONSENT_COOKIE,
  POLICY_VERSION,
  defaultChoices,
  allChoices,
  normalizeChoices,
  readConsent,
  writeConsent,
  isConsentValid,
  needsConsent,
  currentChoices,
} from './cookieConsent';

function clearCookies() {
  document.cookie
    .split('; ')
    .filter(Boolean)
    .forEach((row) => {
      const name = row.split('=')[0];
      document.cookie = `${name}=; Max-Age=0; Path=/`;
    });
}

beforeEach(clearCookies);

describe('defaults y normalizacion', () => {
  it('defaultChoices solo activa las necesarias (opt-in)', () => {
    expect(defaultChoices()).toEqual({
      necessary: true, functional: false, analytics: false, marketing: false,
    });
  });

  it('allChoices activa todo', () => {
    expect(allChoices()).toEqual({
      necessary: true, functional: true, analytics: true, marketing: true,
    });
  });

  it('normalizeChoices fuerza necessary=true e ignora claves desconocidas', () => {
    const out = normalizeChoices({ analytics: true, hacker: true });
    expect(out.necessary).toBe(true);
    expect(out.analytics).toBe(true);
    expect(out.functional).toBe(false);
    expect(out).not.toHaveProperty('hacker');
  });
});

describe('escritura y lectura', () => {
  it('writeConsent persiste version, ts ISO y choices', () => {
    const record = writeConsent({ analytics: true });
    expect(record.version).toBe(POLICY_VERSION);
    expect(record.choices.analytics).toBe(true);
    expect(() => new Date(record.ts).toISOString()).not.toThrow();
    expect(document.cookie).toContain(`${CONSENT_COOKIE}=`);

    const read = readConsent();
    expect(read.choices.analytics).toBe(true);
    expect(read.choices.marketing).toBe(false);
  });

  it('readConsent devuelve null sin cookie', () => {
    expect(readConsent()).toBeNull();
  });

  it('currentChoices refleja lo persistido', () => {
    writeConsent({ functional: true });
    expect(currentChoices().functional).toBe(true);
  });
});

describe('validez y necesidad de consentimiento', () => {
  it('needsConsent es true sin registro', () => {
    expect(needsConsent()).toBe(true);
  });

  it('needsConsent es false tras consentir', () => {
    writeConsent(defaultChoices());
    expect(needsConsent()).toBe(false);
  });

  it('isConsentValid rechaza otra version de politica', () => {
    expect(isConsentValid({ version: POLICY_VERSION + 1, ts: new Date().toISOString() }))
      .toBe(false);
  });

  it('isConsentValid rechaza un registro caducado (> 12 meses)', () => {
    const old = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString();
    expect(isConsentValid({ version: POLICY_VERSION, ts: old })).toBe(false);
  });

  it('isConsentValid acepta un registro reciente y de la version vigente', () => {
    expect(isConsentValid({ version: POLICY_VERSION, ts: new Date().toISOString() }))
      .toBe(true);
  });
});
