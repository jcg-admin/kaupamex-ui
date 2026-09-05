// Adaptado de @progress/kno-theme-* (scss/skeleton) — referencia no runtime.
// Reimplementación nativa: no se instala ningún paquete @progress/*; se toma
// la idea (placeholder con animación "wave"/pulse + variantes text/rect/circle)
// y se reescribe en un componente CSS-module propio.
/**
 * Skeleton — Kaupamex
 * Placeholder de carga (shimmer) mientras un contenido se resuelve.
 *
 * @param {'text'|'rect'|'circle'} variant — forma del placeholder (default 'text').
 * @param {string|number} width  — ancho CSS (p. ej. '80%', 120). Default 100%.
 * @param {string|number} height — alto CSS. Default según variante.
 * @param {number} count — nº de líneas a repetir (solo variant 'text'). Default 1.
 *
 * Es decorativo: lleva aria-hidden. El contenedor que lo muestra debe exponer
 * el estado (role="status" / aria-busy) para lectores de pantalla.
 */
import styles from './Skeleton.module.scss';

function toCss(v) {
  if (v == null) return undefined;
  return typeof v === 'number' ? `${v}px` : v;
}

export default function Skeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
}) {
  const n = variant === 'text' ? Math.max(1, count) : 1;
  const cls = `${styles.skeleton} ${styles[variant] || ''} ${className}`.trim();
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cls}
          style={{ width: toCss(width), height: toCss(height) }}
        />
      ))}
    </>
  );
}

export { Skeleton };
