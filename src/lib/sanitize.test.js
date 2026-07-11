/**
 * Tests — sanitize.js (PracticaYoruba UI)
 *
 * Verifican la política XSS central: DOMPurify corre sobre el jsdom de
 * jest. Aseguran que (a) los scripts se eliminan, (b) la allowlist de
 * formato inline se respeta, (c) atributos peligrosos se descartan.
 */
import { sanitizeHtml, SANITIZE_CONFIG } from './sanitize';

describe('sanitizeHtml', () => {
  it('elimina etiquetas script', () => {
    const out = sanitizeHtml('<p>hola</p><script>alert(1)</script>');
    expect(out).not.toMatch(/<script/i);
    expect(out).not.toMatch(/alert\(1\)/);
    expect(out).toContain('<p>hola</p>');
  });

  it('respeta la allowlist de formato inline', () => {
    const out = sanitizeHtml('texto <strong>en negrita</strong> y <em>cursiva</em>');
    expect(out).toContain('<strong>en negrita</strong>');
    expect(out).toContain('<em>cursiva</em>');
  });

  it('descarta iframe pero conserva img (sin handlers)', () => {
    const out = sanitizeHtml('<img src="/x.jpg" onerror=alert(1)><iframe src="evil"></iframe>texto');
    expect(out).not.toMatch(/<iframe/i);
    expect(out).not.toMatch(/onerror/i);   // handler descartado
    expect(out).toMatch(/<img[^>]*src="\/x\.jpg"/i);  // img permitida, src seguro
    expect(out).toContain('texto');
  });

  it('permite enlaces http(s) pero bloquea javascript:', () => {
    const ok = sanitizeHtml('<a href="https://ejemplo.mx">ir</a>');
    expect(ok).toMatch(/<a[^>]*href="https:\/\/ejemplo\.mx"/i);
    const evil = sanitizeHtml('<a href="javascript:steal()">x</a>');
    expect(evil).not.toMatch(/javascript:/i);
  });

  it('fuerza rel=noopener en enlaces target=_blank (anti-tabnabbing)', () => {
    const out = sanitizeHtml('<a href="https://ejemplo.mx" target="_blank">ir</a>');
    expect(out).toMatch(/rel="noopener noreferrer"/i);
  });

  it('conserva encabezados y cita permitidos', () => {
    const out = sanitizeHtml('<h2>Título</h2><blockquote>cita</blockquote>');
    expect(out).toContain('<h2>Título</h2>');
    expect(out).toContain('<blockquote>cita</blockquote>');
  });

  it('descarta handlers de evento inline', () => {
    const out = sanitizeHtml('<span onclick="steal()">click</span>');
    expect(out).not.toMatch(/onclick/i);
    expect(out).toContain('click');
  });

  it('conserva listas permitidas', () => {
    const out = sanitizeHtml('<ul><li>uno</li><li>dos</li></ul>');
    expect(out).toContain('<ul>');
    expect(out).toContain('<li>uno</li>');
  });

  it('retorna cadena vacia para null/undefined', () => {
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
  });

  it('coacciona valores no-string a string sin romper', () => {
    expect(sanitizeHtml(42)).toBe('42');
  });

  it('expone una config con allowlist no vacia', () => {
    expect(Array.isArray(SANITIZE_CONFIG.ALLOWED_TAGS)).toBe(true);
    expect(SANITIZE_CONFIG.ALLOWED_TAGS).toContain('strong');
    expect(SANITIZE_CONFIG.ALLOWED_TAGS).not.toContain('script');
  });
});
