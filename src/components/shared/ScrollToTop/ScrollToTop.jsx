/**
 * ScrollToTop — PracticaYoruba
 *
 * React Router v6 NO restablece el scroll al cambiar de ruta: al navegar
 * desde una lista scrolleada (catalogo / resultados de busqueda) al detalle
 * de un producto, la pagina nueva conservaba el offset anterior y "aparecia"
 * a media altura o hasta abajo. Este componente lleva el scroll al tope en
 * cada cambio de `pathname` (ignora cambios de `search`/`hash` para no
 * romper anclas ni la paginacion por query).
 *
 * Se monta una sola vez dentro de <BrowserRouter>.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
