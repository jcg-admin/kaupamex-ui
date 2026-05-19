/**
 * AdminQuestionsAnswerPage — PracticaYoruba
 * UC-QST-03: el admin responde las preguntas aprobadas.
 */
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  answerProductQuestion,
  clearQuestionsActionState,
} from '@redux/slices/questionsSlice';
import { useAdminQuestionsPendingAnswer } from '@hooks/domain/useProductQuestions';
import styles from './AdminQuestionsAnswerPage.module.scss';

export default function AdminQuestionsAnswerPage() {
  const dispatch = useDispatch();
  const { data: questions = [], isLoading, isError } =
    useAdminQuestionsPendingAnswer();
  const { isActioning, actionError, lastAction } =
    useSelector((s) => s.questions);
  const [drafts, setDrafts] = useState({});

  const setDraft = (id, value) =>
    setDrafts((prev) => ({ ...prev, [id]: value }));

  const handleSubmit = (id) => (event) => {
    event.preventDefault();
    const body = (drafts[id] || '').trim();
    if (!body) return;
    dispatch(clearQuestionsActionState());
    dispatch(answerProductQuestion({ id, body }));
  };

  return (
    <section className={styles.page} aria-labelledby="answer-queue-title">
      <header className={styles.header}>
        <h1 id="answer-queue-title" className={styles.title}>
          Preguntas pendientes de respuesta
        </h1>
      </header>

      {isLoading && <p>Cargando cola…</p>}
      {isError && (
        <p role="alert" className={styles.error}>
          No se pudo cargar la cola.
        </p>
      )}

      {actionError && (
        <p role="alert" className={styles.error}>
          {actionError.message || 'No se pudo publicar la respuesta.'}
        </p>
      )}

      {lastAction === 'answered' && (
        <p role="status" className={styles.success}>
          Respuesta publicada.
        </p>
      )}

      {!isLoading && questions.length === 0 && (
        <p className={styles.empty}>No hay preguntas pendientes de respuesta.</p>
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
            <form onSubmit={handleSubmit(q.id)} className={styles.form}>
              <label htmlFor={`answer-${q.id}`} className={styles.label}>
                {`Respuesta para la pregunta #${q.id}`}
              </label>
              <textarea
                id={`answer-${q.id}`}
                rows={3}
                value={drafts[q.id] ?? ''}
                onChange={(e) => setDraft(q.id, e.target.value)}
              />
              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={isActioning}
              >
                {isActioning ? 'Publicando…' : 'Publicar respuesta'}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
