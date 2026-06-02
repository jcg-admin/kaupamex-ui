/**
 * AccountPage — Práctica Yorùbà
 * Dashboard de cuenta: avatar, completitud de perfil, accesos rápidos,
 * últimos pedidos.
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProfile } from '@redux/slices/authSlice';
import { fetchOrders } from '@redux/slices/ordersSlice';
import AccountSidebar from '@components/account/AccountSidebar';
import { MetaTag, Button, Price } from '@components/common/primitives';
import styles from './AccountPage.module.scss';

export default function AccountPage() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth?.user);
  const orders = useSelector((s) => s.orders?.list || []);

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchOrders({ limit: 3 }));
  }, [dispatch]);

  if (!user) return null;
  const completeness = user.profile_completeness ?? 0;
  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.hero}>
          <div className={styles.avatar}>
            {user.avatar_url ? <img src={user.avatar_url} alt="" /> : initials}
          </div>
          <div className={styles.heroText}>
            <MetaTag tone="bronze">
              Cuenta creada en {new Date(user.date_joined).getFullYear()}
            </MetaTag>
            <h1 className={styles.heroTitle}>
              Hola, {user.first_name}
            </h1>
            <div className={styles.heroMeta}>
              {user.email} · {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
            </div>
          </div>
        </header>

        <div className={styles.layout}>
          <AccountSidebar />

          <section>
            {completeness < 100 && (
              <div className={styles.completeness}>
                <div>
                  <MetaTag tone="bronze">Completa tu perfil</MetaTag>
                  <h3 className={styles.completenessTitle}>
                    Tu perfil está al {completeness}%
                    {user.pending_fields?.length > 0 && ` · falta ${user.pending_fields[0]}`}
                  </h3>
                  <div className={styles.completenessBar}>
                    <div style={{ width: `${completeness}%` }} />
                  </div>
                  <div className={styles.completenessDesc}>
                    {user.pending_fields?.length > 0
                      ? `Solo te falta agregar ${user.pending_fields.join(', ')} para completar.`
                      : 'Casi terminas.'}
                  </div>
                </div>
                <Link to="/account/profile">
                  <Button variant="primary">Completar perfil</Button>
                </Link>
              </div>
            )}

            <section className={styles.recentOrders}>
              <header className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Pedidos recientes</h2>
                <Link to="/account/orders" className={styles.sectionLink}>
                  Ver todos →
                </Link>
              </header>

              {orders.length === 0 ? (
                <div className={styles.empty}>
                  <p>Aún no tienes pedidos.</p>
                  <Link to="/catalog">
                    <Button variant="secondary">Ir al catálogo</Button>
                  </Link>
                </div>
              ) : (
                <div className={styles.orderList}>
                  {orders.slice(0, 3).map((o) => (
                    <article key={o.order_number} className={styles.orderCard}>
                      <div>
                        <div className={styles.orderMeta}>
                          {new Date(o.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                        </div>
                        <div className={styles.orderNumber}>{o.order_number}</div>
                      </div>
                      <div className={styles.orderStatus}>
                        <span className={styles.statusDot} />
                        {o.status_label || o.status}
                      </div>
                      <Price amount={o.total} size="md" />
                      <Link to={`/account/orders/${o.order_number}`}>
                        <Button variant="secondary" size="sm">Detalle</Button>
                      </Link>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <div className={styles.quickGrid}>
              <QuickCard to="/account/wishlist"   t="Lista de deseos"   d="Tus piezas guardadas" />
              <QuickCard to="/account/addresses" t="Mis direcciones"   d="Hasta 5 ubicaciones" />
              <QuickCard to="/account/security"   t="Seguridad"          d="Contraseña y sesiones" />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function QuickCard({ to, t, d }) {
  return (
    <Link to={to} className={styles.quickCard}>
      <h4>{t}</h4>
      <p>{d}</p>
      <span className={styles.quickArrow}>→</span>
    </Link>
  );
}
