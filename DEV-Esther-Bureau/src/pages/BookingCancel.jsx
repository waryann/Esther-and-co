import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function BookingCancel() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }}
      >
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 className="font-serif" style={{ color: 'var(--red)', marginBottom: '1rem' }}>Paiement annulé</h2>
        <p style={{ color: 'var(--grey-300)', marginBottom: '2rem' }}>
          Vous avez annulé la procédure de paiement de l'acompte. Votre créneau n'est pas réservé.
        </p>
        <button className="btn btn-outline" onClick={() => navigate('/booking')}>
          Retourner à la réservation
        </button>
      </motion.div>
    </div>
  )
}
