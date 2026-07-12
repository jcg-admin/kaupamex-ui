/**
 * Tests de lib/deliveryEstimate — formato "Recíbelo" + matching de zona por C.P.
 * (G-ENV-02 / EP-02). La regla de negocio vive en el backend; aquí sólo formato.
 */
import { formatDeliveryLabel, matchZoneByCp } from '@lib/deliveryEstimate';

describe('formatDeliveryLabel', () => {
  it('same_day → "Recíbelo el <fecha>"', () => {
    const s = formatDeliveryLabel({ from: '2026-07-09', to: '2026-07-09', same_day: true });
    expect(s).toMatch(/^Recíbelo el /);
    expect(s).toContain('9');
    // No hay corrimiento de día por TZ (parse local, no UTC).
    expect(s).not.toContain('8');
  });

  it('rango → "Recíbelo entre el <a> y el <b>"', () => {
    const s = formatDeliveryLabel({ from: '2026-07-09', to: '2026-07-11', same_day: false });
    expect(s).toMatch(/^Recíbelo entre el .* y el /);
    expect(s).toContain('9');
    expect(s).toContain('11');
  });

  it('estimación nula → cadena vacía', () => {
    expect(formatDeliveryLabel(null)).toBe('');
    expect(formatDeliveryLabel({})).toBe('');
    expect(formatDeliveryLabel({ from: null })).toBe('');
  });
});

describe('matchZoneByCp', () => {
  const zones = [
    { id: 1, zip_code_prefix: '0', delivery_estimate: { from: '2026-07-09', to: '2026-07-09', same_day: true } },
    { id: 2, zip_code_prefix: '06', delivery_estimate: { from: '2026-07-09', to: '2026-07-10', same_day: false } },
    { id: 3, zip_code_prefix: '44', delivery_estimate: null },
  ];

  it('elige el prefijo más específico (más largo) que matchea', () => {
    // 06000 matchea '0' y '06' → gana '06'.
    expect(matchZoneByCp(zones, '06000')?.id).toBe(2);
  });

  it('matchea por prefijo simple', () => {
    expect(matchZoneByCp(zones, '44100')?.id).toBe(3);
  });

  it('ignora no-dígitos del C.P.', () => {
    expect(matchZoneByCp(zones, '06-000')?.id).toBe(2);
  });

  it('sin match → null', () => {
    expect(matchZoneByCp(zones, '99999')).toBeNull();
    expect(matchZoneByCp(zones, '')).toBeNull();
    expect(matchZoneByCp(null, '06000')).toBeNull();
  });
});
