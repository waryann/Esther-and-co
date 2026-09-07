import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import './ServiceDetail.css'

export default function ServiceDetail() {
  const { id } = useParams()
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    axios.get(`/api/services/${id}`)
      .then(res => setService(res.data))
      .catch(err => console.error('Erreur chargement prestation:', err))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="service-detail-loading shop-loading">
        <div className="spinner"></div>
        <p>Chargement de la prestation...</p>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="service-detail-error font-serif">
        <h2>Prestation introuvable</h2>
        <Link to="/services" className="btn btn-gold">Retour aux prestations</Link>
      </div>
    )
  }

  const durationLabel = service.duration_minutes >= 60
    ? `${Math.floor(service.duration_minutes / 60)}h${service.duration_minutes % 60 ? service.duration_minutes % 60 : ''}`
    : `${service.duration_minutes}min`

  const depositLabel = service.deposit_is_percent
    ? `${service.deposit_value}% du prix total`
    : `${service.deposit_value}€`

  return (
    <div className="service-detail-page">
      <div className="service-detail-container">
        <Link to="/services" className="back-to-shop">➔ Retour aux prestations</Link>

        <motion.div
          className="service-detail-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {service.is_pack && <span className="service-detail-badge">Pack</span>}
          <h1 className="service-detail-title font-serif">{service.name}</h1>
          <p className="service-detail-price font-sans">
            {service.is_pack ? `À partir de ${service.price}€` : `${service.price}€`}
          </p>

          {service.description && (
            <div className="service-detail-block">
              <h3 className="section-subtitle font-serif">Description</h3>
              <p>{service.description}</p>
            </div>
          )}

          <div className="service-detail-meta">
            <div className="service-detail-meta__item">
              <span className="service-detail-meta__label">Durée</span>
              <span className="service-detail-meta__value">⏱ {durationLabel}</span>
            </div>
            <div className="service-detail-meta__item">
              <span className="service-detail-meta__label">Acompte à la réservation</span>
              <span className="service-detail-meta__value">{depositLabel}</span>
            </div>
            {service.requires_wig_deposit && (
              <div className="service-detail-meta__item">
                <span className="service-detail-meta__label">Perruque</span>
                <span className="service-detail-meta__value">À déposer 48h avant</span>
              </div>
            )}
          </div>

          {service.includes?.length > 0 && (
            <div className="service-detail-block">
              <h3 className="section-subtitle font-serif">Ce qui est inclus</h3>
              <ul className="service-detail-includes">
                {service.includes.map((line, i) => <li key={i}>{line}</li>)}
              </ul>
            </div>
          )}

          {service.variants?.length > 0 && (
            <div className="service-detail-block">
              <h3 className="section-subtitle font-serif">Déclinaisons disponibles</h3>
              <div className="service-detail-variants">
                {service.variants.map(v => (
                  <div key={v.id} className="service-detail-variant-row">
                    <span>{v.label}</span>
                    <span className="service-detail-variant-price">{v.price > 0 ? `${v.price}€` : 'Prix à confirmer'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {service.options?.length > 0 && (
            <div className="service-detail-block">
              <h3 className="section-subtitle font-serif">Options disponibles</h3>
              <div className="service-detail-variants">
                {service.options.map(o => (
                  <div key={o.id} className="service-detail-variant-row">
                    <span>{o.name}{o.allows_photo ? ' (photo d\'inspiration possible)' : ''}</span>
                    <span className="service-detail-variant-price">+{o.price}€</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {service.conditions && (
            <div className="service-detail-conditions">
              ℹ️ {service.conditions}
            </div>
          )}

          <div className="service-detail-deposit-note">
            🔒 Le rendez-vous n'est confirmé qu'après paiement de l'acompte ({depositLabel}). Sans ce paiement, le créneau n'est pas garanti.
          </div>

          <Link to={`/booking?service=${service.id}`} className="btn btn-gold btn-block">
            Réserver cette prestation
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
