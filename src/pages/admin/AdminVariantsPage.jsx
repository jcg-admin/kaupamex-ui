/**
 * AdminVariantsPage — PracticaYoruba
 * UC-CHT-03: Gestionar variantes de un producto Yoruba (Admin).
 *
 * - Lista las variantes actuales (tipo, opcion, stock, precio, estado).
 * - Permite crear una variante nueva (tipo + opcion + stock inicial).
 * - Permite alternar activo/inactivo de cada variante.
 * - Cada fila tiene enlace a UC-CHT-04 (precio diferenciado).
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAdminVariants,
  createVariant,
  toggleVariantActive,
  clearVariantActionState,
} from '@redux/slices/yorubaVariantsSlice';
import styles from './AdminVariantsPage.module.scss';

const TYPE_OPTIONS = ['Tamano', 'Presentacion', 'Material'];

export default function AdminVariantsPage() {
  const { productId } = useParams();
  const dispatch = useDispatch();
  const { adminVariants, isLoading, isActioning, actionError } =
    useSelector((s) => s.yorubaVariants);

  const [variantType, setVariantType] = useState('Tamano');
  const [optionName,  setOptionName]  = useState('');
  const [initialStock, setInitialStock] = useState('0');

  useEffect(() => {
    dispatch(fetchAdminVariants(productId));
    return () => { dispatch(clearVariantActionState()); };
  }, [dispatch, productId]);

  const handleCreate = (event) => {
    event.preventDefault();
    if (!optionName.trim()) return;
    dispatch(createVariant({
      productId,
      variantType,
      optionName: optionName.trim(),
      initialStock: Number(initialStock) || 0,
    })).then(() => {
      setOptionName('');
      setInitialStock('0');
    });
  };

  const handleToggle = (variant) => {
    dispatch(toggleVariantActive({
      productId,
      variantId: variant.id,
      isActive:  !variant.is_active,
    }));
  };

  return (
    <section className={styles.page} aria-labelledby="variants-title">
      <Link to="/admin/products" className={styles.backLink}>
        ← Volver al catalogo
      </Link>

      <h1 id="variants-title" className={styles.title}>
        Variantes del producto
      </h1>
      <p className={styles.meta}>Producto #{productId}</p>

      {/* Formulario de creacion */}
      <form onSubmit={handleCreate} className={styles.createForm}>
        <h2 className={styles.subtitle}>Agregar variante</h2>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label htmlFor="variant-type">Tipo de variante</label>
            <select
              id="variant-type"
              value={variantType}
              onChange={(e) => setVariantType(e.target.value)}
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="option-name">Opcion</label>
            <input
              id="option-name"
              type="text"
              value={optionName}
              onChange={(e) => setOptionName(e.target.value)}
              placeholder="Ej. Chico, 250ml, Cobre"
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="initial-stock">Stock inicial</label>
            <input
              id="initial-stock"
              type="number"
              min="0"
              value={initialStock}
              onChange={(e) => setInitialStock(e.target.value)}
            />
          </div>
        </div>

        {actionError && (
          <p role="alert" className={styles.error}>
            {typeof actionError === 'string' ? actionError : 'No se pudo crear la variante.'}
          </p>
        )}

        <button
          type="submit"
          className={styles.primaryBtn}
          disabled={isActioning}
        >
          {isActioning ? 'Creando…' : 'Crear variante'}
        </button>
      </form>

      {/* Listado de variantes */}
      {isLoading && <p className={styles.loading}>Cargando variantes…</p>}

      {!isLoading && adminVariants.length === 0 && (
        <p className={styles.empty}>No hay variantes configuradas para este producto.</p>
      )}

      {adminVariants.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Opcion</th>
              <th>Stock</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {adminVariants.map((variant) => (
              <tr key={variant.id}>
                <td>{variant.variant_type}</td>
                <td>{variant.option_name}</td>
                <td>{variant.stock}</td>
                <td>
                  {variant.price != null
                    ? `$${Number(variant.price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                    : '—'}
                </td>
                <td>
                  <span className={variant.is_active ? styles.activeBadge : styles.inactiveBadge}>
                    {variant.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className={styles.actions}>
                  <button
                    type="button"
                    className={styles.toggleBtn}
                    onClick={() => handleToggle(variant)}
                  >
                    {variant.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                  <Link
                    to={`/admin/variants/${variant.id}/price`}
                    className={styles.priceLink}
                  >
                    Precio
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
