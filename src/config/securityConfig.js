/**
 * Security Configuration
 * Configuracion centralizada de seguridad
 */

// Content Security Policy
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", 'https://fonts.googleapis.com'],
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'connect-src': ["'self'"],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'upgrade-insecure-requests': [],
};

// Generar CSP header string
export const generateCSPHeader = () => {
  return Object.entries(CSP_CONFIG)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key;
      }
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
};

// Cookie configuration
export const COOKIE_CONFIG = {
  secure: true,           // Solo HTTPS
  httponly: true,         // No accesible por JS
  samesite: 'Strict',     // CSRF protection
  sameSite: 'Strict',     // Alias para compatibilidad
  path: '/',
  domain: process.env.REACT_APP_COOKIE_DOMAIN || undefined,
};

// HTTPS y HSTS
export const HTTPS_CONFIG = {
  enforceHTTPS: process.env.NODE_ENV === 'production',
  hstsMaxAge: 31536000,    // 1 year
  hstsIncludeSubdomains: true,
  hstsPreload: true,
};

// Rate limiting
export const RATE_LIMIT_CONFIG = {
  login: {
    maxAttempts: 5,
    timeWindow: 15 * 60 * 1000, // 15 min
  },
  api: {
    maxRequests: 100,
    timeWindow: 60 * 1000, // 1 min
  },
};

// Security headers
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

// Validation rules
export const VALIDATION_CONFIG = {
  password: {
    minLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSpecial: true,
  },
  username: {
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_-]+$/,
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 254,
  },
};

// Storage configuration
export const STORAGE_CONFIG = {
  // NO guardar nunca en localStorage:
  FORBIDDEN_KEYS: [
    'token',
    'access_token',
    'refresh_token',
    'password',
    'api_key',
    'secret',
  ],

  // Encriptar siempre:
  ENCRYPT_KEYS: [
    'preferences',
    'user_profile',
    'audit_logs',
  ],

  // Limpiar al logout:
  CLEAR_ON_LOGOUT: [
    'user_profile',
    'preferences',
    'errorLogs',
  ],
};

// Session configuration
export const SESSION_CONFIG = {
  timeout: 30 * 60 * 1000,  // 30 min
  warningTime: 25 * 60 * 1000, // Avisar 5 min antes
  checkInterval: 60 * 1000,  // Check cada 1 min
};

// Sensitive fields to redact in logs
export const SENSITIVE_FIELDS = [
  'password',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'credit_card',
  'ssn',
  'api_key',
  'secret',
  'private_key',
  'phone',
];

export default {
  CSP_CONFIG,
  generateCSPHeader,
  COOKIE_CONFIG,
  HTTPS_CONFIG,
  RATE_LIMIT_CONFIG,
  SECURITY_HEADERS,
  VALIDATION_CONFIG,
  STORAGE_CONFIG,
  SESSION_CONFIG,
  SENSITIVE_FIELDS,
};
