/**
 * useBreakpoint.js
 * IACT v4.0 - React Hook para detectar breakpoints y responsive design
 * Reemplaza: breakpoints.min.js de mx-template
 */

import { useState, useEffect, useCallback } from 'react';

// Breakpoints alineados con Tailwind CSS
const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

const BREAKPOINT_KEYS = Object.keys(BREAKPOINTS);

/**
 * Hook para detectar el breakpoint actual y cambios en el tamaño de la pantalla
 * 
 * @returns {Object} Objeto con información de breakpoints
 * 
 * @example
 * const { breakpoint, isMobile, isDesktop } = useBreakpoint();
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState(() => {
    if (typeof window === 'undefined') return 'md';
    return getBreakpoint(window.innerWidth);
  });

  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  const [isMobile, setIsMobile] = useState(size.width < BREAKPOINTS.md);
  const [isTablet, setIsTablet] = useState(
    size.width >= BREAKPOINTS.md && size.width < BREAKPOINTS.lg
  );
  const [isDesktop, setIsDesktop] = useState(size.width >= BREAKPOINTS.lg);

  const handleResize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    setSize({ width, height });

    // Determinar breakpoint actual
    const newBreakpoint = getBreakpoint(width);
    setBreakpoint(newBreakpoint);

    // Categorías
    setIsMobile(width < BREAKPOINTS.md);
    setIsTablet(width >= BREAKPOINTS.md && width < BREAKPOINTS.lg);
    setIsDesktop(width >= BREAKPOINTS.lg);
  }, []);

  useEffect(() => {
    // Ejecutar una vez en mount
    handleResize();

    // Listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [handleResize]);

  // Helper function para comparar breakpoints
  const is = useCallback((bp) => breakpoint === bp, [breakpoint]);

  const isUp = useCallback((bp) => {
    const currentValue = BREAKPOINTS[breakpoint];
    const targetValue = BREAKPOINTS[bp];
    return currentValue >= targetValue;
  }, [breakpoint]);

  const isDown = useCallback((bp) => {
    const currentValue = BREAKPOINTS[breakpoint];
    const targetValue = BREAKPOINTS[bp];
    return currentValue <= targetValue;
  }, [breakpoint]);

  const isBetween = useCallback((bp1, bp2) => {
    const currentIndex = BREAKPOINT_KEYS.indexOf(breakpoint);
    const index1 = BREAKPOINT_KEYS.indexOf(bp1);
    const index2 = BREAKPOINT_KEYS.indexOf(bp2);
    return (
      currentIndex >= Math.min(index1, index2) &&
      currentIndex <= Math.max(index1, index2)
    );
  }, [breakpoint]);

  return {
    // Estado actual
    breakpoint,
    width: size.width,
    height: size.height,

    // Categorías booleanas
    isMobile,
    isTablet,
    isDesktop,

    // Métodos de comparación
    is,           // is('md') -> true/false
    isUp,         // isUp('md') -> >= md
    isDown,       // isDown('md') -> <= md
    isBetween,    // isBetween('sm', 'lg') -> sm <= current <= lg

    // Todos los breakpoints para referencia
    breakpoints: BREAKPOINTS,
  };
}

/**
 * Hook para detectar si una media query es verdadera
 * 
 * @param {string} query - Media query string
 * @returns {boolean} Si la media query es verdadera
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Listener for changes
    const handleChange = (e) => {
      setMatches(e.matches);
    };

    // Support both old and new API
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Hook para obtener las dimensiones exactas de la ventana
 * 
 * @returns {Object} { width, height }
 * 
 * @example
 * const { width, height } = useWindowSize();
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return windowSize;
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Determina el breakpoint basado en el ancho de pantalla
 * @private
 */
function getBreakpoint(width) {
  for (let i = BREAKPOINT_KEYS.length - 1; i >= 0; i--) {
    if (width >= BREAKPOINTS[BREAKPOINT_KEYS[i]]) {
      return BREAKPOINT_KEYS[i];
    }
  }
  return 'xs';
}

/**
 * Contexto de React para pasar breakpoint a través del árbol de componentes
 * (Opcional - solo si necesitas compartir el estado)
 */
import { createContext, useContext } from 'react';

const BreakpointContext = createContext(null);

export function BreakpointProvider({ children }) {
  const breakpoint = useBreakpoint();
  return (
    <BreakpointContext.Provider value={breakpoint}>
      {children}
    </BreakpointContext.Provider>
  );
}

export function useBreakpointContext() {
  const context = useContext(BreakpointContext);
  if (!context) {
    throw new Error(
      'useBreakpointContext debe usarse dentro de BreakpointProvider'
    );
  }
  return context;
}

// ============================================================================
// EXPORTAR TODO
// ============================================================================

export default useBreakpoint;
