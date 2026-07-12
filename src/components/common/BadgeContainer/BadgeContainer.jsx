// Adaptado de @progress/kno-react-indicators (BadgeContainer) — referencia no
// runtime. Reimplementacion nativa: contenedor de posicionamiento que ancla un
// `Badge` en la esquina de su contenido (offset parent para el `align` del
// Badge). Preserva el patron `<BadgeContainer>contenido<Badge align.../></...>`.
import styles from './BadgeContainer.module.scss';

export default function BadgeContainer({ children, className, ...rest }) {
  return (
    <span className={[styles.container, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </span>
  );
}
