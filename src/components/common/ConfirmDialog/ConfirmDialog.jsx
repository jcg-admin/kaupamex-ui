/**
 * ConfirmDialog — Kaupamex
 *
 * Diálogo de confirmación de marca que reemplaza window.confirm en el admin
 * (H-04). Envuelve el Modal (API ui-core) con la anatomía de un diálogo de
 * confirmación estilo Kendo Dialog + DialogActionsBar: título, mensaje y una
 * barra de acciones (cancelar / confirmar).
 *
 * Adaptado de la referencia @progress/kno-react-dialogs (no runtime; patrón
 * reimplementado nativo — ver analisis-adaptar-kno-react-inputs-admin).
 *
 * Props:
 *   open        {bool}      controla visibilidad
 *   title       {string}    encabezado
 *   message     {node}      cuerpo
 *   confirmLabel{string}    texto del botón de confirmación (default "Eliminar")
 *   cancelLabel {string}    texto del botón de cancelar (default "Cancelar")
 *   tone        {'danger'|'primary'}  estilo del botón de confirmación
 *   isBusy      {bool}      deshabilita acciones mientras corre onConfirm
 *   onConfirm   {fn}        callback al confirmar
 *   onCancel    {fn}        callback al cancelar / cerrar
 */
import Modal from '@components/common/Modal/Modal';
import styles from './ConfirmDialog.module.scss';

export default function ConfirmDialog({
  open,
  title = 'Confirmar acción',
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  isBusy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      centered
      backdrop="static"
      className={styles.dialog}
    >
      <div className={styles.body} role="alertdialog" aria-labelledby="confirm-title">
        <h2 id="confirm-title" className={styles.title}>{title}</h2>
        {message && <div className={styles.message}>{message}</div>}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancel}
            onClick={onCancel}
            disabled={isBusy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={tone === 'danger' ? styles.confirmDanger : styles.confirmPrimary}
            onClick={onConfirm}
            disabled={isBusy}
            autoFocus
          >
            {isBusy ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export { ConfirmDialog };
