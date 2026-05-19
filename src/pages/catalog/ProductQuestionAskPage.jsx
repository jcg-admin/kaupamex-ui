/**
 * ProductQuestionAskPage — PracticaYoruba
 * UC-QST-01: el visitante hace una pregunta sobre un producto.
 */
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  askProductQuestion,
  clearQuestionsActionState,
} from '@redux/slices/questionsSlice';
import styles from './ProductQuestionAskPage.module.scss';

export default function ProductQuestionAskPage() {
  const { productId } = useParams();
  const dispatch = useDispatch();
  const { isActioning, actionError, lastAction } =
    useSelector((s) => s.questions);
  const [body, setBody]   = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (body.trim().length < 10) {
      setError('La pregunta es obligatoria y debe tener al menos 10 caracteres.');
      return;
    }
    setError('');
    dispatch(clearQuestionsActionState());
    dispatch(askProductQuestion({
      productId,
      body:  body.trim(),
      email: email.trim() || null,
    }));
  };

  if (lastAction === 'asked') {
    return (
      <section className={styles.page} aria-labelledby="ask-success-title">
        <h1 id="ask-success-title" className={styles.title}>Pregunta recibida</h1>
        <p className={styles.successMessage}>
          Gracias por tu pregunta. Si nos dejaste tu email, te avisaremos
          cuando el equipo la responda.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.page} aria-labelledby="ask-title">
      <header className={styles.header}>
        <h1 id="ask-title" className={styles.title}>Hacer pregunta sobre el producto</h1>
        <p className={styles.description}>
          Te respondera el equipo. Si dejas tu email te avisamos en cuanto
          haya respuesta.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="question-body">Tu pregunta</label>
          <textarea
            id="question-body"
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            aria-invalid={Boolean(error)}
          />
          {error && <span className={styles.fieldError}>{error}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="question-email">Email (opcional)</label>
          <input
            id="question-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="te avisamos cuando haya respuesta"
          />
        </div>

        {actionError && (
          <p role="alert" className={styles.error}>
            {actionError.message || 'No se pudo enviar la pregunta.'}
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={isActioning}
          >
            {isActioning ? 'Enviando…' : 'Enviar pregunta'}
          </button>
        </div>
      </form>
    </section>
  );
}
