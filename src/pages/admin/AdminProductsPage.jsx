/**
 * AdminProductsPage — Práctica Yorùbà
 * Tabla de productos con filtros + acciones CRUD.
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchAdminProducts, deleteProduct, toggleProductFeatured } from '@redux/slices/adminSlice';
import { MetaTag, Button, Price } from '@components/common/primitives';
import styles from './AdminTablePage.module.scss';

const STATUS = [
  { id: 'all',         label: 'Todos' },
  { id: 'published',   label: 'Publicados' },
  { id: 'draft',       label: 'Borradores' },
  { id: 'out_of_stock', label: 'Sin stock' },
];

export default function AdminProductsPage() {
  const dispatch = useDispatch();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const products = useSelector((s) => s.admin?.products || []);
  const isLoading = useSelector((s) => s.admin?.isLoadingProducts);

  useEffect(() => { dispatch(fetchAdminProducts({ filter, search })); }, [dispatch, filter, search]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <MetaTag tone="bronze">Catálogo · {products.length} productos</MetaTag>
          <h1 className={styles.title}>Productos</h1>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary">Importar CSV</Button>
          <Link to="/admin/productos/nuevo"><Button variant="primary">+ Nuevo producto</Button></Link>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {STATUS.map((s) => (
            <button
              key={s.id}
              className={`${styles.filterBtn} ${filter === s.id ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter(s.id)}
            >{s.label}</button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Buscar por nombre, SKU u òrìsà…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
        />
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 60 }}></th>
              <th>Producto</th>
              <th>SKU</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={8} className={styles.loading}>Cargando productos…</td></tr>
            )}
            {!isLoading && products.length === 0 && (
              <tr><td colSpan={8} className={styles.empty}>Sin productos que coincidan</td></tr>
            )}
            {!isLoading && products.map((p) => {
              /* H-CICLO31-01: ProductAdminSerializer devuelve `images` (array de
                 objetos con image_url) y `category` (objeto), no los campos planos
                 `image_url`, `orisha_name`, `has_discount` ni `discount_pct`.
                 Se extraen los valores correctos de la estructura real de la API. */
              const coverImageUrl = p.images?.[0]?.image_url ?? null;
              const categoryName  = p.category?.name ?? '—';
              const discountPct   = p.discount?.pct ?? null;
              return (
                <tr key={p.id}>
                  <td className={styles.thumbCol}>
                    <div className={styles.thumb}>
                      {coverImageUrl ? <img src={coverImageUrl} alt="" loading="lazy" /> : null}
                    </div>
                  </td>
                  <td>
                    <Link to={`/admin/productos/${p.id}`} className={styles.itemName}>
                      {p.name}
                      {p.is_featured && <span className={styles.starBadge}>★</span>}
                    </Link>
                  </td>
                  <td className={styles.mono}>{p.sku}</td>
                  <td>{categoryName}</td>
                  <td className={styles.right}>
                    <Price amount={p.price_with_tax || p.base_price} size="sm" />
                    {discountPct != null && <div className={styles.discountTag}>−{discountPct}%</div>}
                  </td>
                  <td className={styles.right}>
                    <span className={p.stock === 0 ? styles.stockOut : p.stock < 5 ? styles.stockLow : styles.stockOk}>
                      {p.stock}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusPill} ${styles[`pill_${p.is_published ? 'lime' : 'muted'}`]}`}>
                      {p.is_published ? 'Publicado' : 'Borrador'}
                    </span>
                  </td>
                  <td className={styles.actions}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => dispatch(toggleProductFeatured(p.id))}
                      title={p.is_featured ? 'Quitar destacado' : 'Destacar'}
                    >★</button>
                    <Link to={`/admin/productos/${p.id}`} className={styles.actionBtn} title="Editar">✎</Link>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.actionDelete}`}
                      onClick={() => {
                        if (window.confirm(`¿Eliminar "${p.name}"?`)) dispatch(deleteProduct(p.id));
                      }}
                      title="Eliminar"
                    >×</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
