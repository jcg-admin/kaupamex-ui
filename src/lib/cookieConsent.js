/**
 * cookieConsent — Kaupamex
 * Lectura/escritura del registro de consentimiento de cookies (LFPDPPP).
 *
 * El consentimiento se guarda en una cookie propia `cookie_consent`
 * (first-party, legible por JS) para que:
 *   - la UI decida si mostrar el banner, y
 *   - el servidor (CookieGovernanceMiddleware) la lea como fuente de
 *     consentimiento y no emita cookies no consentidas.
 *
 * Requisitos (analisis-ui-banner-consentimiento-cookies / LFPDPPP):
 *   - modelo opt-OUT: las categorias vienen activadas por defecto (ON) y la
 *     persona puede desactivar las no esenciales cuando quiera,
 *   - registro como prueba: ts ISO 8601 + choices por proposito + policyVersion,
 *   - validez 12 meses (luego se vuelve a pedir).
 *
 * La categoria "necessary" (sesion de servidor) esta siempre activa: es
 * estrictamente necesaria y exenta de consentimiento.
 */

export const CONSENT_COOKIE = 'cookie_consent';

/** Version de la politica de cookies. Subir invalida los consentimientos previos. */
export const POLICY_VERSION = 1;

/** Validez del consentimiento: 12 meses. */
export const CONSENT_MAX_AGE_DAYS = 365;
const CONSENT_MAX_AGE_MS = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

/**
 * Categorias de cookies. `necessary` es fija (no se puede desactivar);
 * el resto vienen activadas por defecto (opt-out) y la persona puede
 * desactivarlas cuando quiera.
 */
export const CATEGORIES = ['necessary', 'functional', 'analytics', 'marketing'];
export const OPTIONAL_CATEGORIES = CATEGORIES.filter((c) => c !== 'necessary');

/** Elecciones por defecto: todas activas (modelo opt-out). */
export function defaultChoices() {
  return { necessary: true, functional: true, analytics: true, marketing: true };
}

/** Todas las categorias activas (Aceptar todo). */
export function allChoices() {
  return { necessary: true, functional: true, analytics: true, marketing: true };
}

/** Solo lo estrictamente necesario (Rechazar las opcionales). */
export function necessaryOnlyChoices() {
  return { necessary: true, functional: false, analytics: false, marketing: false };
}

/**
 * Normaliza un mapa de elecciones: fuerza `necessary=true` y castea el resto a
 * boolean, ignorando claves desconocidas.
 */
export function normalizeChoices(choices = {}) {
  const out = defaultChoices();
  for (const cat of OPTIONAL_CATEGORIES) {
    out[cat] = Boolean(choices[cat]);
  }
  out.necessary = true;
  return out;
}

/** Lee y parsea el registro de consentimiento, o `null` si no existe/ilegible. */
export function readConsent() {
  if (typeof document === 'undefined') return null;
  const prefix = `${CONSENT_COOKIE}=`;
  const raw = document.cookie
    .split('; ')
    .find((row) => row.startsWith(prefix));
  if (!raw) return null;
  try {
    const value = decodeURIComponent(raw.slice(prefix.length));
    const record = JSON.parse(value);
    if (!record || typeof record !== 'object') return null;
    return record;
  } catch {
    return null;
  }
}

/**
 * ¿El registro es valido? Debe existir, coincidir la `version` de politica y no
 * haber caducado (12 meses desde `ts`).
 */
export function isConsentValid(record) {
  if (!record || record.version !== POLICY_VERSION || !record.ts) return false;
  const ts = Date.parse(record.ts);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts <= CONSENT_MAX_AGE_MS;
}

/** ¿Hace falta pedir consentimiento? (no hay registro valido). */
export function needsConsent() {
  return !isConsentValid(readConsent());
}

/**
 * Persiste las elecciones en la cookie `cookie_consent` con expiracion a 12
 * meses. Devuelve el registro escrito (prueba: version + ts + choices).
 */
export function writeConsent(choices) {
  const record = {
    version: POLICY_VERSION,
    ts: new Date().toISOString(),
    choices: normalizeChoices(choices),
  };
  if (typeof document !== 'undefined') {
    const value = encodeURIComponent(JSON.stringify(record));
    const secure = typeof location !== 'undefined' && location.protocol === 'https:'
      ? '; Secure'
      : '';
    document.cookie =
      `${CONSENT_COOKIE}=${value}; Max-Age=${Math.floor(CONSENT_MAX_AGE_MS / 1000)}` +
      `; Path=/; SameSite=Lax${secure}`;
  }
  return record;
}

/** Elecciones actuales normalizadas, o los defaults si no hay registro valido. */
export function currentChoices() {
  const record = readConsent();
  if (isConsentValid(record) && record.choices) {
    return normalizeChoices(record.choices);
  }
  return defaultChoices();
}
