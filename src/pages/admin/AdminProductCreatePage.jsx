/**
 * AdminProductCreatePage — UC-CAT-09
 *
 * Pantalla admin para crear un nuevo producto en el catalogo Yoruba.
 *   POST /api/v1/admin/products/
 *
 * Reutiliza `AdminProductForm` (mode='create'). Las imagenes se envian
 * como FormData cuando hay archivo seleccionado; en caso contrario,
 * payload JSON plano.
 */
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createProduct, clearProductsActionState } from '@redux/slices/productsSlice';
import AdminProductForm from './AdminProductForm';
import styles from './AdminProductCreatePage.module.scss';

export default function AdminProductCreatePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isActioning, actionError } = useSelector((s) => s.products);

  const handleSubmit = async (payload, imageFile) => {
    let body = payload;
    if (imageFile) {
      body = new FormData();
      Object.entries(payload).forEach(([k, v]) => body.append(k, String(v)));
      body.append('image', imageFile);
    }
    const result = await dispatch(createProduct(body));
    if (createProduct.fulfilled.match(result)) {
      dispatch(clearProductsActionState());
      navigate('/admin/products');
    }
  };

  return (
    <section className={styles.page} aria-labelledby="product-create-title">
      <header className={styles.header}>
        <h1 id="product-create-title" className={styles.title}>
          Nuevo Producto
        </h1>
        <p className={styles.subtitle}>
          Crea un nuevo producto en el catalogo Yoruba.
        </p>
      </header>

      <AdminProductForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={isActioning}
        actionError={actionError?.message ?? (actionError ? 'Error al crear el producto.' : null)}
      />
    </section>
  );
}
