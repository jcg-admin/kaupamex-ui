/**
 * AdminCategoriesPage — UC-CAT-06
 *
 * Gestion del arbol de categorias del catalogo. CRUD admin:
 *   GET   /api/v1/admin/categories/
 *   POST  /api/v1/admin/categories/
 *   PATCH /api/v1/admin/categories/:id/
 *   POST  /api/v1/admin/categories/:id/deactivate/
 *
 * La jerarquia se persiste con parent_id. La validacion de ciclos vive
 * en el backend (BR-013). El UI muestra el formulario inline para crear
 * o editar una categoria.
 */
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import {
  useAdminCategories, ADMIN_CATEGORIES_KEY,
} from '@hooks/domain/useCategories';
import {
  createCategory, updateCategory, deactivateCategory,
  clearCategoriesActionState,
} from '@redux/slices/categoriesSlice';
import styles from './AdminCategoriesPage.module.scss';

const EMPTY_FORM = { name: '', description: '', parent_id: '', icon_url: '' };

export default function AdminCategoriesPage() {
  const dispatch    = useDispatch();
  const queryClient = useQueryClient();
  const { isActioning, actionError } = useSelector((s) => s.categories);
  const { data, isLoading, isError } = useAdminCategories();
  const categories = data?.results ?? [];

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});

  const reset = () => { setForm(EMPTY_FORM); setEditingId(null); setErrors({}); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setForm({
      name:        cat.name ?? '',
      description: cat.description ?? '',
      parent_id:   cat.parent_id ?? cat.parent?.id ?? '',
      icon_url:    cat.icon_url ?? '',
    });
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = {};
    if (!form.name.trim()) v.name = 'El nombre es obligatorio.';
    if (Object.keys(v).length) { setErrors(v); return; }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      icon_url:    form.icon_url.trim() || null,
      parent_id:   form.parent_id ? Number(form.parent_id) : null,
    };
    const action  = editingId
      ? updateCategory({ id: editingId, ...payload })
      : createCategory(payload);
    const result  = await dispatch(action);
    const ok = editingId
      ? updateCategory.fulfilled.match(result)
      : createCategory.fulfilled.match(result);
    if (ok) {
      reset();
      dispatch(clearCategoriesActionState());
      queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORIES_KEY });
    }
  };

  const handleDeactivate = async (id) => {
    const result = await dispatch(deactivateCategory(id));
    if (deactivateCategory.fulfilled.match(result)) {
      dispatch(clearCategoriesActionState());
      queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORIES_KEY });
    }
  };

  return (
    <section className={styles.page} aria-labelledby="admin-categories-title">
      <header className={styles.header}>
        <h1 id="admin-categories-title" className={styles.title}>
          Categorias
        </h1>
        <p className={styles.subtitle}>
          Gestiona el arbol de categorias del catalogo.
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <h2 className={styles.formTitle}>
          {editingId ? 'Editar categoria' : 'Nueva categoria'}
        </h2>

        <div className={styles.field}>
          <label htmlFor="cat-name">Nombre</label>
          <input
            id="cat-name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            autoComplete="off"
          />
          {errors.name && <p className={styles.fieldError}>{errors.name}</p>}
        </div>

        <div className={styles.field}>
          <label htmlFor="cat-description">Descripcion</label>
          <textarea
            id="cat-description"
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="cat-parent">Categoria padre (opcional)</label>
          <select
            id="cat-parent"
            name="parent_id"
            value={form.parent_id}
            onChange={handleChange}
          >
            <option value="">— Categoria raiz —</option>
            {categories
              .filter((c) => c.id !== editingId)
              .map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="cat-icon">URL de icono (opcional)</label>
          <input
            id="cat-icon"
            name="icon_url"
            type="url"
            value={form.icon_url}
            onChange={handleChange}
            autoComplete="off"
          />
        </div>

        {actionError && (
          <p role="alert" className={styles.apiError}>
            {actionError.message ?? 'No se pudo guardar la categoria.'}
          </p>
        )}

        <div className={styles.actions}>
          <button type="submit" disabled={isActioning}>
            {editingId ? 'Guardar cambios' : 'Crear categoria'}
          </button>
          {editingId && (
            <button type="button" onClick={reset} disabled={isActioning}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {isLoading && <p>Cargando categorias…</p>}
      {isError && <p role="alert">No se pudo cargar el listado.</p>}

      {!isLoading && categories.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th><th>Nombre</th><th>Padre</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.name}</td>
                <td>{c.parent?.name ?? '—'}</td>
                <td>{c.is_active === false ? 'Inactiva' : 'Activa'}</td>
                <td>
                  <button type="button" onClick={() => handleEdit(c)}>
                    Editar
                  </button>
                  {c.is_active !== false && (
                    <button
                      type="button"
                      onClick={() => handleDeactivate(c.id)}
                      disabled={isActioning}
                    >
                      Desactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
