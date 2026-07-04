/**
 * CatalogFilters — UC-CAT-04 + UC-CAT-05.
 *
 * Panel lateral del catalogo que permite al visitante filtrar por:
 *   - categoria (una o varias del arbol publico — multi-seleccion),
 *   - rango de precio (price_min / price_max sobre `price_with_tax`).
 *
 * El estado vive en la URL (`?category=`, `?price_min=`, `?price_max=`)
 * para que las URLs sean compartibles y la pagina sea idempotente
 * frente a recarga. El padre (CatalogPage) refleja los params al
 * thunk `fetchProducts({ category, price_min, price_max, q })`.
 *
 * Diseno (T-11, DEC-STF-11, opcion B multi-categoria + Offcanvas movil):
 * reusa los componentes ya portados de ui-core — RangeSlider (precio), Chip
 * (filtros activos removibles), Button (acciones), Offcanvas (drawer en
 * movil) — y la paleta de marca. La categoria usa checkboxes accesibles
 * (multi-seleccion) en vez de un <select> nativo; el contrato `?category=`
 * es repetible (`?category=a&category=b`).
 */
import { useState, useEffect } from 'react';
import { useCategories } from '@hooks/domain/useCategories';
import { RangeSlider, Chip, Offcanvas } from '@components/common';
import { Button } from '@components/common/primitives';
import Icon from '@components/common/Icon/Icon';
import styles from './CatalogFilters.module.scss';

const PRICE_CEILING_DEFAULT = 10000;

function flattenTree(nodes, depth = 0, acc = []) {
  if (!Array.isArray(nodes)) return acc;
  for (const n of nodes) {
    acc.push({ id: n.id, slug: n.slug, name: n.name, depth });
    if (Array.isArray(n.children) && n.children.length) {
      flattenTree(n.children, depth + 1, acc);
    }
  }
  return acc;
}

const fmtMoney = (v) => `$${Number(v).toLocaleString('es-MX')}`;

export default function CatalogFilters({
  categories: categoriesProp = [],
  priceMin: priceMinProp = '',
  priceMax: priceMaxProp = '',
  priceCeiling = PRICE_CEILING_DEFAULT,
  onChange,
}) {
  // El padre puede pasar un slug suelto o un arreglo; normalizamos a lista.
  const selected = Array.isArray(categoriesProp)
    ? categoriesProp
    : (categoriesProp ? [categoriesProp] : []);
  const { data: catData } = useCategories();
  const tree = catData?.results ?? [];
  const flat = flattenTree(tree);

  const [priceMin, setPriceMin] = useState(priceMinProp);
  const [priceMax, setPriceMax] = useState(priceMaxProp);
  const [priceError, setPriceError] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setPriceMin(priceMinProp); }, [priceMinProp]);
  useEffect(() => { setPriceMax(priceMaxProp); }, [priceMaxProp]);

  const toggleCategory = (slug) => {
    const next = selected.includes(slug)
      ? selected.filter((s) => s !== slug)
      : [...selected, slug];
    onChange?.({ category: next });
  };

  const handlePriceApply = (e) => {
    e?.preventDefault();
    const min = priceMin === '' ? null : Number(priceMin);
    const max = priceMax === '' ? null : Number(priceMax);
    if (min !== null && (Number.isNaN(min) || min < 0)) {
      setPriceError('El precio minimo debe ser un numero >= 0.');
      return;
    }
    if (max !== null && (Number.isNaN(max) || max < 0)) {
      setPriceError('El precio maximo debe ser un numero >= 0.');
      return;
    }
    if (min !== null && max !== null && max < min) {
      setPriceError('El precio maximo no puede ser menor que el minimo.');
      return;
    }
    setPriceError('');
    onChange?.({ price_min: min, price_max: max });
  };

  const clearPrice = () => {
    setPriceMin('');
    setPriceMax('');
    setPriceError('');
    onChange?.({ price_min: null, price_max: null });
  };

  const handleClear = () => {
    setPriceMin('');
    setPriceMax('');
    setPriceError('');
    onChange?.({ category: [], price_min: null, price_max: null });
  };

  // Valores del slider derivados de los inputs (clamp al rango permitido).
  const sliderLo = priceMin === '' ? 0 : Math.min(priceCeiling, Math.max(0, Number(priceMin) || 0));
  const sliderHi = priceMax === '' ? priceCeiling : Math.min(priceCeiling, Math.max(0, Number(priceMax) || priceCeiling));

  const activeCategories = flat.filter((c) => selected.includes(c.slug));
  const hasPrice = priceMinProp !== '' || priceMaxProp !== '';
  const hasAnyActive = selected.length > 0 || hasPrice;

  const priceChipLabel = `Precio: ${priceMinProp !== '' ? fmtMoney(priceMinProp) : '$0'} – ${priceMaxProp !== '' ? fmtMoney(priceMaxProp) : '∞'}`;

  // Cuerpo compartido por el aside (desktop) y el drawer (movil). `scope`
  // prefija ids/names para que no colisionen cuando ambos coexisten.
  const renderBody = (scope) => (
    <div className={styles.body}>
      {hasAnyActive && (
        <div className={styles.activeFilters} aria-label="Filtros activos">
          {activeCategories.map((c) => (
            <Chip
              key={c.slug}
              removable
              onRemove={() => toggleCategory(c.slug)}
              ariaRemoveLabel={`Quitar ${c.name}`}
            >
              {c.name}
            </Chip>
          ))}
          {hasPrice && (
            <Chip removable onRemove={clearPrice} ariaRemoveLabel="Quitar precio">
              {priceChipLabel}
            </Chip>
          )}
        </div>
      )}

      {/* UC-CAT-04: categoria (checkboxes accesibles, multi-seleccion) */}
      <fieldset className={styles.group}>
        <legend className={styles.groupTitle}>Categoria</legend>
        <div className={styles.checkList} role="group" aria-label="Categoria">
          {flat.map((c) => (
            <label
              key={c.id}
              className={styles.check}
              style={{ paddingLeft: `${c.depth * 16}px` }}
            >
              <input
                type="checkbox"
                name={`category-${scope}`}
                value={c.slug}
                checked={selected.includes(c.slug)}
                onChange={() => toggleCategory(c.slug)}
              />
              <span>{c.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* UC-CAT-05: rango de precio (slider + inputs sincronizados) */}
      <form className={styles.group} onSubmit={handlePriceApply}>
        <fieldset className={styles.fieldset}>
          <legend className={styles.groupTitle}>Precio (con IVA)</legend>
          <RangeSlider
            min={0}
            max={priceCeiling}
            value={[sliderLo, sliderHi]}
            tooltipsFormat={fmtMoney}
            onChange={([lo, hi]) => {
              setPriceMin(lo <= 0 ? '' : String(lo));
              setPriceMax(hi >= priceCeiling ? '' : String(hi));
            }}
            className={styles.slider}
          />
          <div className={styles.priceRow}>
            <label className={styles.priceLabel}>
              Min
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                aria-label="Precio minimo"
              />
            </label>
            <label className={styles.priceLabel}>
              Max
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                aria-label="Precio maximo"
              />
            </label>
          </div>
          {priceError && (
            <p role="alert" className={styles.error}>{priceError}</p>
          )}
          <Button type="submit" variant="primary" block>
            Aplicar precio
          </Button>
        </fieldset>
      </form>

      {hasAnyActive && (
        <Button variant="ghost" block onClick={handleClear}>
          Limpiar filtros
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Trigger del drawer — solo visible en movil (CSS). */}
      <button
        type="button"
        className={styles.mobileTrigger}
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir filtros"
      >
        Filtros{hasAnyActive ? ' · activos' : ''}
      </button>

      <aside className={styles.filters} aria-label="Filtros del catalogo">
        <h2 className={styles.title}>Filtros</h2>
        {renderBody('d')}
      </aside>

      <Offcanvas
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        placement="start"
        className={styles.drawer}
      >
        <div className={styles.drawerHead}>
          <h2 className={styles.title}>Filtros</h2>
          <button
            type="button"
            className={styles.drawerClose}
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar filtros"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        {renderBody('m')}
      </Offcanvas>
    </>
  );
}
