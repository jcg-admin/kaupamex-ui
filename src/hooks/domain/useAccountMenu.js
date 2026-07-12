/**
 * useAccountMenu — menú de cuenta del comprador, registro-dirigido
 * (DEC-AUTHZ-BUYER).
 *
 * Consume GET /api/v2/authz/me/menu/?audience=account: el backend devuelve el
 * árbol de la sección 'Mi cuenta' ya podado por las capacidades ``account.*``
 * del rol 'comprador'. Aplana las hojas a la forma de NavLink que consume
 * AccountLayout, decorando ``end`` (Resumen) y ``badge`` (Notificaciones) por
 * ruta — así agregar/quitar una entrada de cuenta es sembrar/despublicar una
 * fila en el backend, sin tocar la navegación del UI ni poner la negación aquí.
 *
 * Degradación: mientras carga, si el endpoint falla, o si el usuario aún no
 * tiene el rol 'comprador' (árbol vacío), se devuelve el ``fallback`` estático
 * para no dejar al comprador sin navegación. El candado real es el backend.
 */
import { useQuery } from '@tanstack/react-query';
import { getAccountMenu } from '@services/apiService';

/** Aplana las hojas (nodos con ``route``) de un árbol de menú. */
function flattenLeaves(nodes) {
  const out = [];
  for (const node of nodes || []) {
    if (node.route) out.push({ to: node.route, label: node.label });
    if (node.children?.length) out.push(...flattenLeaves(node.children));
  }
  return out;
}

export default function useAccountMenu(fallback = [], { enabled = true } = {}) {
  const { data, isSuccess } = useQuery({
    queryKey: ['account', 'menu'],
    queryFn: getAccountMenu,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled,
  });

  const leaves = isSuccess && Array.isArray(data) ? flattenLeaves(data) : [];
  // Solo se adopta el menú dinámico si trae entradas. Vacío (usuario sin rol
  // 'comprador' aún, o error) => fallback estático, para no dejarlo sin menú.
  const dynamic = leaves.length
    ? leaves.map((it) => ({
        to: it.to,
        label: it.label,
        end: it.to === '/account',
        badge: it.to === '/account/notifications',
      }))
    : null;

  return { items: dynamic ?? fallback, isDynamic: dynamic !== null };
}
