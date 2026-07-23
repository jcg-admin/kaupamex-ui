// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/Tooltip/Tooltip.jsx
//
// ADAPTACION kaupamex-ui: el prototipo usa `@floating-ui/react` (no instalado
// aqui). Se hace rewire al hook nativo `@hooks/ui/useFloating` (mismo contrato
// `refs`/`floatingStyles`). El offset [skid, distance] se mapea a
// `offsetPx = distance`; `flip`/`shift`/`fallbackPlacements` no tienen
// equivalente nativo (simplificacion documentada en el hook).
/**
 * Tooltip — ecommerce-ui
 * Tooltip con API completa de ui-core-5.25.0 tooltip.js.
 *
 * Opciones implementadas:
 *   animation: true          — fade in/out con framer-motion
 *   customClass: ''          — clase extra en el tooltip
 *   delay: 0                 — ms de delay (number | {show, hide})
 *   offset: [0, 6]           — offset [skid, distance]
 *   placement: 'top'         — placement
 *   sanitize: true           — el html sanitizado (solo text por seguridad)
 *   title: ''                — título del tooltip (alternativo a children content)
 *   trigger: 'hover focus'   — eventos que activan el tooltip
 *
 * Métodos públicos via ref:
 *   enable() / disable() / toggleEnabled() / toggle() / show() / hide()
 *   update() / setContent(content) / dispose()
 *
 * Iniciativa: integrar-componentes-ui-core-js (completar API)
 */
import {
  useId, useRef, useCallback, useState,
  useImperativeHandle, forwardRef,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useFloating from '@hooks/ui/useFloating';
import styles from './Tooltip.module.scss';

const Tooltip = forwardRef(function Tooltip({
  content,                        // Contenido del tooltip
  title,                          // alias de content (ui-core usa title)
  children,
  // Opciones de ui-core
  placement           = 'top',    // Default ui-core
  trigger             = 'hover focus', // Default ui-core
  delay               = 0,        // ms | { show: N, hide: N }
  offset              = [0, 6],   // Default ui-core [skid, distance]
  fallbackPlacements  = ['top', 'right', 'bottom', 'left'],
  animation           = true,     // Default ui-core
  customClass         = '',       // Default ui-core
  html                = false,    // Default ui-core (html=false por seguridad)
  // Callbacks
  onShow,
  onShown,
  onHide,
  onHidden,
  className           = '',
}, ref) {
  const id        = useId();
  const tipId     = `tooltip-${id.replace(/:/g, '')}`;
  const timerRef  = useRef(null);
  const [visible, setVisible] = useState(false);
  const [enabled, setEnabled] = useState(true);

  // Resolver el contenido del tooltip (title es alias de content)
  const [dynamicContent, setDynamicContent] = useState(null);
  const resolvedContent = dynamicContent ?? content ?? title ?? '';

  const { refs, floatingStyles } = useFloating({
    placement,
    offsetPx: offset[1] ?? 6,
  });

  // Resolver delay — puede ser número o {show, hide}
  const getDelay = (event) => {
    if (typeof delay === 'object') return delay[event] ?? 0;
    return delay;
  };

  // show() — equivale a Tooltip.show() de ui-core
  const show = useCallback(() => {
    if (!enabled) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onShow?.();
      setVisible(true);
      setTimeout(() => onShown?.(), 150);
    }, getDelay('show'));
  }, [enabled, onShow, onShown]); // eslint-disable-line

  // hide() — equivale a Tooltip.hide() de ui-core
  const hide = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onHide?.();
      setVisible(false);
      setTimeout(() => onHidden?.(), 150);
    }, getDelay('hide'));
  }, [onHide, onHidden]); // eslint-disable-line

  // toggle() — equivale a Tooltip.toggle() de ui-core
  const toggle = useCallback(() => visible ? hide() : show(), [visible, hide, show]);

  // enable() / disable() / toggleEnabled() — equivale a ui-core
  const enable        = useCallback(() => setEnabled(true),  []);
  const disable       = useCallback(() => setEnabled(false), []);
  const toggleEnabled = useCallback(() => setEnabled(e => !e), []);

  // update() — equivale a Tooltip.update() de ui-core
  const update = useCallback(() => {
    // useFloating gestiona el reposicionamiento automáticamente
  }, []);

  // setContent(content) — equivale a Tooltip.setContent() de ui-core
  const setContent = useCallback((c) => setDynamicContent(c), []);

  // dispose() — limpiar
  const dispose = useCallback(() => {
    hide();
    clearTimeout(timerRef.current);
  }, [hide]);

  // Ref imperativo — todos los métodos públicos de ui-core
  useImperativeHandle(ref, () => ({
    enable, disable, toggleEnabled, toggle,
    show, hide, update, setContent, dispose,
  }), [enable, disable, toggleEnabled, toggle, show, hide, update, setContent, dispose]);

  // Construir los event handlers según `trigger`
  const triggers = trigger.split(/\s+/);
  const triggerProps = {};
  if (triggers.includes('hover')) {
    triggerProps.onMouseEnter = show;
    triggerProps.onMouseLeave = hide;
  }
  if (triggers.includes('focus')) {
    triggerProps.onFocus = show;
    triggerProps.onBlur  = hide;
  }
  if (triggers.includes('click')) {
    triggerProps.onClick = toggle;
  }
  if (triggers.includes('manual')) {
    // Solo se controla via ref
  }

  const child = typeof children === 'string' ? <span>{children}</span> : children;

  const tooltipCls = [
    styles.tooltip,
    customClass,
    className,
  ].filter(Boolean).join(' ');

  return (
    <>
      <div
        ref={refs.setReference}
        className={styles.wrapper}
        aria-describedby={visible ? tipId : undefined}
        {...triggerProps}
      >
        {child}
      </div>

      <AnimatePresence>
        {visible && (
          <motion.div
            id={tipId}
            ref={refs.setFloating}
            role="tooltip"
            className={tooltipCls}
            style={floatingStyles}
            initial={animation ? { opacity: 0, scale: 0.92 } : undefined}
            animate={animation ? { opacity: 1, scale: 1 }    : undefined}
            exit={animation    ? { opacity: 0, scale: 0.92 } : undefined}
            transition={{ duration: 0.12 }}
          >
            <span className={styles.arrow} aria-hidden="true" />
            {/* html=false → siempre texto (sanitize por defecto) */}
            {resolvedContent}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

export default Tooltip;
export { Tooltip };
