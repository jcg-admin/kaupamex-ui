/**
 * withCaching Decorator
 * 
 * Agrega capacidad de caché a funciones asincrónicas
 * Soporta TTL (time-to-live) configurable y claves de caché customizadas
 * 
 * Beneficios:
 * - Reduce llamadas a API
 * - Mejora performance
 * - Transparente para el consumidor
 * 
 * Usage:
 *   const getCachedUser = withCaching(getUserById, 5 * 60 * 1000, (userId) => `user:${userId}`)
 *   const user = await getCachedUser(123)  // Primera llamada: hits API
 *   const user2 = await getCachedUser(123) // Segunda llamada: returns cache
 */

/**
 * withCaching Decorator
 * 
 * @param {Function} fn - Función asincrónica a decorar
 * @param {number} ttl - Time-to-live en milisegundos (default: 5 minutos)
 * @param {Function} keyFn - Función para generar clave de caché (default: JSON.stringify de args)
 * 
 * @returns {Function} Función decorada con caché
 */
export const withCaching = (fn, ttl = 5 * 60 * 1000, keyFn = null) => {
  const cache = new Map()
  const fnName = fn.name || 'anonymous'

  return async function decoratedWithCaching(...args) {
    // Generar clave de caché
    const cacheKey = keyFn ? keyFn(...args) : JSON.stringify(args)

    // Verificar si existe en caché y no ha expirado
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)
      const now = Date.now()

      if (now - cached.timestamp < ttl) {
        console.log(`[CACHE HIT] ${fnName}:${cacheKey}`)
        return cached.value
      }

      // Expirado, remover del caché
      cache.delete(cacheKey)
      console.log(`[CACHE EXPIRED] ${fnName}:${cacheKey}`)
    }

    // No en caché o expirado, ejecutar función
    console.log(`[CACHE MISS] ${fnName}:${cacheKey}`)

    try {
      const result = await fn.apply(this, args)

      // Guardar en caché
      cache.set(cacheKey, {
        value: result,
        timestamp: Date.now(),
      })

      return result
    } catch (error) {
      console.error(`[CACHE ERROR] ${fnName}:${cacheKey}`, error.message)
      throw error
    }
  }
}

/**
 * withCaching - Versión con invalidación manual
 * 
 * Útil cuando necesitas limpiar caché manualmente
 */
export const withCachingAdvanced = (fn, ttl = 5 * 60 * 1000, keyFn = null) => {
  const cache = new Map()
  const fnName = fn.name || 'anonymous'

  const decoratedFn = async function (...args) {
    const cacheKey = keyFn ? keyFn(...args) : JSON.stringify(args)

    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)
      const now = Date.now()

      if (now - cached.timestamp < ttl) {
        console.log(`[CACHE HIT] ${fnName}:${cacheKey}`)
        return cached.value
      }

      cache.delete(cacheKey)
      console.log(`[CACHE EXPIRED] ${fnName}:${cacheKey}`)
    }

    console.log(`[CACHE MISS] ${fnName}:${cacheKey}`)

    try {
      const result = await fn.apply(this, args)
      cache.set(cacheKey, {
        value: result,
        timestamp: Date.now(),
      })
      return result
    } catch (error) {
      console.error(`[CACHE ERROR] ${fnName}:${cacheKey}`, error.message)
      throw error
    }
  }

  // Agregar métodos de control de caché
  decoratedFn.invalidateCache = (pattern = null) => {
    if (pattern === null) {
      // Limpiar todo el caché
      cache.clear()
      console.log(`[CACHE CLEARED] ${fnName}`)
    } else if (typeof pattern === 'string') {
      // Limpiar por patrón de clave
      for (const key of cache.keys()) {
        if (key.includes(pattern)) {
          cache.delete(key)
        }
      }
      console.log(`[CACHE INVALIDATED] ${fnName}:${pattern}`)
    } else if (typeof pattern === 'function') {
      // Limpiar por función predicado
      for (const key of cache.keys()) {
        if (pattern(key)) {
          cache.delete(key)
        }
      }
      console.log(`[CACHE INVALIDATED] ${fnName} (by predicate)`)
    }
  }

  decoratedFn.getCacheSize = () => cache.size

  return decoratedFn
}

/**
 * Presets para TTL comunes
 */
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000, // 1 minuto
  MEDIUM: 5 * 60 * 1000, // 5 minutos
  LONG: 30 * 60 * 1000, // 30 minutos
  VERY_LONG: 60 * 60 * 1000, // 1 hora
}

export default withCaching
