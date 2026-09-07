import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams, Link } from 'react-router-dom'
import axios from 'axios'
import './Booking.css'

export default function BookingSuccess() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading') // loading, success, error
  const [appointment, setAppointment] = useState(null)
  
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (sessionId) {
      verifyPayment()
    } else {
      setStatus('error')
    }
  }, [sessionId])

  const verifyPayment = async () => {
    try {
      const res = await axios.get(`/api/appointments/confirm-payment?session_id=${sessionId}`)
      if (res.data.status === 'success') {
        setStatus('success')
        setAppointment(res.data.appointment)
      } else {
        setStatus('error')
      }
    } catch (error) {
      console.error("Erreur de vérification du paiement", error)
      setStatus('error')
    }
  }

  if (status === 'loading') {
    return (
      <main className="booking-page">
        <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
          <h2 className="font-serif">Vérification de votre paiement...</h2>
          <p>Veuillez patienter quelques instants.</p>
        </div>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="booking-page">
        <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
          <h2 className="font-serif" style={{ color: 'red' }}>Oups ! Problème avec le paiement</h2>
          <p>Nous n'avons pas pu valider votre acompte.</p>
          <p>Si vous avez été débité, veuillez nous contacter.</p>
          <Link to="/booking" className="btn btn-outline" style={{ marginTop: '20px' }}>Retour à la réservation</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="booking-page">
      <div className="container">
        <motion.div 
          className="booking__success"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="booking__success-icon">✓</div>
          <h1 className="font-serif">Rendez-vous Confirmé</h1>
          <p>
            Votre acompte a été payé avec succès !
          </p>
          {appointment && (
            <p>
              Votre prestation est réservée pour le{' '}
              <strong>{new Date(appointment.scheduled_at).toLocaleDateString('fr-FR')} à {new Date(appointment.scheduled_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</strong>.
            </p>
          )}
          <p className="booking__success-sub">
            Vous allez recevoir un SMS de confirmation dans quelques instants.
          </p>
          <Link to="/" className="btn btn-gold">Retour à l'accueil</Link>
        </motion.div>
      </div>
    </main>
  )
}
