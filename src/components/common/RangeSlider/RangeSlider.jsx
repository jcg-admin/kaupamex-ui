// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/RangeSlider/RangeSlider.jsx
/**
 * RangeSlider — ecommerce-ui
 * Control deslizante con API completa de ui-core range-slider.js.
 *
 * Opciones de ui-core implementadas:
 *   min: 0            — valor mínimo
 *   max: 100          — valor máximo
 *   step: 1           — paso
 *   value: 0          — valor inicial (número o [start, end] para range)
 *   distance: 0       — distancia mínima entre thumbs en range
 *   labels: false     — array de etiquetas bajo el track
 *   clickableLabels: true — click en label mueve el thumb
 *   tooltips: true    — tooltip sobre cada thumb
 *   tooltipsFormat: null — (value) => string
 *   track: 'fill'     — 'fill' | 'left' | 'right' | false
 *   vertical: false   — orientación vertical
 *   disabled: false
 *   name: null        — para formularios
 *
 * Método via ref: update(config)
 * Evento: onChange(value)
 */
import {
  useState, useCallback, useRef, useId,
  useImperativeHandle, forwardRef,
} from 'react';
import styles from './RangeSlider.module.scss';

const RangeSlider = forwardRef(function RangeSlider({
  min            = 0,          // Default ui-core
  max            = 100,        // Default ui-core
  step           = 1,          // Default ui-core
  value:         controlled,
  defaultValue   = 0,
  distance       = 0,          // Default ui-core
  labels         = false,      // Default ui-core
  clickableLabels = true,      // Default ui-core
  tooltips       = true,       // Default ui-core
  tooltipsFormat = null,       // Default ui-core
  track          = 'fill',     // Default ui-core
  vertical       = false,      // Default ui-core
  disabled       = false,      // Default ui-core
  name,                        // Default ui-core
  onChange,
  className      = '',
}, ref) {
  const id  = useId();
  const isRange = Array.isArray(controlled ?? defaultValue);

  const [internal, setInternal] = useState(() => {
    const init = controlled ?? defaultValue;
    return Array.isArray(init) ? init : [init];
  });

  const vals = (() => {
    const v = controlled ?? internal[0];
    if (Array.isArray(v)) return v;
    return [internal[0]];
  })();

  const setVals = useCallback((next) => {
    setInternal(next);
    onChange?.(isRange ? next : next[0]);
  }, [onChange, isRange]);

  // update(config) — equivale a RangeSlider.update() de ui-core
  const update = useCallback((config) => {
    if (config.value !== undefined) {
      const v = Array.isArray(config.value) ? config.value : [config.value];
      setInternal(v);
    }
    // min/max/step cambios requieren re-render del padre
  }, []);

  useImperativeHandle(ref, () => ({ update }), [update]);

  const pct = (v) => ((v - min) / (max - min)) * 100;

  const fmtTip = (v) => tooltipsFormat ? tooltipsFormat(v) : String(v);

  const handleChange = useCallback((idx) => (e) => {
    const newVal = Number(e.target.value);
    const next   = [...(internal.length > 1 ? internal : [internal[0]])];

    if (next.length === 2 && distance > 0) {
      if (idx === 0 && newVal > next[1] - distance) return;
      if (idx === 1 && newVal < next[0] + distance) return;
    }

    next[idx] = newVal;
    setVals(next);
  }, [internal, distance, setVals]);

  // Calcular el estilo del track fill
  const trackStyle = () => {
    if (!track || track === false) return {};
    const start = isRange ? pct(vals[0]) : (track === 'left' ? 0 : pct(vals[0]));
    const end   = isRange ? pct(vals[1] ?? vals[0]) : (track === 'right' ? 100 : pct(vals[0]));
    if (vertical) return { bottom: `${start}%`, height: `${end - start}%` };
    return { left: `${start}%`, width: `${end - start}%` };
  };

  const wrapperCls = [
    styles.wrapper,
    vertical  ? styles.vertical  : '',
    disabled  ? styles.disabled  : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperCls}>
      {/* Track */}
      <div className={`${styles.track} ${vertical ? styles.trackVertical : ''}`}>
        {(track && track !== false) && (
          <div className={styles.trackFill} style={trackStyle()} />
        )}

        {/* Thumbs + inputs range */}
        {vals.map((v, idx) => (
          <div
            key={`thumb-${idx}`}
            className={styles.thumbWrapper}
            style={vertical
              ? { bottom: `${pct(v)}%` }
              : { left: `${pct(v)}%` }
            }
          >
            {tooltips && (
              <div className={styles.tooltip} aria-hidden="true">
                {fmtTip(v)}
              </div>
            )}
            <div className={styles.thumb} aria-label={`Valor ${idx + 1}`} />
          </div>
        ))}

        {/* Inputs range invisibles — accesibles */}
        {vals.map((v, idx) => (
          <input
            key={`range-${idx}`}
            type="range"
            id={`${id}-${idx}`}
            name={vals.length > 1 ? (name ? `${name}[${idx}]` : undefined) : name}
            min={min}
            max={max}
            step={step}
            value={v}
            disabled={disabled}
            onChange={handleChange(idx)}
            className={styles.input}
            aria-label={vals.length > 1
              ? (idx === 0 ? 'Valor mínimo' : 'Valor máximo')
              : 'Valor'}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={v}
          />
        ))}
      </div>

      {/* Labels — equivalen a _createLabels en ui-core */}
      {Array.isArray(labels) && labels.length > 0 && (
        <div className={styles.labels}>
          {labels.map((lbl, i) => {
            const pos = (i / (labels.length - 1)) * 100;
            const handleLabelClick = clickableLabels
              ? () => setVals([min + (pos / 100) * (max - min)])
              : undefined;
            return (
              <span
                key={`label-${i}`}
                className={`${styles.label} ${clickableLabels ? styles.labelClickable : ''}`}
                style={{ [vertical ? 'bottom' : 'left']: `${pos}%` }}
                onClick={handleLabelClick}
              >
                {lbl}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default RangeSlider;
export { RangeSlider };
