import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import './Services.css'

export default function Services() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/services/')
      .then(res => setServices(res.data))
      .catch(err => console.error('Erreur chargement prestations:', err))
      .finally(() => setLoading(false))
  }, [])

  const packs = services.filter(s => s.is_pack)
  const simpleServices = services.filter(s => !s.is_pack)

  return (
    <div className="services-page">
      <section className="services-hero">
        <div className="services-hero__content">
          <span className="services-hero__subtitle font-sans">Vente & Prestations</span>
          <h1 className="services-hero__title font-serif">Nos packs & prestations de pose</h1>
          <p className="services-hero__desc">
            Découvrez le détail de chaque prestation — inclus, durée et tarifs — avant de réserver votre créneau.
          </p>
        </div>
      </section>

      <div className="services-container">
        {loading ? (
          <div className="shop-loading">
            <div className="spinner"></div>
            <p>Chargement des prestations...</p>
          </div>
        ) : (
          <>
            {packs.length > 0 && (
              <>
                <h2 className="services-section-title font-serif">Nos packs</h2>
                <div className="services-grid-page">
                  <AnimatePresence>
                    {packs.map(service => (
                      <ServiceCard key={service.id} service={service} />
                    ))}
                  </AnimatePresence>
                </div>
              </>
            )}

            {simpleServices.length > 0 && (
              <>
                <h2 className="services-section-title font-serif">Prestations à l'unité</h2>
                <div className="services-grid-page">
                  <AnimatePresence>
                    {simpleServices.map(service => (
                      <ServiceCard key={service.id} service={service} />
                    ))}
                  </AnimatePresence>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ServiceCard({ service }) {
  const durationLabel = service.duration_minutes >= 60
    ? `${Math.floor(service.duration_minutes / 60)}h${service.duration_minutes % 60 ? service.duration_minutes % 60 : ''}`
    : `${service.duration_minutes}min`

  return (
    <motion.div
      className="service-page-card"
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4 }}
    >
      <Link to={`/services/${service.id}`} className="service-page-card__link">
        {service.is_pack && <span className="service-page-card__badge">Pack</span>}
        <h3 className="service-page-card__title font-serif">{service.name}</h3>
        {service.description && <p className="service-page-card__desc">{service.description}</p>}
        <div className="service-page-card__footer">
          <span className="service-page-card__duration">⏱ {durationLabel}</span>
          <span className="service-page-card__price">
            {service.is_pack ? `À partir de ${service.price}€` : `${service.price}€`}
          </span>
        </div>
        <span className="service-page-card__cta">Voir le détail ➔</span>
      </Link>
    </motion.div>
  )
}
