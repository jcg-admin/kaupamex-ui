/**
 * Mock global de ToastContext para tests.
 *
 * ProductCard y useCart llaman useToast(); los tests de paginas no
 * montan ToastProvider. Este mock evita el throw y devuelve no-ops
 * para que los tests de renderizado pasen sin necesitar el Provider.
 */
const noop = jest.fn();

const toastMock = {
  toast:   noop,
  success: noop,
  error:   noop,
  warning: noop,
  info:    noop,
  dismiss: noop,
  toasts:  [],
};

export function useToast() {
  return toastMock;
}

export function ToastProvider({ children }) {
  return children;
}

export default { useToast, ToastProvider };
