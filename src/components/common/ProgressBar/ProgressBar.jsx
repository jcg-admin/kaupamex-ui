// Adaptado de @progress/kno-react-progressbars (ProgressBar) — referencia no
// runtime. Reimplementación nativa: NO se instala el paquete; se toma el
// contrato mínimo (value 0-100, indeterminate, label, variante de color) y se
// reescribe en un componente CSS-module propio. La API pesada de Kendo
// (animation/orientation/labelPlacement/min/max/reverse) NO se replica: solo lo
// que la pasarela necesita (barra determinada o indeterminada con etiqueta).
/**
 * ProgressBar — Kaupamex
 *
 * @param {number} [value]      — 0-100. Si es undefined o `indeterminate`, la
 *                                barra corre en modo indeterminado (sweep).
 * @param {boolean} [indeterminate] — fuerza el modo indeterminado.
 * @param {'primary'|'success'|'warning'|'error'} [variant='primary']
 * @param {React.ReactNode|boolean} [label] — texto/nodo a mostrar; si es `true`,
 *                                muestra `NN%` (solo en modo determinado).
 */
import styles from './ProgressBar.module.scss';

export default function ProgressBar({
  value,
  indeterminate = false,
  variant = 'primary',
  label = false,
  className = '',
}) {
  const isIndeterminate = indeterminate || value == null || Number.isNaN(Number(value));
  const pct = isIndeterminate ? undefined : Math.min(100, Math.max(0, Number(value)));

  const labelText = label === true
    ? (isIndeterminate ? null : `${Math.round(pct)}%`)
    : label;

  return (
    <div className={`${styles.wrap} ${className}`.trim()}>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuemin={isIndeterminate ? undefined : 0}
        aria-valuemax={isIndeterminate ? undefined : 100}
        aria-valuenow={isIndeterminate ? undefined : Math.round(pct)}
        aria-busy={isIndeterminate ? true : undefined}
      >
        <div
          className={[
            styles.fill,
            styles[`fill_${variant}`],
            isIndeterminate ? styles.indeterminate : '',
          ].filter(Boolean).join(' ')}
          style={isIndeterminate ? undefined : { width: `${pct}%` }}
        />
      </div>
      {labelText != null && labelText !== false && (
        <span className={styles.label}>{labelText}</span>
      )}
    </div>
  );
}

export { ProgressBar };
