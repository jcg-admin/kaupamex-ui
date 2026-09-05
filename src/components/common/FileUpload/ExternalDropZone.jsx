/**
 * ExternalDropZone — Kaupamex UI
 *
 * Portado nativo del patron de kno-react-upload (ExternalDropZone.js).
 * Atribucion: patron portado de @progress/kno-react-upload.
 * Zona drag-and-drop standalone; el padre gestiona el estado de archivos.
 * Usa un counter para evitar falsos dragleave en elementos hijo.
 *
 * Props:
 *   onChange     (files: File[]) => void
 *   accept       string          hint visual (no filtra archivos del OS)
 *   multiple     bool            default true; si false, solo el primer archivo
 *   disabled     bool
 *   hint         string          texto personalizado
 *   children     React.ReactNode reemplaza el contenido por defecto
 *   className    string
 */
import { useCallback, useRef, useState } from 'react';
import styles from './ExternalDropZone.module.scss';

export default function ExternalDropZone({
  onChange,
  accept,
  multiple   = true,
  disabled   = false,
  hint,
  children,
  className  = '',
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragOver(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files || []);
    if (!files.length) return;
    onChange?.(multiple ? files : [files[0]]);
  }, [disabled, multiple, onChange]);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const defaultHint = hint
    ?? (accept ? `Arrastra archivos ${accept} aquí` : 'Arrastra archivos aquí');

  return (
    <div
      className={[
        styles.zone,
        isDragOver && styles.dragOver,
        disabled   && styles.disabled,
        className,
      ].filter(Boolean).join(' ')}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      aria-label={defaultHint}
      role="region"
    >
      {children ?? (
        <>
          <span className={styles.icon} aria-hidden="true">⬇</span>
          <span className={styles.hintText}>{defaultHint}</span>
        </>
      )}
    </div>
  );
}
