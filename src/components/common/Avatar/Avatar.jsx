// Adaptado de @progress/kno-react-layout (Avatar) — referencia no runtime.
// Reimplementacion nativa: encapsula el patron repetido `src ? <img> :
// iniciales/icono`. Contrato: `src` (imagen), `initials` (fallback texto),
// `icon` (nodo), o `children` (contenido libre, estilo kno type=icon/custom);
// `size` (xs/sm/md/lg/xl) · `rounded` (full/md/none) · `className`.
//
// Nota de adaptacion: si el consumidor pasa `className` (su propia clase de
// avatar con tamaño/estilo), Avatar respeta ESA clase y solo aporta la lógica
// de contenido — preserva el look exacto de cada sitio existente. Sin
// `className`, usa su base + tamaño propio (para usos nuevos).
import styles from './Avatar.module.scss';

const SIZES = { xs: styles.xs, sm: styles.sm, md: styles.md, lg: styles.lg, xl: styles.xl };
const ROUNDED = { full: styles.rFull, md: styles.rMd, none: styles.rNone };

export default function Avatar({
  src,
  alt = '',
  initials,
  icon,
  children,
  size,
  rounded,
  className,
  ...rest
}) {
  let content = children;
  if (content == null) {
    if (src) content = <img src={src} alt={alt} />;
    else content = initials ?? icon ?? null;
  }

  const sizeClass = size ? SIZES[size] : null;
  const roundedClass = rounded ? ROUNDED[rounded] : null;

  // Con className del consumidor: su clase manda (look existente intacto).
  // Sin className: base propia + defaults.
  const classes = className
    ? [className, sizeClass, roundedClass].filter(Boolean).join(' ')
    : [styles.avatar, sizeClass ?? styles.md, roundedClass ?? styles.rFull].filter(Boolean).join(' ');

  return (
    <div className={classes} {...rest}>
      {content}
    </div>
  );
}
