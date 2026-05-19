/**
 * VariantSelector — PracticaYoruba
 * UC-CHT-01: Selector visual de variantes (Tamano/Presentacion/Material) del
 * producto Yoruba. Muestra nombre, precio y disponibilidad. Marca la variante
 * seleccionada via aria-pressed y deshabilita las que no tienen stock.
 *
 * El estado de seleccion vive en yorubaVariantsSlice para que UC-CHT-02
 * (agregar al carrito) pueda leerlo desde otros componentes.
 */
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectVariant } from '@redux/slices/yorubaVariantsSlice';
import styles from './VariantSelector.module.scss';

const formatPrice = (value) =>
  Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2 });

export default function VariantSelector({ variants }) {
  const dispatch = useDispatch();
  const selectedVariantId = useSelector(
    (state) => state.yorubaVariants.selectedVariantId,
  );

  // Preseleccion automatica cuando solo una variante tiene stock.
  useEffect(() => {
    if (!Array.isArray(variants) || variants.length === 0) return;
    if (selectedVariantId != null) return;
    const inStock = variants.filter((v) => v.stock > 0);
    if (inStock.length === 1) {
      dispatch(selectVariant(inStock[0].id));
    }
  }, [variants, selectedVariantId, dispatch]);

  if (!Array.isArray(variants) || variants.length === 0) return null;

  return (
    <div
      className={styles.selector}
      role="group"
      aria-label="Variantes disponibles del producto"
    >
      {variants.map((variant) => {
        const isOutOfStock = !variant.stock || variant.stock <= 0;
        const isSelected   = selectedVariantId === variant.id;
        return (
          <button
            key={variant.id}
            type="button"
            className={[
              styles.option,
              isSelected ? styles.selected : '',
              isOutOfStock ? styles.outOfStock : '',
            ].join(' ')}
            disabled={isOutOfStock}
            aria-disabled={isOutOfStock}
            aria-pressed={isSelected}
            onClick={() => dispatch(selectVariant(variant.id))}
          >
            <span className={styles.name}>{variant.name}</span>
            <span className={styles.price}>${formatPrice(variant.price)}</span>
            {isOutOfStock && (
              <span className={styles.stockTag}>Sin stock</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
