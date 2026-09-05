/**
 * ScrollToTop — Kaupamex
 *
 * React Router v6 NO restablece el scroll al cambiar de ruta: al navegar
 * desde una lista scrolleada (catalogo / resultados de busqueda) al detalle
 * de un producto, la pagina nueva conservaba el offset anterior y "aparecia"
 * a media altura o hasta abajo. Este componente lleva el scroll al tope en
 * cada cambio de `pathname` (ignora cambios de `search`/`hash` para no
 * romper anclas ni la paginacion por query).
 *
 * Se monta una sola vez dentro de <BrowserRouter>.
 *
 * Excepcion: el **catalogo** (/catalog) gestiona su propio scroll — posiciona
 * la vista donde empiezan los productos, no en el hero/titulo. Forzar el tope
 * ahi dejaba los articulos debajo del pliegue al llegar por un filtro
 * (?orisha=..., ?cat=...). Ver CatalogPage.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Rutas que gestionan su propio scroll (no se les fuerza el tope).
const SELF_MANAGED = ['/catalog'];

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (SELF_MANAGED.includes(pathname)) return;
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
