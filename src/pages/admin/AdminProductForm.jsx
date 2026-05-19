/**
 * AdminProductForm — PracticaYoruba
 *
 * Formulario compartido entre UC-CAT-09 (Crear) y UC-CAT-10 (Editar)
 * para productos del catalogo Yoruba. Los nombres pueden contener
 * caracteres con tildes y diacriticos del idioma Yoruba.
 *
 * Props:
 *   initialValues {object}  campos pre-cargados (caso editar)
 *   mode {'create'|'edit'}  controla el texto de los botones
 *   onSubmit  (payload, imageFile?) => Promise
 *   isSubmitting  bool      controla disabled del boton
 *   actionError   string?   mensaje de error de servidor
 *   submitLabel   string?   texto custom del boton primario
 */
import { useState } from 'react';
import { useAdminCategories } from '@hooks/domain/useCategories';
import styles from './AdminProductForm.module.scss';

const DEFAULTS = {
  name: '',
  short_description: '',
  description: '',
  sku: '',
  base_price: '',
  stock: '',
  category_id: '',
  status: 'BORRADOR',
};

export default function AdminProductForm({
  initialValues = {},
  mode = 'create',
  onSubmit,
  isSubmitting = false,
  actionError = null,
  submitLabel,
}) {
  const [fields, setFields] = useState({ ...DEFAULTS, ...initialValues });
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors] = useState({});

  const { data: categoriesData } = useAdminCategories();
  const categories = categoriesData?.results ?? [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
  };

  const validate = () => {
    const e = {};
    if (!fields.name.trim()) e.name = 'El nombre es obligatorio.';
    else if (fields.name.trim().length < 3) e.name = 'El nombre debe tener al menos 3 caracteres.';
    if (!fields.short_description.trim()) e.short_description = 'La descripcion corta es obligatoria.';
    if (!fields.description.trim()) e.description = 'La descripcion completa es obligatoria.';
    if (fields.base_price === '' || Number(fields.base_price) < 0)
      e.base_price = 'El precio es obligatorio y debe ser positivo.';
    if (fields.stock === '' || Number(fields.stock) < 0)
      e.stock = 'El stock es obligatorio y debe ser positivo.';
    if (!fields.category_id) e.category_id = 'La categoria es obligatoria.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }

    const payload = {
      name: fields.name.trim(),
      short_description: fields.short_description.trim(),
      description: fields.description.trim(),
      base_price: Number(fields.base_price),
      stock: Number(fields.stock),
      category_id: Number(fields.category_id),
      status: fields.status,
    };
    if (fields.sku.trim()) payload.sku = fields.sku.trim();

    await onSubmit?.(payload, imageFile);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label htmlFor="product-name" className={styles.label}>Nombre</label>
        <input
          id="product-name"
          name="name"
          type="text"
          value={fields.name}
          onChange={handleChange}
          className={styles.input}
          autoComplete="off"
        />
        {errors.name && <p className={styles.fieldError}>{errors.name}</p>}
      </div>

      <div className={styles.field}>
        <label htmlFor="product-sku" className={styles.label}>SKU (opcional)</label>
        <input
          id="product-sku"
          name="sku"
          type="text"
          value={fields.sku}
          onChange={handleChange}
          className={styles.input}
          autoComplete="off"
          placeholder="Se genera automaticamente si se omite"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="product-short-desc" className={styles.label}>Descripcion corta</label>
        <input
          id="product-short-desc"
          name="short_description"
          type="text"
          maxLength={500}
          value={fields.short_description}
          onChange={handleChange}
          className={styles.input}
        />
        {errors.short_description && <p className={styles.fieldError}>{errors.short_description}</p>}
      </div>

      <div className={styles.field}>
        <label htmlFor="product-desc" className={styles.label}>Descripcion completa</label>
        <textarea
          id="product-desc"
          name="description"
          rows={6}
          value={fields.description}
          onChange={handleChange}
          className={styles.textarea}
        />
        {errors.description && <p className={styles.fieldError}>{errors.description}</p>}
      </div>

      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="product-price" className={styles.label}>Precio sin IVA</label>
          <input
            id="product-price"
            name="base_price"
            type="number"
            step="0.01"
            min="0"
            value={fields.base_price}
            onChange={handleChange}
            className={styles.input}
          />
          {errors.base_price && <p className={styles.fieldError}>{errors.base_price}</p>}
        </div>

        <div className={styles.field}>
          <label htmlFor="product-stock" className={styles.label}>Stock inicial</label>
          <input
            id="product-stock"
            name="stock"
            type="number"
            min="0"
            value={fields.stock}
            onChange={handleChange}
            className={styles.input}
          />
          {errors.stock && <p className={styles.fieldError}>{errors.stock}</p>}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="product-category" className={styles.label}>Categoria</label>
        <select
          id="product-category"
          name="category_id"
          value={fields.category_id}
          onChange={handleChange}
          className={styles.select}
        >
          <option value="">— Selecciona una categoria —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {errors.category_id && <p className={styles.fieldError}>{errors.category_id}</p>}
      </div>

      <div className={styles.field}>
        <label htmlFor="product-image" className={styles.label}>Imagen principal</label>
        <input
          id="product-image"
          name="image"
          type="file"
          accept="image/*"
          onChange={handleFile}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="product-status" className={styles.label}>Estado</label>
        <select
          id="product-status"
          name="status"
          value={fields.status}
          onChange={handleChange}
          className={styles.select}
        >
          <option value="BORRADOR">Borrador</option>
          <option value="PUBLICADO">Publicado</option>
        </select>
      </div>

      {actionError && (
        <p role="alert" className={styles.apiError}>
          {actionError}
        </p>
      )}

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.btnPrimary}
          disabled={isSubmitting}
        >
          {submitLabel ?? (mode === 'edit' ? 'Guardar cambios' : 'Crear producto')}
        </button>
      </div>
    </form>
  );
}
