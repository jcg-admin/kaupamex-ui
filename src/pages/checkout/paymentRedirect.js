/**
 * paymentRedirect — helper aislado para redirigir al entorno del gateway.
 * Aislarlo permite mockearlo en tests sin manipular `window.location`.
 */
export function redirectToGateway(url) {
  if (url) window.location.href = url;
}

export default redirectToGateway;
