/**
 * PageLoader — PracticaYoruba
 * Loader fullscreen para Suspense y rutas protegidas en carga.
 *
 * El spinner delega en el primitivo nativo `Loader` (kno-react-indicators,
 * referencia no runtime). El `Loader` porta el `role="status"` con el mensaje
 * como aria-label; el `<p>` lo muestra visualmente.
 */
import Loader from '@components/common/Loader/Loader';
import styles from './PageLoader.module.scss';

export default function PageLoader({ message = 'Cargando...' }) {
  return (
    <div className={styles.wrapper}>
      <Loader type="infinite-spinner" size="large" ariaLabel={message} />
      <p className={styles.message}>{message}</p>
    </div>
  );
}
