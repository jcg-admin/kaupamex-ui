/**
 * PromotionsTimeline — UC-ADM-02
 *
 * Visualización tipo Gantt (nativa, sin Kendo) de promociones con rango de
 * fechas: cada promo es una barra sobre un eje temporal común, lo que permite
 * ver de un vistazo solapes, huecos y qué está activo hoy.
 *
 * Consumidor: AdminVouchersPage (vouchers) — reutilizable para descuentos de
 * producto (misma forma valid_from/valid_until).
 */
import { useMemo } from 'react';
import {
  computeRange, computeBars, nowMarkerPct, axisTicks,
} from './promotionsTimeline';
import styles from './PromotionsTimeline.module.scss';

const fmt = (ms) => new Date(ms).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });

export default function PromotionsTimeline({ promos = [], title = 'Línea de tiempo de promociones' }) {
  const now = Date.now();
  const { range, bars, ticks, marker } = useMemo(() => {
    const r = computeRange(promos, { now });
    return {
      range: r,
      bars: computeBars(promos, { ...r, now }),
      ticks: axisTicks(r),
      marker: nowMarkerPct({ ...r, now }),
    };
  }, [promos, now]);

  const visibleBars = bars.filter((b) => b.visible);
  // Sin promos con rango de fechas no hay nada que ubicar en el eje.
  if (visibleBars.length === 0) return null;

  return (
    <section className={styles.wrap} aria-label={title}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.chart}>
        {marker != null && (
          <div className={styles.today} style={{ left: `${marker}%` }} aria-hidden="true">
            <span className={styles.todayLabel}>hoy</span>
          </div>
        )}
        {visibleBars.map((b) => (
          <div key={b.id} className={styles.row}>
            <span className={styles.rowLabel} title={b.label}>{b.label}</span>
            <div className={styles.track}>
              {b.visible && (
                <div
                  className={`${styles.bar} ${b.active ? styles.barActive : ''}`}
                  style={{ left: `${b.leftPct}%`, width: `${b.widthPct}%` }}
                  title={`${b.label}${b.active ? ' — activa' : ''}`}
                >
                  <span className={styles.barText}>{b.label}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        <div className={styles.axis} aria-hidden="true">
          <span className={styles.axisSpacer} />
          <div className={styles.axisTicks}>
            {ticks.map((t) => <span key={t} className={styles.tick}>{fmt(t)}</span>)}
          </div>
        </div>
      </div>
    </section>
  );
}
