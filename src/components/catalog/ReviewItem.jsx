import styles from './ReviewItem.module.scss';

function StarRating({ value }) {
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span aria-label={`Calificacion ${value}/5`} className={styles.rating}>
      {'★'.repeat(rounded)}{'☆'.repeat(5 - rounded)}
    </span>
  );
}

export default function ReviewItem({ review: r }) {
  const date = r.created_at
    ? new Date(r.created_at).toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null;

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
    </div>
  );
}
