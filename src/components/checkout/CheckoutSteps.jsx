/**
 * CheckoutSteps — PracticaYoruba
 * Tira de progreso del checkout (5 pasos del mockup 1.0.1): Bolsa · Contacto ·
 * Envío · Pago · Revisar.
 *
 * Es un indicador de progreso **presentacional** (no navegable): el flujo del
 * checkout es multi-ruta, no un wizard de un solo componente, así que NO usa el
 * `Stepper` nativo de ui-core (que gestiona estado activo + panel de contenido
 * + tabs clickeables — un mal ajuste para un header por-ruta). Extraído del
 * `Step` local que vivía en CheckoutPage para reusarlo también en
 * PaymentSelectionPage y mantener continuidad visual entre pantallas.
 *
 * @param {number} current — número (1-5) del paso activo. Los pasos con número
 *                           menor se marcan `done`, el igual `active`, y los
 *                           mayores `pending`.
 */
import styles from './CheckoutSteps.module.scss';

const STEPS = [
  { n: '01', label: 'Bolsa' },
  { n: '02', label: 'Contacto' },
  { n: '03', label: 'Envío' },
  { n: '04', label: 'Pago' },
  { n: '05', label: 'Revisar' },
];

export default function CheckoutSteps({ current = 1, className = '' }) {
  return (
    <ol
      className={`${styles.steps} ${className}`.trim()}
      aria-label={`Paso ${current} de ${STEPS.length}`}
    >
      {STEPS.map((step, i) => {
        const num   = i + 1;
        const state = num < current ? 'done' : num === current ? 'active' : 'pending';
        return (
          <li
            key={step.n}
            className={`${styles.step} ${styles[`step_${state}`]}`}
            aria-current={state === 'active' ? 'step' : undefined}
          >
            <span className={styles.stepNum}>{state === 'done' ? '✓' : step.n}</span>
            <span className={styles.stepLabel}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export { CheckoutSteps };
