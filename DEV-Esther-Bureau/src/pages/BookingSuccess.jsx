import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'

export default function BookingSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const sessionId = searchParams.get('session_id')
  
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    if (!sessionId) {
      setStatus('error')
      return
    }

    // Vérifier le statut de la session auprès du backend
    axios.get(`/api/payments/verify-session/${sessionId}`)
      .then(res => {
        if (res.data.status === 'success' || res.data.status === 'pending') {
          // Même si c'est pending, on considère que Stripe va valider bientôt
          setStatus('success')
        } else {
          setStatus('error')
        }
      })
      .catch(err => {
        console.error("Erreur de vérification :", err)
        setStatus('error')
      })
  }, [sessionId])

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center'
    }}>
      {status === 'loading' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="font-serif">Vérification du paiement...</h2>
          <p style={{ marginTop: '1rem', color: 'var(--grey-400)' }}>Veuillez patienter quelques instants.</p>
        </motion.div>
      )}

      {status === 'success' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          style={{ maxWidth: '500px' }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✨</div>
          <h2 className="font-serif" style={{ color: 'var(--gold)', marginBottom: '1rem' }}>Paiement Réussi !</h2>
          <p style={{ color: 'var(--grey-300)', marginBottom: '2rem', lineHeight: '1.6' }}>
            Merci pour votre confiance. Votre acompte a bien été réglé et votre rendez-vous est maintenant <strong>confirmé</strong>.<br/><br/>
            Vous allez recevoir un SMS récapitulatif d'ici quelques minutes.
          </p>
          <button className="btn btn-outline" onClick={() => navigate('/')}>
            Retour à l'accueil
          </button>
        </motion.div>
      )}

      {status === 'error' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
          <h2 className="font-serif" style={{ color: 'var(--red)', marginBottom: '1rem' }}>Erreur de validation</h2>
          <p style={{ color: 'var(--grey-300)', marginBottom: '2rem' }}>
            Nous n'avons pas pu confirmer votre paiement. Si vous avez été débité, veuillez nous contacter.
          </p>
          <button className="btn btn-outline" onClick={() => navigate('/booking')}>
            Réessayer la réservation
          </button>
        </motion.div>
      )}
    </div>
  )
}
