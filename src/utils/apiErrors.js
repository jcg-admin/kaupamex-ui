/**
 * API Error Types
 * Define todos los tipos de errores que pueden ocurrir en llamadas a API REST
 * 
 * Categorías:
 * - Network Errors: Problemas de conexión
 * - HTTP Errors: Respuestas de error del servidor
 * - Validation Errors: Errores de validación
 * - Business Logic Errors: Errores de lógica de negocio
 * - Parsing Errors: Errores al parsear respuestas
 */

/**
 * Base API Error Class
 */
export class APIError extends Error {
  constructor(message, code, statusCode = null, originalError = null) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
    
    // Mantener el stack trace en V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
    };
  }
}

// ============================================================================
// NETWORK ERRORS (Problemas de conexión)
// ============================================================================

/**
 * Error de timeout en la solicitud
 * Ocurre cuando: La solicitud tarda más de lo permitido
 */
export class TimeoutError extends APIError {
  constructor(duration = 30000) {
    super(
      `Request timeout after ${duration}ms`,
      'TIMEOUT',
      null
    );
    this.name = 'TimeoutError';
    this.duration = duration;
  }
}

/**
 * Error de conexión
 * Ocurre cuando: No hay conexión a internet, servidor no responde
 */
export class ConnectionError extends APIError {
  constructor(originalError = null) {
    super(
      'No connection to server. Please check your internet connection.',
      'CONNECTION_ERROR',
      null,
      originalError
    );
    this.name = 'ConnectionError';
  }
}

/**
 * Error de red genérico
 * Ocurre cuando: Falla en la transmisión de datos
 */
export class NetworkError extends APIError {
  constructor(message = 'Network error occurred', originalError = null) {
    super(message, 'NETWORK_ERROR', null, originalError);
    this.name = 'NetworkError';
  }
}

/**
 * Aborto de solicitud
 * Ocurre cuando: El usuario cancela la solicitud
 */
export class AbortError extends APIError {
  constructor() {
    super(
      'Request was aborted',
      'REQUEST_ABORTED',
      null
    );
    this.name = 'AbortError';
  }
}

// ============================================================================
// HTTP 4xx ERRORS (Client Errors)
// ============================================================================

/**
 * 400 Bad Request
 * Ocurre cuando: Datos inválidos enviados al servidor
 */
export class BadRequestError extends APIError {
  constructor(message = 'Invalid request', errors = {}) {
    super(message, 'BAD_REQUEST', 400);
    this.name = 'BadRequestError';
    this.validationErrors = errors;
  }
}

/**
 * 401 Unauthorized
 * Ocurre cuando: Usuario no autenticado o token expirado
 */
export class UnauthorizedError extends APIError {
  constructor(message = 'Unauthorized. Please login.') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * 403 Forbidden
 * Ocurre cuando: Usuario no tiene permisos para acceder al recurso
 */
export class ForbiddenError extends APIError {
  constructor(message = 'You do not have permission to access this resource.') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * 404 Not Found
 * Ocurre cuando: El recurso solicitado no existe
 */
export class NotFoundError extends APIError {
  constructor(resource = 'Resource', id = null) {
    const message = id 
      ? `${resource} with ID ${id} not found.`
      : `${resource} not found.`;
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
    this.resource = resource;
    this.resourceId = id;
  }
}

/**
 * 409 Conflict
 * Ocurre cuando: La solicitud entra en conflicto con el estado del servidor
 */
export class ConflictError extends APIError {
  constructor(message = 'Request conflicts with current state.') {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

/**
 * 422 Unprocessable Entity
 * Ocurre cuando: La validación falla (errores de formulario)
 */
export class ValidationError extends APIError {
  constructor(message = 'Validation failed', errors = {}) {
    super(message, 'VALIDATION_ERROR', 422);
    this.name = 'ValidationError';
    this.validationErrors = errors; // { field: [error messages] }
  }
}

/**
 * 429 Too Many Requests
 * Ocurre cuando: Rate limiting (demasiadas solicitudes)
 */
export class RateLimitError extends APIError {
  constructor(retryAfter = 60) {
    super(
      `Too many requests. Please try again in ${retryAfter} seconds.`,
      'RATE_LIMIT',
      429
    );
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

// ============================================================================
// HTTP 5xx ERRORS (Server Errors)
// ============================================================================

/**
 * 500 Internal Server Error
 * Ocurre cuando: Error no manejado en el servidor
 */
export class InternalServerError extends APIError {
  constructor(message = 'Internal server error. Please try again later.') {
    super(message, 'INTERNAL_SERVER_ERROR', 500);
    this.name = 'InternalServerError';
  }
}

/**
 * 502 Bad Gateway
 * Ocurre cuando: Gateway inválido (proxy/balancer issue)
 */
export class BadGatewayError extends APIError {
  constructor() {
    super(
      'Bad gateway. The server is temporarily unavailable.',
      'BAD_GATEWAY',
      502
    );
    this.name = 'BadGatewayError';
  }
}

/**
 * 503 Service Unavailable
 * Ocurre cuando: Servidor no disponible (mantenimiento, sobrecargado)
 */
export class ServiceUnavailableError extends APIError {
  constructor(message = 'Service temporarily unavailable. Please try again later.') {
    super(message, 'SERVICE_UNAVAILABLE', 503);
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * 504 Gateway Timeout
 * Ocurre cuando: Gateway timeout (servidor tardío)
 */
export class GatewayTimeoutError extends APIError {
  constructor() {
    super(
      'Gateway timeout. The server took too long to respond.',
      'GATEWAY_TIMEOUT',
      504
    );
    this.name = 'GatewayTimeoutError';
  }
}

/**
 * 5xx Server Error genérico
 * Ocurre cuando: Error del servidor sin status específico
 */
export class ServerError extends APIError {
  constructor(statusCode, message = 'Server error occurred.') {
    super(message, 'SERVER_ERROR', statusCode);
    this.name = 'ServerError';
  }
}

// ============================================================================
// PARSING ERRORS
// ============================================================================

/**
 * Error al parsear JSON
 * Ocurre cuando: Respuesta del servidor no es JSON válido
 */
export class ParseError extends APIError {
  constructor(originalError = null) {
    super(
      'Failed to parse server response',
      'PARSE_ERROR',
      null,
      originalError
    );
    this.name = 'ParseError';
  }
}

/**
 * Error de tipo de contenido
 * Ocurre cuando: Content-Type no es application/json
 */
export class ContentTypeError extends APIError {
  constructor(expectedType, receivedType) {
    super(
      `Expected ${expectedType} but received ${receivedType}`,
      'CONTENT_TYPE_ERROR',
      null
    );
    this.name = 'ContentTypeError';
    this.expectedType = expectedType;
    this.receivedType = receivedType;
  }
}

// ============================================================================
// BUSINESS LOGIC ERRORS
// ============================================================================

/**
 * Error de lógica de negocio
 * Ocurre cuando: La operación viola reglas de negocio
 */
export class BusinessLogicError extends APIError {
  constructor(message, code = 'BUSINESS_LOGIC_ERROR') {
    super(message, code, 400);
    this.name = 'BusinessLogicError';
  }
}

/**
 * Error: Recurso ya existe
 */
export class ResourceAlreadyExistsError extends BusinessLogicError {
  constructor(resource, identifier) {
    super(
      `${resource} with identifier '${identifier}' already exists.`,
      'RESOURCE_ALREADY_EXISTS'
    );
    this.name = 'ResourceAlreadyExistsError';
    this.resource = resource;
    this.identifier = identifier;
  }
}

/**
 * Error: Recurso en uso
 */
export class ResourceInUseError extends BusinessLogicError {
  constructor(resource) {
    super(
      `Cannot delete ${resource} because it is in use.`,
      'RESOURCE_IN_USE'
    );
    this.name = 'ResourceInUseError';
    this.resource = resource;
  }
}

/**
 * Error: Operación no permitida en estado actual
 */
export class InvalidStateError extends BusinessLogicError {
  constructor(message = 'Operation not allowed in current state.') {
    super(message, 'INVALID_STATE');
    this.name = 'InvalidStateError';
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Map HTTP status code a error class
 */
export function getErrorClassByStatusCode(statusCode) {
  const statusMap = {
    400: BadRequestError,
    401: UnauthorizedError,
    403: ForbiddenError,
    404: NotFoundError,
    409: ConflictError,
    422: ValidationError,
    429: RateLimitError,
    500: InternalServerError,
    502: BadGatewayError,
    503: ServiceUnavailableError,
    504: GatewayTimeoutError,
  };

  const ErrorClass = statusMap[statusCode] || ServerError;
  return ErrorClass;
}

/**
 * Create error from HTTP response
 */
export function createErrorFromResponse(response, originalError = null) {
  const statusCode = response?.status;
  const ErrorClass = getErrorClassByStatusCode(statusCode);

  if (statusCode === 422 || statusCode === 400) {
    // Validation error with field details
    try {
      const data = response?.data || {};
      return new ErrorClass(
        data.message || 'Validation failed',
        data.errors || {}
      );
    } catch {
      return new ErrorClass();
    }
  }

  try {
    const message = response?.data?.message || response?.statusText;
    if (statusCode >= 500) {
      return new ErrorClass(message);
    } else if (statusCode >= 400) {
      return new ErrorClass(message);
    }
  } catch {
    return new ErrorClass();
  }

  return new ServerError(statusCode);
}

/**
 * Determine if error is retryable
 */
export function isRetryableError(error) {
  const retryableErrors = [
    'TIMEOUT',
    'CONNECTION_ERROR',
    'NETWORK_ERROR',
    'RATE_LIMIT',
    'SERVICE_UNAVAILABLE',
    'BAD_GATEWAY',
    'GATEWAY_TIMEOUT',
  ];

  return retryableErrors.includes(error.code);
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error) {
  if (error instanceof ValidationError) {
    const fieldErrors = Object.entries(error.validationErrors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n');
    return fieldErrors || error.message;
  }

  if (error instanceof APIError) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Log error for debugging
 */
export function logError(error, context = {}) {
  const errorData = {
    timestamp: new Date().toISOString(),
    name: error.name,
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    context,
    stack: error.stack,
  };

  console.error('[API Error]', errorData);

  // Send to error tracking service (Sentry, etc)
  if (typeof window !== 'undefined' && window.errorTracker) {
    window.errorTracker.captureException(error, { extra: context });
  }

  return errorData;
}

export default {
  APIError,
  TimeoutError,
  ConnectionError,
  NetworkError,
  AbortError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  BadGatewayError,
  ServiceUnavailableError,
  GatewayTimeoutError,
  ServerError,
  ParseError,
  ContentTypeError,
  BusinessLogicError,
  ResourceAlreadyExistsError,
  ResourceInUseError,
  InvalidStateError,
  getErrorClassByStatusCode,
  createErrorFromResponse,
  isRetryableError,
  getErrorMessage,
  logError,
};
