import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Calendar from 'react-calendar'
import { format, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import axios from 'axios'
import 'react-calendar/dist/Calendar.css'
import './Booking.css'

const services = [
  { id: 1, name: 'Pose Perruque Lace Front', duration: '2h', price: 80 },
  { id: 2, name: 'Pose Perruque 360', duration: '2h30', price: 100 },
  { id: 3, name: 'Entretien & Soin', duration: '1h', price: 40 },
  { id: 4, name: 'Confection sur-mesure', duration: 'Sur devis', price: 0 },
]

export default function Booking() {
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState(null)
  const [date, setDate] = useState(new Date())
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [formData, setFormData] = useState({
    headSize: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // TODO: Prendre l'user connecté, on simule l'ID 1 pour le test
  const userId = 1 

  // Fetch slots when date or service changes
  useEffect(() => {
    if (selectedService && date) {
      fetchSlots(date)
    }
  }, [date, selectedService])

  const fetchSlots = async (selectedDate) => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      // Simulate API call delay for UI
      setSlots([])
      const res = await axios.get(`/api/appointments/slots?date=${dateStr}&service_id=${selectedService.id}`)
      setSlots(res.data.slots)
    } catch (error) {
      console.error('Error fetching slots:', error)
      setSlots([])
    }
  }

  const handleNext = () => {
    if (step === 1 && selectedService) setStep(2)
    if (step === 2 && selectedSlot) setStep(3)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const scheduledAt = `${dateStr}T${selectedSlot}`
      
      const payload = {
        user_id: userId,
        service_id: selectedService.id,
        scheduled_at: scheduledAt,
        head_size: formData.headSize,
        client_notes: formData.notes
      }
      
      await axios.post('/api/appointments/', payload)
      setSuccess(true)
    } catch (error) {
      console.error('Erreur lors de la réservation:', error)
      alert("Une erreur est survenue lors de la réservation.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
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
              Votre prestation <strong>{selectedService.name}</strong> le{' '}
              <strong>{format(date, 'dd MMMM yyyy', { locale: fr })} à {selectedSlot}</strong> est réservée.
            </p>
            <p className="booking__success-sub">
              Un acompte a été validé. Vous allez recevoir un SMS de confirmation dans quelques instants.
            </p>
            <a href="/" className="btn btn-gold">Retour à l'accueil</a>
          </motion.div>
        </div>
      </main>
    )
  }

  return (
    <main className="booking-page">
      <div className="container booking__container">
        
        {/* Header */}
        <div className="booking__header">
          <p className="section-label">Prestations</p>
          <div className="divider divider-left" />
          <h1 className="booking__title font-serif">Réserver une pose</h1>
          
          {/* Progress bar */}
          <div className="booking__progress">
            <div className={`booking__step ${step >= 1 ? 'active' : ''}`}>1. Prestation</div>
            <div className={`booking__step ${step >= 2 ? 'active' : ''}`}>2. Date & Heure</div>
            <div className={`booking__step ${step >= 3 ? 'active' : ''}`}>3. Informations</div>
          </div>
        </div>

        <div className="booking__content">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Services */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="booking__step-content"
              >
                <div className="services-grid">
                  {services.map((service) => (
                    <div 
                      key={service.id}
                      className={`service-card ${selectedService?.id === service.id ? 'selected' : ''}`}
                      onClick={() => setSelectedService(service)}
                    >
                      <h3 className="service-card__title font-serif">{service.name}</h3>
                      <div className="service-card__bottom">
                        <span className="service-card__duration">⏱ {service.duration}</span>
                        <span className="service-card__price">{service.price > 0 ? `${service.price}€` : service.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 2: Calendar & Slots */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="booking__step-content booking__layout-split"
              >
                <div className="booking__calendar-wrap">
                  <Calendar 
                    onChange={setDate} 
                    value={date} 
                    minDate={new Date()}
                    locale="fr-FR"
                    className="custom-calendar"
                  />
                </div>
                <div className="booking__slots-wrap">
                  <h3 className="booking__slots-title font-serif">
                    Créneaux pour le {format(date, 'd MMMM', { locale: fr })}
                  </h3>
                  {slots.length > 0 ? (
                    <div className="slots-grid">
                      {slots.map((slot) => (
                        <button
                          key={slot}
                          className={`slot-btn ${selectedSlot === slot ? 'selected' : ''}`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="no-slots">Aucun créneau disponible à cette date.</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 3: Form */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="booking__step-content booking__layout-split"
              >
                <div className="booking__summary">
                  <h3 className="font-serif">Résumé de la réservation</h3>
                  <div className="summary-card">
                    <p><strong>Prestation :</strong> {selectedService?.name}</p>
                    <p><strong>Date :</strong> {format(date, 'dd/MM/yyyy')}</p>
                    <p><strong>Heure :</strong> {selectedSlot}</p>
                    <p><strong>Prix total :</strong> {selectedService?.price > 0 ? `${selectedService.price}€` : 'Sur devis'}</p>
                    <div className="summary-deposit">
                      <p>Acompte requis : <strong>{selectedService?.price > 0 ? `${selectedService.price * 0.3}€` : '0€'}</strong></p>
                      <span>(30% du total, simulé pour le test)</span>
                    </div>
                  </div>
                </div>

                <form className="booking__form" onSubmit={handleSubmit}>
                  <h3 className="font-serif">Vos informations pour la pose</h3>
                  
                  <div className="form-group">
                    <label>Tour de tête (en pouces/cm) - Optionnel</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 22 pouces"
                      value={formData.headSize}
                      onChange={(e) => setFormData({...formData, headSize: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Remarques particulières</label>
                    <textarea 
                      placeholder="Dites-nous si vous avez des exigences particulières (allergies colle, etc.)"
                      rows="4"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    ></textarea>
                  </div>
                  
                  <p className="booking__reminder">
                    ⚠️ N'oubliez pas : Votre perruque doit être déposée au salon <strong>48h avant</strong> la prestation pour la customisation. Un SMS de rappel vous sera envoyé.
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="booking__actions">
          {step > 1 && (
            <button className="btn btn-outline" onClick={handleBack}>
              Retour
            </button>
          )}
          
          {step < 3 ? (
            <button 
              className="btn btn-gold" 
              onClick={handleNext}
              disabled={(step === 1 && !selectedService) || (step === 2 && !selectedSlot)}
            >
              Étape suivante →
            </button>
          ) : (
            <button 
              className="btn btn-primary" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Validation...' : 'Confirmer et Payer l\'acompte'}
            </button>
          )}
        </div>
        
      </div>
    </main>
  )
}
