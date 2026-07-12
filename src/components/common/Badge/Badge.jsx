// Adaptado de @progress/kno-react-indicators (Badge) — referencia no runtime.
// Reimplementacion nativa: etiqueta presentacional (un <span> con children).
// Preserva el contrato publico relevante: size / themeColor / rounded /
// fillMode / align / position / cutoutBorder / children.
//
// Nota de adaptacion: la referencia posiciona SIEMPRE en la esquina (default
// align top-end, position 'edge'). Aqui, si NO se pasa `align`, el badge se
// renderiza INLINE (estatico) — el caso "contador suelto" (p. ej. la bolsa del
// header). Con `align` presente, se posiciona en la esquina del contenedor
// (patron BadgeContainer: icono/avatar + badge superpuesto). Un solo primitivo
// cubre ambos usos sin forzar un contenedor cuando no hace falta.
import styles from './Badge.module.scss';

const SIZES = { small: styles.sm, medium: styles.md, large: styles.lg };
const THEMES = {
  base: styles.base,
  primary: styles.primary,
  secondary: styles.secondary,
  info: styles.info,
  success: styles.success,
  warning: styles.warning,
  error: styles.error,
};
const ROUNDED = {
  none: styles.rNone,
  small: styles.rSm,
  medium: styles.rMd,
  large: styles.rLg,
  full: styles.rFull,
};

function cornerClass(align) {
  if (!align) return null;
  const v = align.vertical === 'bottom' ? 'bottom' : 'top';
  const h = align.horizontal === 'start' ? 'start' : 'end';
  return styles[`corner_${v}_${h}`];
}

export default function Badge({
  children,
  size = 'medium',
  themeColor = 'secondary',
  rounded = 'full',
  fillMode = 'solid',
  align,
  cutoutBorder = false,
  className,
  ...rest
}) {
  const classes = [
    styles.badge,
    SIZES[size] ?? styles.md,
    THEMES[themeColor] ?? styles.secondary,
    ROUNDED[rounded] ?? styles.rFull,
    fillMode === 'outline' ? styles.outline : styles.solid,
    align ? styles.positioned : styles.inline,
    cornerClass(align),
    cutoutBorder && styles.cutout,
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} data-position={align ? 'corner' : 'inline'} {...rest}>
      {children}
    </span>
  );
}
