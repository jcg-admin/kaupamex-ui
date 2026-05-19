/**
 * useAddProductWithVariant — PracticaYoruba
 * UC-CHT-02: Encapsula la validacion y agregado al carrito para productos
 * Yoruba con variantes:
 *
 *   1. Si el producto tiene variantes pero ninguna esta seleccionada,
 *      devuelve { ok:false, error:'VARIANTE_REQUERIDA' }.
 *   2. Si la variante seleccionada esta sin stock, devuelve
 *      { ok:false, error:'VARIANTE_SIN_STOCK' }.
 *   3. Si pasa la validacion, despacha addToCart con product_id, variant_id y
 *      quantity. Para productos sin variantes envia variant_id=null.
 *
 * La validacion final de stock y precio ocurre en el servidor (UC-CHT-02 §6.2);
 * estas verificaciones son la primera linea de defensa para evitar requests
 * obviamente invalidas.
 */
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '@redux/slices/cartSlice';

const errorCode = {
  VARIANT_REQUIRED: 'VARIANTE_REQUERIDA',
  VARIANT_NO_STOCK: 'VARIANTE_SIN_STOCK',
};

export default function useAddProductWithVariant() {
  const dispatch = useDispatch();
  const selectedVariantId = useSelector(
    (state) => state.yorubaVariants?.selectedVariantId ?? null,
  );

  const addProduct = useCallback(
    async (product, quantity = 1) => {
      const variants = Array.isArray(product?.variants) ? product.variants : [];
      const hasVariants = variants.length > 0;

      if (hasVariants && selectedVariantId == null) {
        return { ok: false, error: errorCode.VARIANT_REQUIRED };
      }

      let chosenVariant = null;
      if (hasVariants) {
        chosenVariant = variants.find((v) => v.id === selectedVariantId) ?? null;
        if (!chosenVariant || !(chosenVariant.stock > 0)) {
          return { ok: false, error: errorCode.VARIANT_NO_STOCK };
        }
      }

      const result = await dispatch(
        addToCart({
          productId: product.id,
          variantId: hasVariants ? selectedVariantId : null,
          quantity,
        }),
      );

      if (result?.error) {
        return { ok: false, error: result.error.message || 'ERROR' };
      }
      return { ok: true, variant: chosenVariant };
    },
    [dispatch, selectedVariantId],
  );

  return { addProduct, selectedVariantId };
}
