// Portado de ui-core-5.25.0/js/src/rating.js
// 5 estrellas clicables con hover preview; valor controlado.
// Diferente de StarRating (display solo) en ReviewItem.jsx.
import { useState } from 'react';
import styles from './RatingInput.module.scss';

const STAR = (
  <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77 5.82 21.02 7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export default function RatingInput({
  value = 0,
  onChange,
  max = 5,
  readOnly = false,
  label,
  name,
}) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  const handleClick = (star) => {
    if (!readOnly) onChange?.(star);
  };

  return (
    <div className={styles.wrapper} role="group" aria-label={label || 'Calificacion'}>
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1;
        const filled = star <= display;
        return (
          <button
            key={star}
            type="button"
            className={`${styles.star} ${filled ? styles.filled : ''}`}
            onClick={() => handleClick(star)}
            onMouseEnter={() => !readOnly && setHovered(star)}
            onMouseLeave={() => !readOnly && setHovered(0)}
            disabled={readOnly}
            aria-label={`${star} de ${max} estrellas`}
            aria-pressed={star === value}
          >
            {STAR}
          </button>
        );
      })}
      {name && (
        <input type="hidden" name={name} value={value} />
      )}
    </div>
  );
}
