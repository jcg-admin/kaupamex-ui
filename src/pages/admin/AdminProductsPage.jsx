/**
 * AdminProductsPage — Práctica Yorùbà
 * Tabla de productos con filtros + acciones CRUD.
 */

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchAdminProducts, deleteProduct, toggleProductFeatured } from '@redux/slices/adminSlice';
import { MetaTag, Button, Price } from '@components/common/primitives';
import { DataTable } from '@components/common/DataTable/DataTable';
import ConfirmDialog from '@components/common/ConfirmDialog/ConfirmDialog';
import SegmentedControl from '@components/common/SegmentedControl/SegmentedControl';
import Icon from '@components/common/Icon/Icon';
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
  // H-04: producto pendiente de confirmación de borrado (diálogo de marca en
  // vez de window.confirm nativo).
  const [pendingDelete, setPendingDelete] = useState(null);
  const products = useSelector((s) => s.admin?.products || []);
  const isLoading = useSelector((s) => s.admin?.isLoadingProducts);
  // H-CICLO120-02: leer errores del slice para retroalimentar al admin.
  // Sin estos selectores cualquier fallo del API (network, 403, 500) o
  // un delete rechazado pasa desapercibido — la tabla simplemente no
  // actualiza sin ningún mensaje visible.
  const productsError = useSelector((s) => s.admin?.productsError ?? null);
  const actionError   = useSelector((s) => s.admin?.actionError ?? null);

  useEffect(() => { dispatch(fetchAdminProducts({ filter, search })); }, [dispatch, filter, search]);

  const columns = useMemo(() => [
    {
      key: 'thumb',
      header: '',
      render: (p) => {
        const coverImageUrl = p.images?.[0]?.image_url ?? null;
        return (
          <div className={styles.thumb}>
            {coverImageUrl ? <img src={coverImageUrl} alt="" loading="lazy" /> : null}
          </div>
        );
      },
    },
    {
      key: 'name',
      header: 'Producto',
      sortable: true,
      render: (p) => (
        <Link to={`/admin/products/${p.id}/edit`} className={styles.itemName}>
          {p.name}
          {p.is_featured && <span className={styles.starBadge}><Icon name="star" size={13} /></span>}
        </Link>
      ),
    },
    {
      key: 'sku',
      header: 'SKU',
      sortable: true,
      render: (p) => <span className={styles.mono}>{p.sku}</span>,
    },
    {
      key: 'category',
      header: 'Categoría',
      sortable: true,
      // UC-CAT-13: M2M -> la API expone `categories` (lista), no `category`
      // singular. Leer categories[0] (o category_name si estuviera presente).
      value: (p) => p.categories?.[0]?.name ?? p.category_name ?? '',
      render: (p) => p.categories?.[0]?.name ?? p.category_name ?? '—',
    },
    {
      key: 'price',
      header: 'Precio',
      sortable: true,
      align: 'right',
      value: (p) => Number(p.price_with_tax || p.base_price || 0),
      render: (p) => {
        const discountPct = p.discount?.pct ?? null;
        return (
          <>
            <Price amount={p.price_with_tax || p.base_price} size="sm" />
            {discountPct != null && <div className={styles.discountTag}>−{discountPct}%</div>}
          </>
        );
      },
    },
    {
      key: 'stock',
      header: 'Stock',
      sortable: true,
      align: 'right',
      value: (p) => Number(p.stock ?? 0),
      render: (p) => (
        <span className={p.stock === 0 ? styles.stockOut : p.stock < 5 ? styles.stockLow : styles.stockOk}>
          {p.stock}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      sortable: true,
      value: (p) => (p.is_published ? 'Publicado' : 'Borrador'),
      render: (p) => (
        <span className={`${styles.statusPill} ${styles[`pill_${p.is_published ? 'lime' : 'muted'}`]}`}>
          {p.is_published ? 'Publicado' : 'Borrador'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => dispatch(toggleProductFeatured(p.id))}
            title={p.is_featured ? 'Quitar destacado' : 'Destacar'}
            aria-label={p.is_featured ? 'Quitar destacado' : 'Destacar'}
          ><Icon name="star" size={16} /></button>
          <Link to={`/admin/products/${p.id}/edit`} className={styles.actionBtn} title="Editar" aria-label="Editar"><Icon name="pencil" size={16} /></Link>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionDelete}`}
            onClick={() => setPendingDelete(p)}
            title="Eliminar"
            aria-label="Eliminar"
          ><Icon name="x" size={16} /></button>
        </div>
      ),
    },
  ], [dispatch]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <MetaTag tone="bronze">Catálogo · {products.length} productos</MetaTag>
          <h1 className={styles.title}>Productos</h1>
        </div>
        <div className={styles.headerActions}>
          <Link to="/admin/inventory/import"><Button variant="secondary">Importar CSV</Button></Link>
          <Link to="/admin/products/new"><Button variant="primary">+ Nuevo producto</Button></Link>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <SegmentedControl
            ariaLabel="Filtrar por estado"
            data={STATUS.map((s) => ({ value: s.id, label: s.label }))}
            value={filter}
            onChange={setFilter}
          />
        </div>
        <input
          type="search"
          placeholder="Buscar por nombre, SKU u òrìsà…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
        />
      </div>

      {productsError && (
        <p role="alert" className={styles.errorBanner}>
          {productsError?.detail ?? productsError?.message ?? 'Error al cargar productos. Intenta de nuevo.'}
        </p>
      )}
      {actionError && (
        <p role="alert" className={styles.errorBanner}>
          {actionError?.detail ?? actionError?.message ?? 'La operación falló. Intenta de nuevo.'}
        </p>
      )}

      {/* H-CICLO31-01: ProductAdminSerializer devuelve `images` (array de
          objetos con image_url) y `categories` (array de objetos, UC-CAT-13
          M2M), no los campos planos. Las columnas extraen los valores reales. */}
      <div className={styles.tableWrap}>
        <DataTable
          columns={columns}
          rows={products}
          rowKey={(p) => p.id}
          loading={isLoading}
          loadingText="Cargando productos…"
          emptyText="Sin productos que coincidan"
          caption="Productos"
        />
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Eliminar producto"
        message={
          <>¿Seguro que quieres eliminar <strong>{pendingDelete?.name}</strong>? Esta acción no se puede deshacer.</>
        }
        confirmLabel="Eliminar"
        tone="danger"
        onConfirm={() => {
          dispatch(deleteProduct(pendingDelete.id));
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
