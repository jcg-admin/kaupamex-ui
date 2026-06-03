// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/LoadingButton/LoadingButton.jsx
/**
 * LoadingButton — ecommerce-ui
 * Botón con estado de carga: start()/stop(), spinnerType, timeout, disabledOnLoading.
 *
 * Lógica completa de ui-core-5.25.0 loading-button.js:
 *   start()          — activa is-loading + spinner + disable opcional
 *   stop()           — desactiva is-loading + remueve spinner
 *   disabledOnLoading — deshabilita mientras carga
 *   spinner           — bool: mostrar spinner
 *   spinnerType       — 'border' | 'grow'
 *   timeout           — auto-stop tras N ms
 *   Ref imperativo: { start, stop }
 *
 * Referencia: ui-core-5.25.0 loading-button.js
 * Iniciativa: implementar-componentes-diferidos-ui-core
 */
import {
  useState, useEffect, useCallback,
  useImperativeHandle, forwardRef, useRef,
} from 'react';
import styles from './LoadingButton.module.scss';

const LoadingButton = forwardRef(function LoadingButton({
  children,
  variant           = 'primary',
  size              = 'md',
  type              = 'button',
  block             = false,
  disabled          = false,
  loading: controlled,      // estado controlado externamente
  disabledOnLoading = false, // Default de ui-core
  spinner           = true,  // Default de ui-core
  spinnerType       = 'border', // Default de ui-core
  timeout           = 0,    // Default de ui-core: false
  onStart,
  onStop,
  onClick,
  className         = '',
  ...rest
}, ref) {
  const [internal, setInternal] = useState(false);
  const timerRef = useRef(null);

  const isLoading = controlled !== undefined ? controlled : internal;

  // start() — equivale a LoadingButton.start() en ui-core
  const start = useCallback(() => {
    setInternal(true);
    onStart?.();
    if (timeout > 0) {
      timerRef.current = setTimeout(() => stop(), timeout);
    }
  }, [timeout, onStart]); // eslint-disable-line

  // stop() — equivale a LoadingButton.stop() en ui-core
  const stop = useCallback(() => {
    clearTimeout(timerRef.current);
    setInternal(false);
    onStop?.();
  }, [onStop]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Exponer start/stop via ref (como getOrCreateInstance en ui-core)
  useImperativeHandle(ref, () => ({ start, stop }), [start, stop]);

  const cls = [
    styles.btn,
    styles[`btn_${variant}`],
    styles[`btn_${size}`],
    block && styles.btnBlock,
    isLoading && styles.isLoading,
    className,
  ].filter(Boolean).join(' ');

  const isDisabled = disabled || (isLoading && disabledOnLoading);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={cls}
      aria-busy={isLoading}
      {...rest}
    >
      {isLoading && spinner && (
        <span
          className={`${styles.spinner} ${styles[`spinner_${spinnerType}`]}`}
          role="status"
          aria-hidden="true"
        />
      )}
      <span className={isLoading ? styles.childrenLoading : undefined}>
        {children}
      </span>
    </button>
  );
});

export default LoadingButton;
export { LoadingButton };
