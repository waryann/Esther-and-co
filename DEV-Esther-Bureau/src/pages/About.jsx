import { motion } from 'framer-motion'
import './About.css'

export default function About() {
  return (
    <main className="about-page">
      <div className="container about__container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="section-label">Notre maison</p>
          <div className="divider divider-left" />
          <h1 className="about__title font-serif">À propos de nous</h1>
          <p className="about__lead">
            EST'HAIR & CO. accompagne chaque cliente vers une pose indétectable, dans le respect
            de ses cheveux naturels et de ses envies.
          </p>
          <p className="about__text">
            Perruques et extensions 100% cheveux naturels, packs de tissage sur-mesure, poses
            réalisées par des mains expertes : chaque prestation est pensée pour durer et sublimer.
            Réservation en ligne, créneaux flexibles et suivi personnalisé, du premier rendez-vous
            jusqu'à l'entretien de votre pose.
          </p>
        </motion.div>
      </div>
    </main>
  )
}
