/**
 * serializeApiError — pruebas unitarias
 */
import {
  APIError,
  TimeoutError,
  NetworkError,
  ValidationError,
  NotFoundError,
  ConflictError,
  InternalServerError,
} from '@utils/apiErrors';
import { serializeApiError } from '@utils/serializeApiError';

describe('serializeApiError', () => {
  it('serializa TimeoutError con su code', () => {
    const out = serializeApiError(new TimeoutError(5000));
    expect(out.code).toBe('TIMEOUT');
    expect(out.statusCode).toBeNull();
    expect(out.name).toBe('TimeoutError');
  });

  it('serializa NetworkError', () => {
    const out = serializeApiError(new NetworkError('Boom'));
    expect(out.code).toBe('NETWORK_ERROR');
    expect(out.message).toBe('Boom');
  });

  it('serializa ValidationError preservando validationErrors', () => {
    const out = serializeApiError(
      new ValidationError('Datos invalidos', { code: ['ya existe'] }),
    );
    expect(out.statusCode).toBe(422);
    expect(out.code).toBe('VALIDATION_ERROR');
    expect(out.validationErrors).toEqual({ code: ['ya existe'] });
  });

  it('serializa NotFoundError', () => {
    const out = serializeApiError(new NotFoundError('Ticket', 42));
    expect(out.statusCode).toBe(404);
    expect(out.code).toBe('NOT_FOUND');
  });

  it('serializa ConflictError', () => {
    const out = serializeApiError(new ConflictError('Estado invalido'));
    expect(out.statusCode).toBe(409);
    expect(out.code).toBe('CONFLICT');
  });

  it('serializa InternalServerError', () => {
    const out = serializeApiError(new InternalServerError());
    expect(out.statusCode).toBe(500);
    expect(out.code).toBe('INTERNAL_SERVER_ERROR');
  });

  it('serializa APIError generico', () => {
    const out = serializeApiError(new APIError('x', 'X', 418));
    expect(out.statusCode).toBe(418);
    expect(out.code).toBe('X');
  });

  it('serializa error legacy con body.detail (DRF)', () => {
    const out = serializeApiError({
      status: 400,
      body:   { detail: 'Cupon duplicado' },
      message: 'HTTP 400',
    });
    expect(out.message).toBe('Cupon duplicado');
    expect(out.statusCode).toBe(400);
  });

  it('serializa Error nativo a forma plana', () => {
    const out = serializeApiError(new Error('algo fallo'));
    expect(out.message).toBe('algo fallo');
    expect(out.code).toBe('UNKNOWN');
    expect(out.statusCode).toBeNull();
  });

  it('serializa undefined a fallback', () => {
    const out = serializeApiError(undefined);
    expect(out.message).toBe('Error inesperado.');
    expect(out.code).toBe('UNKNOWN');
  });
});
