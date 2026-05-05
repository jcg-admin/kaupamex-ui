/**
 * withLogging Decorator
 * 
 * Agrega logging automático a funciones
 * Registra: llamadas, duración, argumentos, resultados, errores
 * 
 * Beneficios:
 * - Debugging más fácil
 * - Performance tracking
 * - Error tracking automático
 * - Transparente para el consumidor
 * 
 * Usage:
 *   const loggedLogin = withLogging(authService.login, 'authService.login')
 *   await loggedLogin(username, password)
 *   // Logs: [LOG] authService.login called with: ["user", "***"]
 *   // Logs: [LOG] authService.login completed in 234.56ms
 */

/**
 * withLogging Decorator
 * 
 * @param {Function} fn - Función a decorar (síncrona o asincrónica)
 * @param {string} fnName - Nombre de la función para logging
 * @param {Object} options - Opciones de configuración
 *   @param {boolean} logArgs - Loguear argumentos (default: true)
 *   @param {boolean} logResult - Loguear resultado (default: true)
 *   @param {boolean} logTime - Loguear duración (default: true)
 *   @param {boolean} logErrors - Loguear errores (default: true)
 *   @param {number} maxArgLength - Máxima longitud de arg a mostrar (default: 100)
 * 
 * @returns {Function} Función decorada con logging
 */
export const withLogging = (fn, fnName = fn.name || 'anonymous', options = {}) => {
  const {
    logArgs = true,
    logResult = true,
    logTime = true,
    logErrors = true,
    maxArgLength = 100,
  } = options

  return async function decoratedWithLogging(...args) {
    // Preparar argumentos para logging (ocultar contraseñas)
    const sanitizedArgs = logArgs
      ? args.map((arg) => {
          if (typeof arg === 'object' && arg !== null) {
            const sanitized = { ...arg }
            // Ocultar campos sensibles
            if (sanitized.password) sanitized.password = '***'
            if (sanitized.token) sanitized.token = '***...'
            if (sanitized.apiKey) sanitized.apiKey = '***...'
            return sanitized
          }
          if (typeof arg === 'string' && arg.length > maxArgLength) {
            return arg.substring(0, maxArgLength) + '...'
          }
          return arg
        })
      : undefined

    const startTime = performance.now()

    // Log inicio
    if (logArgs) {
      console.log(`[LOG] ${fnName} called with:`, sanitizedArgs)
    } else {
      console.log(`[LOG] ${fnName} called`)
    }

    try {
      const result = await fn.apply(this, args)
      const duration = (performance.now() - startTime).toFixed(2)

      // Log éxito
      if (logTime) {
        console.log(`[LOG] ${fnName} completed in ${duration}ms`)
      }

      if (logResult && typeof result === 'object') {
        console.log(`[LOG] ${fnName} result:`, {
          type: result?.constructor?.name,
          keys: Object.keys(result || {}).length,
        })
      } else if (logResult) {
        const resultStr =
          typeof result === 'string' && result.length > maxArgLength
            ? result.substring(0, maxArgLength) + '...'
            : result

        console.log(`[LOG] ${fnName} result:`, resultStr)
      }

      return result
    } catch (error) {
      const duration = (performance.now() - startTime).toFixed(2)

      if (logErrors) {
        console.error(`[ERROR] ${fnName} failed after ${duration}ms:`, {
          message: error.message,
          code: error.code,
          status: error.status,
          details: error.details,
        })
      }

      throw error
    }
  }
}

/**
 * withLogging - Versión con nivel de severidad
 * Permite controlar qué se loguea basado en niveles
 */
export const withLoggingLevels = (fn, fnName = fn.name, level = 'INFO') => {
  const LOG_LEVELS = {
    TRACE: 0,
    DEBUG: 1,
    INFO: 2,
    WARN: 3,
    ERROR: 4,
  }

  const currentLevel = LOG_LEVELS[level] || LOG_LEVELS.INFO

  return async function (...args) {
    const startTime = performance.now()

    if (currentLevel <= LOG_LEVELS.TRACE) {
      console.log(`[TRACE] ${fnName} called with args:`, args)
    } else if (currentLevel <= LOG_LEVELS.DEBUG) {
      console.log(`[DEBUG] ${fnName} called`)
    } else if (currentLevel <= LOG_LEVELS.INFO) {
      console.log(`[INFO] ${fnName} executing`)
    }

    try {
      const result = await fn.apply(this, args)
      const duration = (performance.now() - startTime).toFixed(2)

      if (currentLevel <= LOG_LEVELS.INFO) {
        console.log(`[INFO] ${fnName} completed in ${duration}ms`)
      }

      return result
    } catch (error) {
      const duration = (performance.now() - startTime).toFixed(2)

      if (currentLevel <= LOG_LEVELS.ERROR) {
        console.error(`[ERROR] ${fnName} failed after ${duration}ms:`, error.message)
      } else if (currentLevel <= LOG_LEVELS.WARN) {
        console.warn(`[WARN] ${fnName} failed:`, error.message)
      }

      throw error
    }
  }
}

/**
 * Log level presets
 */
export const LOG_LEVELS = {
  TRACE: 'TRACE', // Máximo detalle
  DEBUG: 'DEBUG', // Debug info
  INFO: 'INFO', // Información general
  WARN: 'WARN', // Warnings
  ERROR: 'ERROR', // Solo errores
  SILENT: 'SILENT', // Sin logging
}

export default withLogging
