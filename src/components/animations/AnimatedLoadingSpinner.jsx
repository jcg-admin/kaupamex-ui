/**
 * AnimatedLoadingSpinner -- PracticaYoruba
 * Spinner con animacion para estados de carga inline.
 *
 * Consolidado sobre el primitivo nativo `Loader` (kno-react-indicators,
 * referencia no runtime): conserva el contrato publico `{ size, className }`
 * y delega el render al Loader (un solo spinner en el repo).
 */
import Loader from '@components/common/Loader/Loader';

const SIZE_MAP = { sm: 'small', md: 'medium', lg: 'large' };

export default function AnimatedLoadingSpinner({ size = 'md', className = '' }) {
  return <Loader type="infinite-spinner" size={SIZE_MAP[size] ?? 'medium'} className={className} />;
}
