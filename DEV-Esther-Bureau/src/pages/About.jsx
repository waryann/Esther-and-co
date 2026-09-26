import { motion } from 'framer-motion'
import aboutTeam from '../assets/images/about-team.webp'
import './About.css'

export default function About() {
  return (
    <main className="about-page">
      <div className="container about__container">
        <div className="about__grid">
          <motion.div
            className="about__image-wrap"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <img
              src={aboutTeam}
              alt="EST'HAIR & CO. — Esther, Hodavie et Nana"
              className="about__image"
            />
          </motion.div>

          <motion.div
            className="about__content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="section-label">À propos de nous</p>
            <div className="divider divider-left" />
            <h1 className="about__title font-serif">
              Trois femmes, une histoire de famille, une même vision.
            </h1>
            <p className="about__text">
              Derrière EST'HAIR & CO, il y a une famille réunie autour d'une ambition : rendre le
              luxe capillaire accessible à toutes, en offrant bien plus qu'une simple prestation,
              mais une véritable expérience.
            </p>
            <p className="about__text">
              Je suis Esther, fondatrice et coiffeuse. À travers mon savoir-faire et ma passion,
              je veille à sublimer chaque cliente en lui proposant une coiffure qui correspond à
              ses envies, sa personnalité et ses attentes.
            </p>
            <p className="about__text">
              Mais EST'HAIR & CO, ce n'est pas seulement moi. C'est aussi HODAVIE, ma sœur, qui
              s'occupe de toute la partie administrative et de la gestion de nos logiciels, et
              NANA, ma maman, qui veille à la gestion financière de l'entreprise.
            </p>
            <p className="about__text">
              Chacune de nous joue un rôle essentiel dans cette aventure. Ensemble, nous
              travaillons pour que chaque cliente bénéficie d'un accompagnement soigné, d'une
              organisation efficace et d'une expérience à la hauteur de ses attentes.
            </p>
            <p className="about__text">
              Parce que derrière chaque coiffure, il y a une équipe, une famille et une attention
              portée à chaque détail.
            </p>
            <p className="about__text about__text--signature">
              Bienvenue chez EST'HAIR & CO, où le luxe capillaire devient accessible à toutes. 🤍
            </p>
          </motion.div>
        </div>
      </div>
    </main>
  )
}
