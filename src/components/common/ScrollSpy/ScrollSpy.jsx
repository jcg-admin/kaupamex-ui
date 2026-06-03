// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/ScrollSpy/ScrollSpy.jsx
/**
 * ScrollSpy — ecommerce-ui
 * Actualiza automáticamente el link activo en una nav según la sección visible.
 *
 * Lógica completa de ui-core-5.25.0 scrollspy.js:
 *   - rootMargin: '0px 0px -25%' (default ui-core)
 *   - threshold: [0.1, 0.5, 1] (default ui-core)
 *   - smoothScroll: false (default ui-core)
 *   - target: selector de la nav a actualizar
 *   - Usa IntersectionObserver — API nativa del navegador
 *   - refresh(): re-observar secciones (equivale al método público de ui-core)
 *   - Activa/desactiva clase 'active' en los links de la nav
 *
 * Referencia: ui-core-5.25.0 scrollspy.js
 * Iniciativa: implementar-componentes-diferidos-ui-core
 *
 * Uso como hook:
 *   const { activeId } = useScrollSpy({ ids: ['intro', 'features', 'pricing'] });
 *
 * Uso como componente:
 *   <ScrollSpy ids={['intro','features']} navRef={navRef}>
 *     <section id="intro">...</section>
 *   </ScrollSpy>
 */
import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';

// ─── Hook interno (reutilizable) ────────────────────────────────────────────
export function useScrollSpy({
  ids            = [],
  rootMargin     = '0px 0px -25%',  // Default de ui-core
  threshold      = [0.1, 0.5, 1],   // Default de ui-core
  root           = null,
} = {}) {
  const [activeId, setActiveId] = useState(ids[0] ?? null);
  const observerRef = useRef(null);

  // refresh() — equivale al método público refresh() de ui-core
  const refresh = useCallback(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Elegir la entrada más visible (mayor intersectionRatio)
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { root, rootMargin, threshold }
    );

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observerRef.current.observe(el);
    }
  }, [ids.join(','), rootMargin, root]); // eslint-disable-line

  useEffect(() => {
    refresh();
    return () => observerRef.current?.disconnect();
  }, [refresh]);

  return { activeId, refresh };
}

// ─── Componente envoltorio ────────────────────────────────────────────────────
const ScrollSpy = forwardRef(function ScrollSpy({
  ids           = [],
  rootMargin    = '0px 0px -25%',
  threshold     = [0.1, 0.5, 1],
  smoothScroll  = false,          // Default de ui-core
  navRef,                          // ref a la nav que recibirá la clase active
  children,
  className     = '',
}, ref) {
  const { activeId, refresh } = useScrollSpy({ ids, rootMargin, threshold });

  // Exponer refresh() via ref (equivale al método público de ui-core)
  useImperativeHandle(ref, () => ({ refresh }), [refresh]);

  // Actualizar la nav: activar el link que apunta a activeId
  useEffect(() => {
    const nav = navRef?.current;
    if (!nav || !activeId) return;

    // Quitar active de todos
    for (const link of nav.querySelectorAll('a.active, [data-scrollspy-active]')) {
      link.classList.remove('active');
      link.removeAttribute('data-scrollspy-active');
      link.removeAttribute('aria-current');
    }

    // Activar el link que corresponde
    const activeLink = nav.querySelector(`a[href="#${activeId}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
      activeLink.setAttribute('data-scrollspy-active', 'true');
      activeLink.setAttribute('aria-current', 'location');
    }
  }, [activeId, navRef]);

  // smooth scroll al hacer click en los links de la nav (smoothScroll=true)
  useEffect(() => {
    if (!smoothScroll || !navRef?.current) return;
    const nav = navRef.current;

    const handleClick = (e) => {
      const href = e.target.closest('a')?.getAttribute('href');
      if (!href?.startsWith('#')) return;
      e.preventDefault();
      document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    };

    nav.addEventListener('click', handleClick);
    return () => nav.removeEventListener('click', handleClick);
  }, [smoothScroll, navRef]);

  return (
    <div className={className} data-scrollspy-active-id={activeId || undefined}>
      {children}
    </div>
  );
});

export default ScrollSpy;
export { ScrollSpy };
