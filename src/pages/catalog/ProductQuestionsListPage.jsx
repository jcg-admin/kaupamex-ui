/**
 * ProductQuestionsListPage — PracticaYoruba
 * UC-QST-02: lista publica de preguntas con respuesta aprobada.
 */
import { useParams, Link } from 'react-router-dom';
import { useProductQuestions } from '@hooks/domain/useProductQuestions';
import styles from './ProductQuestionsListPage.module.scss';

export default function ProductQuestionsListPage() {
  const { productId } = useParams();
  const { data: questions = [], isLoading, isError } =
    useProductQuestions(productId);

  return (
    <section className={styles.page} aria-labelledby="questions-title">
      <header className={styles.header}>
        <h1 id="questions-title" className={styles.title}>
          Preguntas sobre el producto
        </h1>
        <Link to={`/catalog/${productId}/ask`} className={styles.primaryBtn}>
          Hacer una pregunta
        </Link>
      </header>

      {isLoading && <p>Cargando preguntas…</p>}
      {isError && (
        <p role="alert" className={styles.error}>
          No se pudieron cargar las preguntas.
        </p>
      )}

      {!isLoading && questions.length === 0 && (
        <p className={styles.empty}>
          Aun no hay preguntas respondidas para este producto. Se el primero
          en preguntar.
        </p>
      )}

      {questions.length > 0 && (
        <ul className={styles.list}>
          {questions.map((q) => (
            <li key={q.id} className={styles.item}>
              <p className={styles.question}>
                <strong>P:</strong> {q.body}
              </p>
              {q.answer && (
                <p className={styles.answer}>
                  <strong>R:</strong> {q.answer.body}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
