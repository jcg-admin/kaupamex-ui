/**
 * Tests — chartTheme (Kaupamex UI)
 *
 * Verifican que la paleta de gráficos deriva de los tokens de marca
 * Yoruba (`_tokens.scss` → CSS vars `--c-*` / `_variables.scss` `$*`) y
 * que los hex heredados del prototipo (`#8b5e3c`, `#3c6e8b`) ya no
 * aparecen.
 */
import {
  BRAND_TOKENS,
  brandColor,
  getSeriesPalette,
  seriesPalette,
  chartColors,
} from './chartTheme';

// Hex del prototipo que NO pertenecen a la marca — no deben reaparecer.
const INHERITED_HEXES = ['#8b5e3c', '#3c6e8b'];

describe('chartTheme — tokens de marca', () => {
  it('expone los tokens de marca con sus hex de _tokens.scss', () => {
    expect(BRAND_TOKENS).toEqual({
      lime:   '#8CB800',
      vino:   '#7A1E1E',
      bronze: '#B89840',
      coral:  '#D86030',
      rust:   '#A07820',
    });
  });

  it('chartColors deriva de los tokens de marca, no de hex heredados', () => {
    expect(chartColors.revenue).toBe(BRAND_TOKENS.lime);
    expect(chartColors.orders).toBe(BRAND_TOKENS.vino);
  });

  it('elimina los hex heredados del prototipo (#8b5e3c / #3c6e8b)', () => {
    const allValues = [
      ...Object.values(BRAND_TOKENS),
      ...Object.values(chartColors),
      ...seriesPalette,
      ...getSeriesPalette(),
    ].map((v) => v.toLowerCase());
    INHERITED_HEXES.forEach((hex) => {
      expect(allValues).not.toContain(hex);
    });
  });

  it('seriesPalette ofrece 5 hues distintos para multi-serie', () => {
    expect(seriesPalette).toHaveLength(5);
    expect(new Set(seriesPalette).size).toBe(5);
    expect(seriesPalette).toEqual([
      BRAND_TOKENS.lime,
      BRAND_TOKENS.vino,
      BRAND_TOKENS.bronze,
      BRAND_TOKENS.coral,
      BRAND_TOKENS.rust,
    ]);
  });
});

describe('chartTheme — brandColor()', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--c-lime');
  });

  it('cae al fallback estático cuando la CSS var no está definida', () => {
    // jsdom: getComputedStyle no resuelve --c-lime salvo que se setee.
    expect(brandColor('lime')).toBe(BRAND_TOKENS.lime);
  });

  it('prefiere la CSS custom property de :root cuando está presente', () => {
    document.documentElement.style.setProperty('--c-lime', '#123456');
    expect(brandColor('lime')).toBe('#123456');
  });

  it('getSeriesPalette refleja el override de CSS var', () => {
    document.documentElement.style.setProperty('--c-lime', '#abcdef');
    expect(getSeriesPalette()[0]).toBe('#abcdef');
  });
});
