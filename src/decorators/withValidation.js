/**
 * withValidation Decorator
 * 
 * Agrega validación automática de argumentos a funciones
 * Previene errores en runtime validando entrada antes de ejecutar
 * 
 * Beneficios:
 * - Previene bugs por argumentos inválidos
 * - Validación centralizada
 * - Error messages claros
 * - Transparente para el consumidor
 * 
 * Usage:
 *   const validateUserId = (userId) => {
 *     if (!userId || typeof userId !== 'number') {
 *       return { valid: false, message: 'User ID must be a number' }
 *     }
 *     return { valid: true }
 *   }
 *   
 *   const validatedGetUser = withValidation(getUserById, validateUserId)
 *   await validatedGetUser(123)      // OK
 *   await validatedGetUser('invalid') // Throws validation error
 */

/**
 * withValidation Decorator
 * 
 * @param {Function} fn - Función a decorar
 * @param {Function} validator - Función validadora que retorna {valid, message?}
 * @param {Object} options - Opciones
 *   @param {boolean} throwOnError - Lanzar error si validación falla (default: true)
 *   @param {string} fnName - Nombre para logging de errores
 * 
 * @returns {Function} Función decorada con validación
 */
export const withValidation = (fn, validator, options = {}) => {
  const { throwOnError = true, fnName = fn.name || 'anonymous' } = options

  return async function decoratedWithValidation(...args) {
    // Ejecutar validador
    const validation = validator(...args)

    if (!validation.valid) {
      const errorMessage = validation.message || 'Validation failed'
      const error = new ValidationError(errorMessage, {
        fn: fnName,
        args,
        validation,
      })

      if (throwOnError) {
        throw error
      } else {
        console.warn(`[VALIDATION] ${fnName}: ${errorMessage}`)
        return null
      }
    }

    // Validación exitosa, ejecutar función
    try {
      return await fn.apply(this, args)
    } catch (error) {
      console.error(`[ERROR] ${fnName} failed after validation passed:`, error)
      throw error
    }
  }
}

/**
 * withValidation - Versión con múltiples validadores
 * Ejecuta varios validadores en secuencia
 */
export const withValidationMultiple = (fn, validators = [], options = {}) => {
  const { throwOnError = true, fnName = fn.name || 'anonymous' } = options

  return async function (...args) {
    // Ejecutar todos los validadores
    for (let i = 0; i < validators.length; i++) {
      const validator = validators[i]
      const validation = validator(...args)

      if (!validation.valid) {
        const errorMessage = validation.message || `Validation #${i + 1} failed`
        const error = new ValidationError(errorMessage, {
          fn: fnName,
          args,
          validatorIndex: i,
          validation,
        })

        if (throwOnError) {
          throw error
        } else {
          console.warn(`[VALIDATION] ${fnName}: ${errorMessage}`)
          return null
        }
      }
    }

    // Todos los validadores pasaron
    try {
      return await fn.apply(this, args)
    } catch (error) {
      console.error(`[ERROR] ${fnName} failed:`, error)
      throw error
    }
  }
}

/**
 * ValidationError - Error personalizado para validaciones
 */
export class ValidationError extends Error {
  constructor(message, context = {}) {
    super(message)
    this.name = 'ValidationError'
    this.context = context
  }
}

/**
 * Validadores comunes predefinidos
 */
export const CommonValidators = {
  /**
   * Validar que un ID sea válido
   */
  validateId: (fieldName = 'ID') => (id) => {
    if (!id || (typeof id !== 'string' && typeof id !== 'number')) {
      return {
        valid: false,
        message: `${fieldName} must be a valid identifier`,
      }
    }
    return { valid: true }
  },

  /**
   * Validar que un string no esté vacío
   */
  validateNonEmpty: (fieldName = 'Field') => (value) => {
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      return {
        valid: false,
        message: `${fieldName} cannot be empty`,
      }
    }
    return { valid: true }
  },

  /**
   * Validar que un email sea válido
   */
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return {
        valid: false,
        message: 'Invalid email address',
      }
    }
    return { valid: true }
  },

  /**
   * Validar que un objeto no esté vacío
   */
  validateObject: (fieldName = 'Object') => (obj) => {
    if (!obj || typeof obj !== 'object' || Object.keys(obj).length === 0) {
      return {
        valid: false,
        message: `${fieldName} cannot be empty`,
      }
    }
    return { valid: true }
  },

  /**
   * Validar que un array no esté vacío
   */
  validateArray: (fieldName = 'Array') => (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) {
      return {
        valid: false,
        message: `${fieldName} cannot be empty`,
      }
    }
    return { valid: true }
  },

  /**
   * Validar rango numérico
   */
  validateRange: (min, max, fieldName = 'Value') => (value) => {
    if (typeof value !== 'number' || value < min || value > max) {
      return {
        valid: false,
        message: `${fieldName} must be between ${min} and ${max}`,
      }
    }
    return { valid: true }
  },

  /**
   * Validador personalizado con función
   */
  validateWith: (predicate, message = 'Validation failed') => (value) => {
    try {
      const result = predicate(value)
      return result === true ? { valid: true } : { valid: false, message }
    } catch (error) {
      return { valid: false, message: error.message }
    }
  },
}

export default withValidation
