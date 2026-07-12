/**
 * useAdminMenu — menú admin dinámico por capacidades (DEC-08/09).
 *
 * Consume GET /api/v2/authz/me/menu/ (api@c359164): el backend devuelve el
 * árbol ya podado por las capacidades del usuario, con hasta 3 niveles
 * (sección → item | agrupador → sub-item). Cada nodo:
 *   { key, label, route, icon, order, capability, children:[...] }
 * Un nodo con `route` es un destino (hoja); sin `route` es un agrupador
 * (sección nivel 0 o subgrupo nivel 1) que se renderiza colapsable.
 *
 * Degradación gradual: mientras carga o si el endpoint falla, se devuelve el
 * `fallback` (el ADMIN_NAV estático) normalizado a la misma forma de árbol,
 * para no dejar al admin sin navegación. El candado real es el backend
 * (HasCapability); el menú es proyección UX.
 */
import { useQuery } from '@tanstack/react-query';
import { getAdminMenu } from '@services/apiService';

/** Normaliza el ADMIN_NAV estático ([{section,items:[{to,label}]}]) a nodos. */
function normalizeFallback(adminNav) {
  return (adminNav || []).map((group) => ({
    label: group.section,
    route: '',
    children: (group.items || []).map((it) => ({
      label: it.label,
      route: it.to,
      children: [],
    })),
  }));
}

export default function useAdminMenu(fallback = []) {
  const { data, isSuccess } = useQuery({
    queryKey: ['admin', 'menu'],
    queryFn: getAdminMenu,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Solo se adopta el menú dinámico si la respuesta es un array (el usuario
  // sin capacidades recibe [] y ahí sí se muestra vacío — es correcto). El
  // fallback estático cubre carga/error.
  const dynamic = isSuccess && Array.isArray(data) ? data : null;
  return {
    nav: dynamic !== null ? dynamic : normalizeFallback(fallback),
    isDynamic: dynamic !== null,
  };
}
