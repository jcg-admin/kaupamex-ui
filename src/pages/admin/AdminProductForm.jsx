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
import { useState, useRef } from 'react';
import { useAdminCategories } from '@hooks/domain/useCategories';
import { FileUpload } from '@components/common';
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

// Orden de los campos requeridos para enfocar el primero inválido al enviar.
const REQUIRED_ORDER = ['name', 'short_description', 'description', 'base_price', 'stock', 'category_id'];

// H-06: marca visible de campo obligatorio. aria-hidden porque el estado
// requerido se comunica al lector de pantalla vía aria-required en el control.
function RequiredMark() {
  return <span className={styles.required} aria-hidden="true"> *</span>;
}

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
  const controlRefs = useRef({});

  const { data: categoriesData } = useAdminCategories();
  const categories = categoriesData?.results ?? [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  // H-06: props compartidas de accesibilidad/estado por campo. Aplica la clase
  // de error al control inválido (marca visual del campo, no solo el mensaje),
  // enlaza aria-invalid + aria-describedby al mensaje, y marca aria-required.
  const controlProps = (name, id, { required = false, base = styles.input } = {}) => ({
    id,
    name,
    ref: (el) => { controlRefs.current[name] = el; },
    value: fields[name],
    onChange: handleChange,
    className: errors[name] ? `${base} ${styles.inputError}` : base,
    'aria-required': required || undefined,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${id}-error` : undefined,
  });

  const fieldError = (name, id) =>
    errors[name] ? <p id={`${id}-error`} className={styles.fieldError}>{errors[name]}</p> : null;

  const handleFile = (files) => {
    setImageFile(files[0] ?? null);
  };

  const validate = () => {
    const e = {};
    if (!fields.name.trim()) e.name = 'El nombre es obligatorio.';
    else if (fields.name.trim().length < 3) e.name = 'El nombre debe tener al menos 3 caracteres.';
    if (!fields.short_description.trim()) e.short_description = 'La descripcion corta es obligatoria.';
    if (!fields.description.trim()) e.description = 'La descripcion completa es obligatoria.';
    if (fields.base_price === '' || Number(fields.base_price) <= 0)
      e.base_price = 'El precio es obligatorio y debe ser mayor que cero.';
    if (fields.stock === '' || Number(fields.stock) < 0)
      e.stock = 'El stock es obligatorio y debe ser positivo.';
    if (!fields.category_id) e.category_id = 'La categoria es obligatoria.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      // H-06: enfocar el primer campo inválido para que el usuario vea de
      // inmediato QUÉ campo falta, en vez de un mensaje genérico sin ubicación.
      const firstInvalid = REQUIRED_ORDER.find((k) => v[k]);
      controlRefs.current[firstInvalid]?.focus?.();
      return;
    }

    const payload = {
      name: fields.name.trim(),
      short_description: fields.short_description.trim(),
      description: fields.description.trim(),
      base_price: Number(fields.base_price),
      stock: Number(fields.stock),
      category_ids: [Number(fields.category_id)],
      status: fields.status,
    };
    if (fields.sku.trim()) payload.sku = fields.sku.trim();

    await onSubmit?.(payload, imageFile);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label htmlFor="product-name" className={styles.label}>Nombre<RequiredMark /></label>
        <input
          {...controlProps('name', 'product-name', { required: true })}
          type="text"
          autoComplete="off"
        />
        {fieldError('name', 'product-name')}
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
        <label htmlFor="product-short-desc" className={styles.label}>Descripción corta<RequiredMark /></label>
        <input
          {...controlProps('short_description', 'product-short-desc', { required: true })}
          type="text"
          maxLength={500}
        />
        {fieldError('short_description', 'product-short-desc')}
      </div>

      <div className={styles.field}>
        <label htmlFor="product-desc" className={styles.label}>Descripción completa<RequiredMark /></label>
        <textarea
          {...controlProps('description', 'product-desc', { required: true, base: styles.textarea })}
          rows={6}
        />
        {fieldError('description', 'product-desc')}
      </div>

      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="product-price" className={styles.label}>Precio sin IVA<RequiredMark /></label>
          <input
            {...controlProps('base_price', 'product-price', { required: true })}
            type="number"
            step="0.01"
            min="0"
          />
          {fieldError('base_price', 'product-price')}
        </div>

        <div className={styles.field}>
          <label htmlFor="product-stock" className={styles.label}>Stock inicial<RequiredMark /></label>
          <input
            {...controlProps('stock', 'product-stock', { required: true })}
            type="number"
            min="0"
          />
          {fieldError('stock', 'product-stock')}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="product-category" className={styles.label}>Categoría<RequiredMark /></label>
        <select
          {...controlProps('category_id', 'product-category', { required: true, base: styles.select })}
        >
          <option value="">— Selecciona una categoria —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {fieldError('category_id', 'product-category')}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Imagen principal</label>
        <FileUpload
          accept="image/*"
          value={imageFile ? [imageFile] : []}
          onChange={handleFile}
          label="Seleccionar imagen"
          hint="JPG, PNG o WebP."
          maxSizeBytes={10 * 1024 * 1024}
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
