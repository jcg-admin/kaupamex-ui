/**
 * HomePage — Práctica Yorùbà
 * Hero editorial + franja de info + destacados + grid de òrìsà + manifiesto + novedades + newsletter
 *
 * Endpoints consumidos:
 *   GET /catalogue/?is_featured=true
 *   GET /catalogue/categories/?root=true
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchFeaturedProducts, fetchCategories } from '@redux/slices/catalogSlice';
import ProductCard from '@components/catalog/ProductCard';
import { MetaTag, Button } from '@components/common/primitives';
import styles from './HomePage.module.scss';

const ORISHAS = [
  { slug: 'yemaya',  name: 'Yemayá',  color: 'Azul y cristal' },
  { slug: 'shango',  name: 'Shangó',  color: 'Rojo y blanco' },
  { slug: 'oshun',   name: 'Oshún',   color: 'Amarillo y ámbar' },
  { slug: 'obatala', name: 'Obatalá', color: 'Blanco' },
  { slug: 'oya',     name: 'Oyá',     color: 'Granate y nueve' },
  { slug: 'elegua',  name: 'Eleguá',  color: 'Rojo y negro' },
];

export default function HomePage() {
  const dispatch = useDispatch();
  const { featured = [], isLoading } = useSelector((s) => s.catalog || {});

  useEffect(() => {
    dispatch(fetchFeaturedProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  return (
    <main className={styles.page}>
      {/* ─── Hero ─── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <MetaTag tone="bronze">Ifá · Òrìsà · Olódùmarè</MetaTag>
            <h1 className={styles.heroTitle}>
              Para los que <em className={styles.heroEm}>practican</em>.
            </h1>
            <p className={styles.heroLead}>
              Elekes, otanes, soperas, herramientas y materiales rituales para acompañar
              el camino del santo. Catálogo organizado por òrìsà, con envío a toda la república.
            </p>
            <div className={styles.heroCtas}>
              <Link to="/catalogo"><Button variant="primary" size="md">Entrar al catálogo</Button></Link>
              <Link to="/catalogo?cat=por-orisha"><Button variant="secondary" size="md">Por òrìsà</Button></Link>
            </div>
            <div className={styles.heroStats}>
              <Stat n="16" l="òrìsà principales" />
              <Stat n="256" l="odù del corpus de Ifá" />
              <Stat n="1,200+" l="objetos en el catálogo" />
            </div>
          </div>
          <div className={styles.heroImages}>
            <div className={`${styles.heroImg} ${styles.heroImgTall}`}>
              <div className={styles.imagePlaceholder}>Eleke ceremonial</div>
            </div>
            <div className={styles.heroImg}>
              <div className={styles.imagePlaceholder}>Otán</div>
            </div>
            <div className={styles.heroImg}>
              <div className={styles.imagePlaceholder}>Detalle</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust strip ─── */}
      <section className={styles.trust}>
        <div className={styles.trustInner}>
          <TrustItem n="01" t="Catálogo por òrìsà"  d="Cada pieza vinculada al santo al que pertenece." />
          <TrustItem n="02" t="Envío resguardado"   d="Empaque sellado · 2 a 4 días en México." />
          <TrustItem n="03" t="Para practicantes"   d="Sin esotérica de tienda. Lenguaje propio de la liturgia." />
          <TrustItem n="04" t="Devolución 30 días"  d="Devolución íntegra de piezas selladas." />
        </div>
      </section>

      {/* ─── Featured products ─── */}
      <section className={styles.featured}>
        <div className={styles.featuredInner}>
          <header className={styles.sectionHeader}>
            <div>
              <MetaTag tone="bronze">Selección destacada</MetaTag>
              <h2 className={styles.sectionTitle}>
                Piezas destacadas <em>esta semana</em>
              </h2>
            </div>
            <Link to="/catalogo" className={styles.sectionLink}>Ver todas →</Link>
          </header>
          <div className={styles.productGrid}>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : featured.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* ─── Òrìsà grid ─── */}
      <section className={styles.orishas}>
        <div className={styles.orishasInner}>
          <header className={styles.sectionHeaderWide}>
            <MetaTag tone="bronze">Catálogo por òrìsà</MetaTag>
            <h2 className={styles.sectionTitle}>
              Cada òrìsà, sus <em>colores</em> y sus objetos.
            </h2>
            <p className={styles.sectionLead}>
              Selecciona el santo. Te llevamos a sus elekes, sus herramientas, sus banderas
              y los materiales de su liturgia.
            </p>
          </header>
          <div className={styles.orishaGrid}>
            {ORISHAS.map((o) => (
              <Link
                key={o.slug}
                to={`/catalogo?orisha=${o.slug}`}
                className={styles.orishaCard}
              >
                <div className={styles.orishaImg}>
                  <div className={styles.imagePlaceholder}>{o.name}</div>
                </div>
                <div className={styles.orishaInfo}>
                  <h3 className={styles.orishaName}>{o.name}</h3>
                  <span className={styles.orishaColor}>{o.color}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Manifiesto ─── */}
      <section className={styles.manifiesto}>
        <div className={styles.manifiestoInner}>
          <div className={styles.manifiestoImg}>
            <div className={styles.imagePlaceholder}>Retrato editorial</div>
          </div>
          <div className={styles.manifiestoText}>
            <MetaTag tone="bronze">Tradición Yorùbà</MetaTag>
            <h2 className={styles.manifiestoTitle}>
              Ifá · Òrìsà · <em>Olódùmarè</em>
            </h2>
            <div className={styles.manifiestoBody}>
              <p>La religión Yorùbà proviene del pueblo Yorùbà del suroeste de Nigeria
                y el sur de Benin. Su diáspora alcanzó el Caribe y Sudamérica, particularmente
                Cuba y Brasil, y desde ahí llegó a México.</p>
              <p><strong>Ifá</strong> es el corpus de sabiduría y oráculo, con 256 odù que articulan
                la cosmología. Los <strong>òrìsà</strong> son las divinidades intermediarias,
                cada una con sus colores, números y objetos rituales. <strong>Olódùmarè</strong>
                es el Ser Supremo — fuente última del ashé.</p>
              <p>Este sitio existe para que los objetos que la práctica requiere lleguen a tus
                manos sin trabas.</p>
            </div>
            <Link to="/info/ifa" className={styles.manifiestoLink}>
              Leer más sobre la tradición →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Newsletter ─── */}
      <section className={styles.newsletter}>
        <div className={styles.newsletterInner}>
          <MetaTag tone="bronze">Calendario del santoral</MetaTag>
          <h2 className={styles.newsletterTitle}>El santoral Yorùbà, una vez al mes.</h2>
          <p className={styles.newsletterLead}>
            Calendario de festividades del santoral, llegadas nuevas al catálogo y notas
            para los practicantes. Sin promociones agresivas.
          </p>
          <form className={styles.newsletterForm} onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="tu@correo.mx"
              className={styles.newsletterInput}
              required
            />
            <Button variant="primary">Suscribirme</Button>
          </form>
          <div className={styles.newsletterFinePrint}>
            Sin compartir tu correo · cancelas cuando quieras
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ n, l }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statNum}>{n}</div>
      <div className={styles.statLabel}>{l}</div>
    </div>
  );
}
function TrustItem({ n, t, d }) {
  return (
    <div className={styles.trustItem}>
      <span className={styles.trustNum}>{n}</span>
      <div>
        <div className={styles.trustTitle}>{t}</div>
        <div className={styles.trustDesc}>{d}</div>
      </div>
    </div>
  );
}
function ProductCardSkeleton() {
  return (
    <div className={styles.skel}>
      <div className={styles.skelImg} />
      <div className={styles.skelLine} style={{ width: '60%' }} />
      <div className={styles.skelLine} style={{ width: '90%' }} />
      <div className={styles.skelLine} style={{ width: '40%' }} />
    </div>
  );
}
