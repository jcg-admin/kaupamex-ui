import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { voteReviewHelpful } from '@redux/slices/reviewsSlice';
import Icon from '@components/common/Icon/Icon';
import styles from './ReviewItem.module.scss';

function StarRating({ value }) {
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span aria-label={`Calificacion ${value}/5`} className={styles.rating} role="img">
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="star"
          size={15}
          className={n <= rounded ? styles.starOn : styles.starOff}
        />
      ))}
    </span>
  );
}

export default function ReviewItem({ review: r, productId }) {
  const dispatch = useDispatch();
  const [count, setCount] = useState(r.helpful_count ?? 0);
  const [voted, setVoted] = useState(false);
  const [voting, setVoting] = useState(false);

  const date = r.created_at
    ? new Date(r.created_at).toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null;

  const handleHelpful = async () => {
    if (voted || voting) return;
    setVoting(true);
    const res = await dispatch(voteReviewHelpful({ productId, reviewId: r.id }));
    if (voteReviewHelpful.fulfilled.match(res)) {
      setCount(res.payload?.helpful_count ?? count + 1);
      setVoted(true);
    } else {
      // 400 = voto duplicado o reseña propia; en ambos casos deshabilitar sin ruido.
      const code = res.payload?.code;
      if (code === 'CANNOT_VOTE_OWN_REVIEW' || code === 'DUPLICATE_HELPFUL_VOTE') setVoted(true);
    }
    setVoting(false);
  };

  return (
    <div className={styles.item}>
      <div className={styles.itemMeta}>
        <StarRating value={r.rating} />
        {r.user_display && (
          <span className={styles.author}>{r.user_display}</span>
        )}
        {date && (
          <time className={styles.date} dateTime={r.created_at}>{date}</time>
        )}
      </div>
      {r.title && <p className={styles.itemTitle}>{r.title}</p>}
      {r.body  && <p className={styles.itemBody}>{r.body}</p>}
      {r.images?.length > 0 && (
        <ul className={styles.imageGallery} aria-label="fotos de la resena">
          {r.images.map((img) => (
            <li key={img.id}>
              <a href={img.image} target="_blank" rel="noopener noreferrer">
                <img
                  src={img.image}
                  alt="foto de resena"
                  className={styles.thumbnail}
                  loading="lazy"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </a>
            </li>
          ))}
        </ul>
      )}
      {productId && (
        <div className={styles.helpfulRow}>
          <button
            type="button"
            className={styles.helpfulBtn}
            onClick={handleHelpful}
            disabled={voted || voting}
            aria-pressed={voted}
          >
            <Icon name="thumb-up" size={15} />
            {voted ? 'Gracias' : '¿Te resultó útil?'}
          </button>
          {count > 0 && (
            <span className={styles.helpfulCount}>
              {count} {count === 1 ? 'persona' : 'personas'} lo encontró útil
            </span>
          )}
        </div>
      )}
    </div>
  );
}
