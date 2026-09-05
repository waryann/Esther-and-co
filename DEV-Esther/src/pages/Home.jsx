import { useRef, useEffect } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import './Home.css'
import HeroScene from '../components/animations/HeroScene'
import modelBag from '../assets/images/model-bag.jpg'
import modelBox from '../assets/images/model-box.jpg'
import gifVideo from '../assets/videos/Gif.mp4'

/* ---- Animation variants ---- */
const fadeUp = {
  hidden: { opacity: 0, y: 60 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 1, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] },
  }),
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { duration: 1.2, delay: i * 0.1, ease: 'easeOut' },
  }),
}

/* ---- Scroll-reveal wrapper ---- */
function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      className={className}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      custom={delay}
    >
      {children}
    </motion.div>
  )
}

/* ---- Product card with 3D tilt ---- */
function ProductCard({ name, category, price, tag, index }) {
  const ref = useRef(null)

  const handleMouseMove = (e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -20
    el.style.transform = `perspective(800px) rotateX(${y}deg) rotateY(${x}deg) scale(1.02)`
  }

  const handleMouseLeave = () => {
    if (ref.current) ref.current.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)'
  }

  return (
    <motion.div
      className="product-card"
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      custom={index * 0.15}
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {tag && <span className="product-card__tag">{tag}</span>}
      <div className="product-card__image">
        <div className="product-card__image-placeholder" />
      </div>
      <div className="product-card__info">
        <p className="product-card__category">{category}</p>
        <h3 className="product-card__name">{name}</h3>
        <p className="product-card__price">À partir de {price}€</p>
      </div>
      <motion.button
        className="product-card__cta"
        whileHover={{ x: 6 }}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        Découvrir →
      </motion.button>
    </motion.div>
  )
}

/* ---- Main Home page ---- */
export default function Home() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  const vidRef1 = useRef(null)
  const vidRef2 = useRef(null)

  useEffect(() => {
    [vidRef1, vidRef2].forEach(ref => {
      if (ref.current) {
        ref.current.defaultMuted = true;
        ref.current.muted = true;
        ref.current.play().catch(() => {});
      }
    });
  }, []);

  const products = [
    { name: 'Lace Front Straight', category: 'Perruque lace front', price: '180', tag: 'Bestseller' },
    { name: '360 Body Wave', category: 'Perruque 360 lace', price: '250', tag: null },
    { name: 'Full Lace Curly', category: 'Perruque full lace', price: '320', tag: 'Nouveau' },
    { name: 'Ombre Blonde Wave', category: 'Perruque lace front', price: '210', tag: null },
  ]

  return (
    <main className="home">

      {/* ======== HERO ======== */}
      <section className="hero" ref={heroRef}>
        {/* Starfield 3D */}
        <div className="hero__canvas">
          <HeroScene />
        </div>

        {/* Noise texture overlay */}
        <div className="hero__noise" />

        {/* Content */}
        <motion.div className="hero__content" style={{ y: heroY, opacity: heroOpacity }}>
          <motion.p
            className="section-label hero__label"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            Your favorite wig supplier
          </motion.p>

          <motion.h1
            className="hero__title font-serif"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            EST'HAIR
            <span className="hero__title-accent">&</span>
            CO.
          </motion.h1>

          <motion.p
            className="hero__subtitle"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            Perruques de luxe & prestations sur-mesure
          </motion.p>

          <motion.div
            className="hero__actions"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <motion.a
              href="/shop"
              className="btn btn-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Explorer la collection
            </motion.a>
            <motion.a
              href="/booking"
              className="btn btn-outline"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Réserver une pose
            </motion.a>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="hero__scroll"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <motion.div
            className="hero__scroll-line"
            animate={{ scaleY: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span>Scroll</span>
        </motion.div>

        {/* Gradient fade to next section */}
        <div className="hero__gradient" />
      </section>

      {/* ======== EDITORIAL GALLERY ======== */}
      <section className="editorial">

        {/* Ligne 1 — Photo plein écran avec texte superposé */}
        <motion.div
          className="editorial__fullscreen"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4 }}
        >
          <video ref={vidRef1} src={gifVideo} autoPlay loop muted playsInline controls={false} className="editorial__fullscreen-img" />
          <div className="editorial__fullscreen-overlay">
            <motion.div
              className="editorial__fullscreen-content"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              <p className="section-label">Editorial 2025</p>
              <div className="divider" style={{ margin: '1rem auto' }} />
              <h2 className="editorial__fullscreen-title font-serif">
                La beauté<br /><em>en mouvement.</em>
              </h2>
            </motion.div>
          </div>
        </motion.div>

        {/* Ligne 2 — Duo : grandes photos + texte */}
        <div className="editorial__duo container">
          {/* Colonne photos */}
          <motion.div
            className="editorial__duo-images"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="editorial__img-wrap editorial__img-wrap--tall">
              <img src={modelBox} alt="EST'HAIR & CO. — Modèle avec box" className="editorial__img" />
              <span className="editorial__img-badge">Collection 2025</span>
            </div>
            <div className="editorial__img-wrap editorial__img-wrap--offset">
              <img src={modelBag} alt="EST'HAIR & CO. — Shopping bag" className="editorial__img" />
            </div>
          </motion.div>

          {/* Colonne texte */}
          <motion.div
            className="editorial__duo-text"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="section-label">Notre univers</p>
            <div className="divider divider-left" />
            <h2 className="editorial__duo-title font-serif">
              Un luxe<br />accessible.
            </h2>
            <p className="editorial__duo-desc">
              Chaque perruque EST'HAIR & CO. est le fruit d'une sélection rigoureuse.
              Des cheveux 100% naturels, des bonnets sur-mesure et une finition irréprochable —
              le tout livré dans un packaging exclusif, à l'image de notre exigence.
            </p>
            <div className="editorial__stats">
              <div className="editorial__stat">
                <span className="editorial__stat-num font-serif">100%</span>
                <span className="editorial__stat-label">Cheveux naturels</span>
              </div>
              <div className="editorial__stat">
                <span className="editorial__stat-num font-serif">+50</span>
                <span className="editorial__stat-label">Références</span>
              </div>
              <div className="editorial__stat">
                <span className="editorial__stat-num font-serif">★ 5</span>
                <span className="editorial__stat-label">Avis clients</span>
              </div>
            </div>
            <motion.a
              href="/shop"
              className="btn btn-outline"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Découvrir la collection
            </motion.a>
          </motion.div>
        </div>

        {/* Ligne 3 — Bande horizontale : image + citation */}
        <div className="editorial__banner">
          <motion.div
            className="editorial__banner-img-wrap"
            initial={{ scale: 1.1, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <video ref={vidRef2} src={gifVideo} autoPlay loop muted playsInline controls={false} className="editorial__banner-img" />
            <div className="editorial__banner-overlay" />
          </motion.div>
          <motion.div
            className="editorial__banner-text"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <span className="editorial__banner-num font-serif">01</span>
            <blockquote className="editorial__banner-quote font-serif">
              "Quand tu portes<br />une perruque EST'HAIR,<br />tu portes la confiance."
            </blockquote>
            <p className="editorial__banner-author">— La Marque</p>
          </motion.div>
        </div>
      </section>

      {/* ======== INTRO STRIP ======== */}

      <section className="intro-strip">
        <div className="container">
          <div className="intro-strip__grid">
            {[
              { icon: '✦', label: 'Qualité Premium', desc: 'Cheveux 100% naturels, densités multiples' },
              { icon: '◈', label: 'Sur-Mesure', desc: 'Ajustement parfait à vos mensurations' },
              { icon: '◇', label: 'Pose Experte', desc: 'Créneaux flexibles, acompte sécurisé' },
            ].map((item, i) => (
              <Reveal key={item.label} delay={i * 0.1}>
                <div className="intro-card">
                  <span className="intro-card__icon">{item.icon}</span>
                  <h3 className="intro-card__label">{item.label}</h3>
                  <p className="intro-card__desc">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ======== COLLECTION ======== */}
      <section className="collection">
        <div className="container">
          <Reveal>
            <p className="section-label">Notre sélection</p>
            <div className="divider divider-left" />
            <h2 className="collection__title font-serif">
              La Collection
            </h2>
          </Reveal>

          <div className="collection__grid">
            {products.map((p, i) => (
              <ProductCard key={p.name} {...p} index={i} />
            ))}
          </div>

          <Reveal delay={0.3}>
            <div className="collection__cta">
              <motion.a
                href="/shop"
                className="btn btn-outline"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Voir toute la collection
              </motion.a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ======== BOOKING BANNER ======== */}
      <section className="booking-banner">
        <div className="booking-banner__inner">
          <Reveal>
            <p className="section-label">Prestations</p>
            <div className="divider" />
            <h2 className="booking-banner__title font-serif">
              Une pose,<br />une expérience.
            </h2>
            <p className="booking-banner__desc">
              Réservez votre créneau en ligne. Un acompte est requis pour confirmer
              votre rendez-vous. Nos coiffeurs experts s'adaptent à vos envies.
            </p>
            <motion.a
              href="/booking"
              className="btn btn-gold"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Prendre rendez-vous
            </motion.a>
          </Reveal>
        </div>
      </section>

      {/* ======== BRAND STATEMENT ======== */}
      <section className="statement">
        <div className="container">
          <Reveal>
            <blockquote className="statement__quote font-serif">
              "Chaque perruque est une œuvre.<br />
              Chaque pose, une transformation."
            </blockquote>
            <p className="statement__author">— EST'HAIR & CO.</p>
          </Reveal>
        </div>
      </section>

      {/* ======== CROSS-SELLING ======== */}
      <section className="care">
        <div className="container">
          <Reveal>
            <p className="section-label">Entretien</p>
            <div className="divider divider-left" />
            <h2 className="care__title font-serif">
              Prenez soin de vos perruques
            </h2>
          </Reveal>
          <div className="care__grid">
            {[
              { name: 'Shampoing hydratant', price: '24' },
              { name: 'Spray démêlant', price: '19' },
              { name: 'Masque nutritif', price: '32' },
            ].map((item, i) => (
              <Reveal key={item.name} delay={i * 0.1}>
                <div className="care-card">
                  <div className="care-card__image" />
                  <p className="care-card__name">{item.name}</p>
                  <p className="care-card__price">{item.price}€</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ======== FOOTER ======== */}
      <footer className="footer">
        <div className="container">
          <div className="footer__top">
            <div className="footer__brand">
              <p className="footer__logo font-serif">EST'HAIR & CO.</p>
              <p className="footer__tagline">Your favorite wig supplier</p>
            </div>
            <div className="footer__links-group">
              <p className="footer__group-title">Navigation</p>
              <ul>
                <li><a href="/shop">Collection</a></li>
                <li><a href="/booking">Réservation</a></li>
                <li><a href="/about">À Propos</a></li>
                <li><a href="/contact">Contact</a></li>
              </ul>
            </div>
            <div className="footer__links-group">
              <p className="footer__group-title">Mon compte</p>
              <ul>
                <li><a href="/account">Mes commandes</a></li>
                <li><a href="/account">Mes rendez-vous</a></li>
                <li><a href="/login">Connexion</a></li>
              </ul>
            </div>
            <div className="footer__links-group">
              <p className="footer__group-title">Légal</p>
              <ul>
                <li><a href="#">Mentions légales</a></li>
                <li><a href="#">CGV</a></li>
                <li><a href="#">Politique de confidentialité</a></li>
              </ul>
            </div>
          </div>
          <div className="footer__bottom">
            <p>© 2025 EST'HAIR & CO. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
