/**
 * AdminProductEditPage — UC-CAT-10
 *
 * Pantalla admin para editar un producto existente.
 *   GET   /api/v1/admin/products/:id/   (carga)
 *   PATCH /api/v1/admin/products/:id/   (guarda cambios)
 *
 * Reutiliza `AdminProductForm` (mode='edit'). El precio que se modifica
 * NO afecta ordenes ya creadas (BR-005 — snapshot inmutable).
 */
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '@services/apiService';
import { updateProduct, deactivateProduct, activateProduct, clearProductsActionState }
  from '@redux/slices/productsSlice';
import AdminProductForm from './AdminProductForm';
import styles from './AdminProductCreatePage.module.scss';

export default function AdminProductEditPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isActioning, actionError } = useSelector((s) => s.products);

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiService.get(`/api/v1/admin/products/${id}/`)
      .then(({ data }) => { if (!cancelled) { setProduct(data); setIsLoading(false); } })
      .catch((err) => { if (!cancelled) { setLoadError(err); setIsLoading(false); } });
    return () => { cancelled = true; };
  }, [id]);

  const handleSubmit = async (payload) => {
    const result = await dispatch(updateProduct({ id, ...payload }));
    if (updateProduct.fulfilled.match(result)) {
      dispatch(clearProductsActionState());
      navigate('/admin/products');
    }
  };

  const handleToggleActive = async () => {
    const fn = product.is_active ? deactivateProduct : activateProduct;
    const result = await dispatch(fn(id));
    if (fn.fulfilled.match(result)) {
      setProduct((p) => ({ ...p, is_active: !p.is_active }));
    }
  };

  if (isLoading) return <p>Cargando producto…</p>;
  if (loadError) return <p role="alert">No se pudo cargar el producto.</p>;
  if (!product)  return null;

  const initial = {
    name:              product.name ?? '',
    sku:               product.sku ?? '',
    short_description: product.short_description ?? '',
    description:       product.description ?? '',
    base_price:        product.base_price ?? '',
    stock:             product.stock ?? '',
    category_id:       product.category?.id ?? product.category_id ?? '',
    status:            product.status ?? (product.is_active ? 'PUBLICADO' : 'BORRADOR'),
  };

  return (
    <section className={styles.page} aria-labelledby="product-edit-title">
      <header className={styles.header}>
        <h1 id="product-edit-title" className={styles.title}>
          Editar Producto
        </h1>
        <p className={styles.subtitle}>
          SKU: <strong>{product.sku}</strong> · Estado:{' '}
          <strong>{product.is_active ? 'Activo' : 'Inactivo'}</strong>
        </p>
        <button
          type="button"
          onClick={handleToggleActive}
          disabled={isActioning}
        >
          {product.is_active ? 'Desactivar producto' : 'Reactivar producto'}
        </button>
      </header>

      <AdminProductForm
        mode="edit"
        initialValues={initial}
        onSubmit={handleSubmit}
        isSubmitting={isActioning}
        actionError={actionError?.message ?? (actionError ? 'Error al guardar los cambios.' : null)}
      />
    </section>
  );
}
