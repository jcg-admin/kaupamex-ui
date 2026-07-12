// Adaptado de @progress/kno-react-layout (Breadcrumb) — referencia no runtime.
// Reimplementacion nativa: encapsula el patron repetido
// `<nav><Link/><span>/</span>…<span current>` presente en 11 paginas.
// Contrato via `items` (array de `{label, to?|href?, key?}`): el ultimo item
// es el "actual" (sin enlace) y recibe `aria-current="page"`.
//
// Nota de adaptacion: preserva el look exacto de cada sitio. El consumidor
// pasa su propia clase de nav (`className`, su modulo scss) y la clase del
// item actual (`currentClassName`, p. ej. `styles.bcCurrent`); el separador
// es configurable (`separator`, bare `<span>` como en el markup original).
// Sin `className` usa su base propia (para usos nuevos).
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import styles from './Breadcrumb.module.scss';

export default function Breadcrumb({
  items = [],
  className,
  currentClassName,
  separator = '/',
  ariaLabel = 'Ruta de navegación',
  ...rest
}) {
  return (
    <nav className={className ?? styles.breadcrumb} aria-label={ariaLabel} {...rest}>
      {items.map((it, i) => {
        const isLast = i === items.length - 1;
        const key = it.key ?? i;
        let node;
        if (isLast) {
          node = (
            <span className={currentClassName} aria-current="page">{it.label}</span>
          );
        } else if (it.to) {
          node = <Link to={it.to}>{it.label}</Link>;
        } else if (it.href) {
          node = <a href={it.href}>{it.label}</a>;
        } else {
          node = <span>{it.label}</span>;
        }
        return (
          <Fragment key={key}>
            {node}
            {!isLast && <span>{separator}</span>}
          </Fragment>
        );
      })}
    </nav>
  );
}
