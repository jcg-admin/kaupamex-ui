// Adaptado de @progress/kno-react-indicators (Loader) — referencia no runtime.
// Reimplementacion nativa: indicador de carga presentacional (role="status").
// Contrato publico: type ('pulsing' | 'infinite-spinner' | 'converging-spinner')
// · size ('small' | 'medium' | 'large') · themeColor ('base' | 'primary' |
// 'secondary' | 'tertiary') · ariaLabel. Consolida los 3 spinners ad-hoc del
// repo (AnimatedLoadingSpinner, PageLoader, LoadingButton) en un solo primitivo.
import styles from './Loader.module.scss';

const SIZES = { small: styles.sm, medium: styles.md, large: styles.lg };
const THEMES = {
  base: styles.base,
  primary: styles.primary,
  secondary: styles.secondary,
  tertiary: styles.tertiary,
};

export default function Loader({
  type = 'infinite-spinner',
  size = 'medium',
  themeColor = 'primary',
  ariaLabel = 'Cargando',
  className,
  ...rest
}) {
  const sizeClass = SIZES[size] ?? styles.md;
  const themeClass = THEMES[themeColor] ?? styles.primary;

  // Los spinners circulares (infinite/converging) son un elemento; el pulsing
  // son 3 puntos. data-type expone el tipo para tests (clases mockeadas en jest).
  const isDots = type === 'pulsing' || type === 'converging-spinner';

  return (
    <span
      className={[styles.loader, sizeClass, themeClass, className].filter(Boolean).join(' ')}
      role="status"
      aria-label={ariaLabel}
      data-type={type}
      {...rest}
    >
      {isDots ? (
        <span className={type === 'pulsing' ? styles.pulsing : styles.converging}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </span>
      ) : (
        <span className={styles.ring} />
      )}
    </span>
  );
}
