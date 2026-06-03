// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/Stepper/Stepper.jsx
/**
 * Stepper — ecommerce-ui
 * Wizard de pasos con API completa de ui-core stepper.js.
 *
 * Opciones de ui-core:
 *   linear: true         — no puede saltar pasos (solo avanzar en orden)
 *   skipValidation: false— ignorar validación antes de avanzar
 *
 * Métodos via ref: showStep(n) / next() / prev() / finish() / reset()
 * Eventos: onStepChange(step), onFinish, onReset
 * Props de UI: vertical, showConnectors
 */
import {
  useState, useCallback,
  useImperativeHandle, forwardRef, Children, isValidElement,
} from 'react';
import styles from './Stepper.module.scss';

const Stepper = forwardRef(function Stepper({
  children,
  activeStep:  controlled,
  defaultStep  = 0,
  // Opciones de ui-core
  linear       = true,      // Default ui-core
  skipValidation = false,   // Default ui-core
  // UI
  vertical     = false,
  showConnectors = true,
  // Eventos
  onStepChange,
  onFinish,
  onReset,
  className    = '',
}, ref) {
  const [internal, setInternal] = useState(defaultStep);
  const steps = Children.toArray(children).filter(isValidElement);
  const total = steps.length;

  const active = controlled !== undefined ? controlled : internal;

  // goTo sigue la restricción linear (para clicks del usuario)
  const goTo = useCallback((n, bypassLinear = false) => {
    if (n < 0 || n >= total) return;
    if (linear && !bypassLinear && n > active + 1) return; // linear: no saltar
    if (controlled === undefined) setInternal(n);
    onStepChange?.(n);
  }, [active, total, linear, controlled, onStepChange]);

  // showStep(n) — equivale a Stepper.showStep() de ui-core
  // showStep() es programático — no respeta linear (equivale a ui-core)
  const showStep = useCallback((n) => goTo(n, true), [goTo]);

  // next() — equivale a Stepper.next() de ui-core
  const next = useCallback(() => {
    const nextStep = active + 1;
    if (nextStep >= total) { finish(); return; }
    goTo(nextStep);
  }, [active, total, goTo]); // eslint-disable-line

  // prev() — equivale a Stepper.prev() de ui-core
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  // finish() — equivale a Stepper.finish() de ui-core
  const finish = useCallback(() => {
    onFinish?.();
    if (controlled === undefined) setInternal(total - 1);
  }, [total, controlled, onFinish]);

  // reset() — equivale a Stepper.reset() de ui-core
  const reset = useCallback(() => {
    if (controlled === undefined) setInternal(0);
    onStepChange?.(0);
    onReset?.();
  }, [controlled, onStepChange, onReset]);

  useImperativeHandle(ref, () => ({
    showStep, next, prev, finish, reset,
    getActiveStep: () => active,
  }), [showStep, next, prev, finish, reset, active]);

  return (
    <div
      className={[
        styles.stepper,
        vertical ? styles.vertical : '',
        className,
      ].filter(Boolean).join(' ')}
      role="tablist"
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
    >
      {/* Header de pasos */}
      <div className={styles.header}>
        {steps.map((step, i) => {
          const state = i < active ? 'completed' : i === active ? 'active' : 'pending';
          const clickable = !linear || i <= active;

          return (
            <div key={`step-${i}`} className={styles.stepWrapper}>
              <button
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-current={i === active ? 'step' : undefined}
                aria-disabled={!clickable ? true : undefined}
                className={[
                  styles.step,
                  styles[`step_${state}`],
                  clickable ? '' : styles.stepDisabled,
                ].filter(Boolean).join(' ')}
                onClick={() => clickable && goTo(i)}
                data-step={i}
              >
                <span className={styles.stepIndicator}>
                  {state === 'completed' ? '✓' : i + 1}
                </span>
                <span className={styles.stepLabel}>
                  {step.props.label ?? `Paso ${i + 1}`}
                </span>
              </button>

              {showConnectors && i < total - 1 && (
                <div className={`${styles.connector} ${i < active ? styles.connectorCompleted : ''}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Contenido del paso activo */}
      <div className={styles.content} role="tabpanel">
        {steps[active]}
      </div>
    </div>
  );
});

export default Stepper;

/** StepPanel — contenido de un paso */
export function StepPanel({ children, label, className = '' }) {
  return (
    <div className={`${styles.panel} ${className}`}>
      {children}
    </div>
  );
}

// Named export para compatibilidad con imports existentes
export { Stepper };
