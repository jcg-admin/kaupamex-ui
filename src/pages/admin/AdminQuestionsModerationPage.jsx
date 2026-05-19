/**
 * AdminQuestionsModerationPage — PracticaYoruba
 * UC-QST-04: aprobar / rechazar preguntas pendientes de moderacion.
 */
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  approveProductQuestion,
  rejectProductQuestion,
  clearQuestionsActionState,
} from '@redux/slices/questionsSlice';
import { useAdminQuestionsModeration } from '@hooks/domain/useProductQuestions';
import styles from './AdminQuestionsModerationPage.module.scss';

const REJECT_REASONS = [
  { value: 'INAPROPIADA',    label: 'Contenido inapropiado' },
  { value: 'SPAM',           label: 'Spam' },
  { value: 'IDIOMA_NO_SOPORTADO', label: 'Idioma no soportado' },
  { value: 'DUPLICADA',      label: 'Pregunta duplicada' },
];

export default function AdminQuestionsModerationPage() {
  const dispatch = useDispatch();
  const { data: questions = [], isLoading, isError } =
    useAdminQuestionsModeration();
  const { isActioning, actionError, lastAction } =
    useSelector((s) => s.questions);
  const [reasons, setReasons] = useState({});

  const setReason = (id, value) =>
    setReasons((prev) => ({ ...prev, [id]: value }));

  const handleApprove = (id) => {
    dispatch(clearQuestionsActionState());
    dispatch(approveProductQuestion({ id }));
  };

  const handleReject = (id) => {
    const reason = reasons[id] || 'INAPROPIADA';
    dispatch(clearQuestionsActionState());
    dispatch(rejectProductQuestion({ id, reason }));
  };

  return (
    <section className={styles.page} aria-labelledby="moderation-title">
      <header className={styles.header}>
        <h1 id="moderation-title" className={styles.title}>
          Moderacion de preguntas
        </h1>
      </header>

      {isLoading && <p>Cargando cola…</p>}
      {isError && (
        <p role="alert" className={styles.error}>
          No se pudo cargar la cola de moderacion.
        </p>
      )}

      {actionError && (
        <p role="alert" className={styles.error}>
          {actionError.message || 'No se pudo aplicar la moderacion.'}
        </p>
      )}

      {lastAction === 'approved' && (
        <p role="status" className={styles.success}>Pregunta aprobada.</p>
      )}
      {lastAction === 'rejected' && (
        <p role="status" className={styles.success}>Pregunta rechazada.</p>
      )}

      {!isLoading && questions.length === 0 && (
        <p className={styles.empty}>No hay preguntas pendientes de moderacion.</p>
      )}

      <ul className={styles.list}>
        {questions.map((q) => (
          <li key={q.id} className={styles.item}>
            <p className={styles.meta}>
              <strong>#{q.id}</strong>
              {q.product?.name && (
                <> · sobre <em>{q.product.name}</em></>
              )}
            </p>
            <p className={styles.question}>{q.body}</p>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => handleApprove(q.id)}
                disabled={isActioning}
              >
                Aprobar
              </button>

              <label className={styles.reasonField}>
                <span>Motivo</span>
                <select
                  value={reasons[q.id] || 'INAPROPIADA'}
                  onChange={(e) => setReason(q.id, e.target.value)}
                >
                  {REJECT_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                className={styles.dangerBtn}
                onClick={() => handleReject(q.id)}
                disabled={isActioning}
              >
                Rechazar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
