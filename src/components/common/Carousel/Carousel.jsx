// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/Carousel/Carousel.jsx
/**
 * Carousel — ecommerce-ui
 * Carrusel con API completa de ui-core-5.25.0 carousel.js.
 *
 * Opciones:
 *   interval: 5000   — ms entre slides (0 = sin auto-avance)
 *   keyboard: true   — flechas de teclado activan next/prev
 *   pause: 'hover'   — pausa en hover ('hover' | false)
 *   ride: false      — 'carousel' = inicia inmediatamente
 *   touch: true      — soporte swipe táctil
 *   wrap: true       — volver al inicio al llegar al final
 *
 * Props de presentación:
 *   showDots:    true  — indicadores
 *   showArrows:  true  — flechas de navegación
 *   showCaptions: true — captions de cada slide
 *   dark:        false — variante oscura
 *
 * Métodos via ref: next() / prev() / to(index) / pause() / cycle() / dispose()
 * Eventos: onSlide / onSlid (equivalen a slide.bs.carousel / slid.bs.carousel)
 */
import {
  useState, useEffect, useCallback, useRef,
  useImperativeHandle, forwardRef,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './Carousel.module.scss';

const Carousel = forwardRef(function Carousel({
  children,        // Array de slides
  // Opciones de ui-core
  interval       = 5000,  // Default ui-core
  keyboard       = true,  // Default ui-core
  pause          = 'hover', // Default ui-core
  ride           = false, // Default ui-core
  touch          = true,  // Default ui-core
  wrap           = true,  // Default ui-core
  // UI
  showDots       = true,
  showArrows     = true,
  showCaptions   = false,
  dark           = false,
  // Callbacks (equivalen a eventos de ui-core)
  onSlide,   // (from, to, direction) — antes de animar
  onSlid,    // (from, to, direction) — después de animar
  className      = '',
}, ref) {
  const slides = Array.isArray(children) ? children : [children];
  const total  = slides.length;

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);
  const touchStartX = useRef(null);

  const goTo = useCallback((idx) => {
    const from = current;
    let to = idx;
    if (!wrap && (to < 0 || to >= total)) return;
    to = ((to % total) + total) % total;

    const dir = to > from ? 1 : -1;
    setDirection(dir);
    onSlide?.(from, to, dir > 0 ? 'next' : 'prev');
    setCurrent(to);
    setTimeout(() => onSlid?.(from, to, dir > 0 ? 'next' : 'prev'), 400);
  }, [current, total, wrap, onSlide, onSlid]);

  // next() — equivale a Carousel.next()
  const next = useCallback(() => goTo(current + 1), [goTo, current]);
  // prev() — equivale a Carousel.prev()
  const prev = useCallback(() => goTo(current - 1), [goTo, current]);
  // to(idx) — equivale a Carousel.to()
  const to = useCallback((idx) => goTo(idx), [goTo]);

  // cycle() — equivale a Carousel.cycle()
  const cycle = useCallback(() => {
    if (!interval) return;
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!paused) next();
    }, interval);
  }, [interval, paused, next]);

  // pause() — equivale a Carousel.pause()
  const pauseCarousel = useCallback(() => setPaused(true),  []);
  const resumeCarousel = useCallback(() => setPaused(false), []);
  const dispose = useCallback(() => clearInterval(intervalRef.current), []);

  useImperativeHandle(ref, () => ({
    next, prev, to, pause: pauseCarousel, cycle, dispose,
    nextWhenVisible: () => { if (document.visibilityState === 'visible') next(); },
  }), [next, prev, to, pauseCarousel, cycle, dispose]);

  // Auto-avance — ride='carousel' inicia inmediatamente
  useEffect(() => {
    if (!interval) return;
    if (ride !== 'carousel' && ride !== true) return; // ride:false = no auto-start
    cycle();
    return () => clearInterval(intervalRef.current);
  }, [cycle, ride, interval]);

  // keyboard: ArrowLeft/Right
  useEffect(() => {
    if (!keyboard) return;
    const handler = (e) => {
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [keyboard, next, prev]);

  // touch: swipe táctil
  const handleTouchStart = useCallback((e) => {
    if (!touch) return;
    touchStartX.current = e.touches[0].clientX;
  }, [touch]);

  const handleTouchEnd = useCallback((e) => {
    if (!touch || touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      delta > 0 ? prev() : next();
    }
    touchStartX.current = null;
  }, [touch, next, prev]);

  // pause: 'hover' — pausar en mouseenter
  const pauseHandlers = pause === 'hover'
    ? { onMouseEnter: pauseCarousel, onMouseLeave: resumeCarousel }
    : {};

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <div
      className={[
        styles.carousel,
        dark ? styles.dark : '',
        className,
      ].filter(Boolean).join(' ')}
      aria-roledescription="carousel"
      aria-label="Carrusel de imágenes"
      {...pauseHandlers}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      <div className={styles.inner} aria-live={paused ? 'polite' : 'off'}>
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className={styles.slide}
            aria-roledescription="slide"
            aria-label={`Slide ${current + 1} de ${total}`}
          >
            {slides[current]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Indicadores — equivalen a .carousel-indicators */}
      {showDots && total > 1 && (
        <div className={styles.indicators} role="tablist" aria-label="Indicadores del carrusel">
          {slides.map((_, i) => (
            <button
              key={`dot-${i}`}
              role="tab"
              aria-selected={i === current}
              aria-label={`Ir al slide ${i + 1}`}
              className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
              onClick={() => to(i)}
            />
          ))}
        </div>
      )}

      {/* Controles — equivalen a .carousel-control-prev/next */}
      {showArrows && total > 1 && (
        <>
          <button
            className={`${styles.control} ${styles.controlPrev}`}
            onClick={prev}
            aria-label="Anterior"
          >
            ‹
          </button>
          <button
            className={`${styles.control} ${styles.controlNext}`}
            onClick={next}
            aria-label="Siguiente"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
});

export default Carousel;

/**
 * CarouselSlide — wrapper individual para cada slide
 */
export function CarouselSlide({ children, caption, className = '' }) {
  return (
    <div className={`${styles.slideContent} ${className}`}>
      {children}
      {caption && <div className={styles.caption}>{caption}</div>}
    </div>
  );
}
export { Carousel };
