/**
 * FileUpload — Kaupamex UI
 *
 * Portado nativo del patron de kno-react-upload (Upload.js).
 * Atribucion: patron portado de @progress/kno-react-upload.
 * Simplificado: sin XHR propio — el padre gestiona la subida via
 * Redux thunk o callback directo (arquitectura del proyecto).
 *
 * Props:
 *   value        File[]                 archivos seleccionados (controlled)
 *   onChange     (files: File[]) => void
 *   accept       string                 atributo nativo input[accept]
 *   multiple     bool                   permitir multiples archivos
 *   maxSizeBytes number                 validacion de tamano (opcional)
 *   disabled     bool
 *   label        string                 texto del boton trigger
 *   hint         string                 texto de ayuda bajo el boton
 *   error        string                 error externo para mostrar
 *   id           string                 id del input (para asociacion label)
 */
import { useId, useRef } from 'react';
import Icon from '@components/common/Icon/Icon';
import styles from './FileUpload.module.scss';

function formatBytes(bytes) {
  if (bytes < 1024)         return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({
  value        = [],
  onChange,
  accept,
  multiple     = false,
  maxSizeBytes,
  disabled     = false,
  label        = 'Seleccionar archivo',
  hint,
  error,
  id,
}) {
  const inputRef = useRef(null);
  const autoId   = useId();
  const inputId  = id ?? autoId;

  const applyValidation = (files) => {
    if (!maxSizeBytes) return files;
    return files.filter((f) => f.size <= maxSizeBytes);
  };

  const handleChange = (e) => {
    const files = applyValidation(Array.from(e.target.files || []));
    onChange?.(files);
    e.target.value = '';
  };

  const handleRemove = (index) => {
    onChange?.(value.filter((_, i) => i !== index));
  };

  const trigger = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <div className={`${styles.root} ${disabled ? styles.disabled : ''}`}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleChange}
        className={styles.input}
        aria-hidden="true"
        tabIndex={-1}
      />

      <button
        type="button"
        className={styles.trigger}
        onClick={trigger}
        disabled={disabled}
        aria-label={label}
      >
        <span className={styles.icon} aria-hidden="true">↑</span>
        {label}
      </button>

      {hint && <p className={styles.hint}>{hint}</p>}

      {error && (
        <p role="alert" className={styles.error}>{error}</p>
      )}

      {value.length > 0 && (
        <ul className={styles.fileList} aria-label="Archivos seleccionados">
          {value.map((file, i) => (
            <li key={`${file.name}-${i}`} className={styles.fileItem}>
              <span className={styles.fileName}>{file.name}</span>
              <span className={styles.fileSize}>{formatBytes(file.size)}</span>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => handleRemove(i)}
                aria-label={`Quitar ${file.name}`}
                disabled={disabled}
              >
                <Icon name="x" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
