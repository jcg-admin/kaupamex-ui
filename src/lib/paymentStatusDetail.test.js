/**
 * Tests — paymentStatusDetail (PG-02).
 */
import { paymentStatusDetail, STATUS_DETAIL_MESSAGES } from './paymentStatusDetail';

describe('paymentStatusDetail (PG-02)', () => {
  it('traduce el aprobado', () => {
    expect(paymentStatusDetail('accredited').t).toMatch(/aprobado/i);
  });

  it('traduce pendientes de método diferido', () => {
    expect(paymentStatusDetail('pending_waiting_payment').t).toMatch(/esperando/i);
    expect(paymentStatusDetail('pending_waiting_transfer').t).toMatch(/transferencia/i);
    expect(paymentStatusDetail('pending_contingency').t).toMatch(/revisión/i);
  });

  it('traduce los rechazos de tarjeta con mensaje accionable', () => {
    expect(paymentStatusDetail('cc_rejected_insufficient_amount').t).toMatch(/fondos/i);
    expect(paymentStatusDetail('cc_rejected_bad_filled_security_code').t).toMatch(/cvv/i);
    expect(paymentStatusDetail('cc_rejected_bad_filled_date').t).toMatch(/vencimiento/i);
    expect(paymentStatusDetail('cc_rejected_call_for_authorize').t).toMatch(/autoriz/i);
    expect(paymentStatusDetail('cc_rejected_high_risk').t).toMatch(/seguridad/i);
  });

  it('cae a un rechazo genérico ante un código desconocido (nunca undefined)', () => {
    const r = paymentStatusDetail('codigo_que_no_existe');
    expect(r).toBeDefined();
    expect(r.t).toBe(STATUS_DETAIL_MESSAGES.cc_rejected_other_reason.t);
  });

  it('cada entrada tiene título y detalle', () => {
    Object.values(STATUS_DETAIL_MESSAGES).forEach((m) => {
      expect(typeof m.t).toBe('string');
      expect(m.t.length).toBeGreaterThan(0);
      expect(typeof m.d).toBe('string');
      expect(m.d.length).toBeGreaterThan(0);
    });
  });
});
