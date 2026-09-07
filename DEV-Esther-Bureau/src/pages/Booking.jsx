import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Calendar from 'react-calendar'
import { format, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import 'react-calendar/dist/Calendar.css'
import './Booking.css'

function computeDeposit(service, totalPrice) {
  if (!service) return 0
  if (service.deposit_is_percent) return Math.round(totalPrice * service.deposit_value) / 100
  return service.deposit_value
}

export default function Booking() {
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(1)
  const [services, setServices] = useState([])
  const [servicesLoading, setServicesLoading] = useState(true)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedOptionIds, setSelectedOptionIds] = useState([])
  const [optionPhotos, setOptionPhotos] = useState({}) // { [optionId]: image_url }
  const [uploadingOptionId, setUploadingOptionId] = useState(null)
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

  useEffect(() => {
    axios.get('/api/services/')
      .then(res => {
        setServices(res.data)
        // Pré-sélection depuis la page "Vente / Services" (ex: /booking?service=3)
        const preselectId = searchParams.get('service')
        if (preselectId) {
          const match = res.data.find(s => String(s.id) === preselectId)
          if (match) setSelectedService(match)
        }
      })
      .catch(err => console.error('Erreur chargement prestations:', err))
      .finally(() => setServicesLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch slots when date or service changes
  useEffect(() => {
    if (selectedService && date) {
      fetchSlots(date)
    }
  }, [date, selectedService])

  const fetchSlots = async (selectedDate) => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      setSlots([])
      const res = await axios.get(`/api/appointments/slots?date=${dateStr}&service_id=${selectedService.id}`)
      setSlots(res.data.slots)
    } catch (error) {
      console.error('Error fetching slots:', error)
      setSlots([])
    }
  }

  const selectService = (service) => {
    setSelectedService(service)
    setSelectedVariant(null)
    setSelectedOptionIds([])
    setOptionPhotos({})
  }

  const toggleOption = (option) => {
    setSelectedOptionIds(prev =>
      prev.includes(option.id) ? prev.filter(id => id !== option.id) : [...prev, option.id]
    )
  }

  const handlePhotoUpload = async (optionId, file) => {
    if (!file) return
    setUploadingOptionId(optionId)
    try {
      const formPayload = new FormData()
      formPayload.append('file', file)
      const res = await axios.post('/api/admin/upload', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setOptionPhotos(prev => ({ ...prev, [optionId]: res.data.image_url }))
    } catch (error) {
      console.error("Erreur lors de l'envoi de la photo:", error)
      alert("La photo n'a pas pu être envoyée, réessayez.")
    } finally {
      setUploadingOptionId(null)
    }
  }

  const basePrice = selectedVariant ? selectedVariant.price : (selectedService?.price ?? 0)
  const selectedOptions = (selectedService?.options || []).filter(o => selectedOptionIds.includes(o.id))
  const optionsTotal = selectedOptions.reduce((sum, o) => sum + o.price, 0)
  const totalPrice = basePrice + optionsTotal
  const depositAmount = computeDeposit(selectedService, totalPrice)

  const canProceedStep1 = selectedService && (!selectedService.is_pack || selectedVariant)

  const handleNext = () => {
    if (step === 1 && canProceedStep1) setStep(2)
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
        variant_id: selectedVariant?.id,
        options: selectedOptions.map(o => ({
          option_id: o.id,
          photo_url: optionPhotos[o.id] || null,
        })),
        scheduled_at: scheduledAt,
        head_size: formData.headSize,
        client_notes: formData.notes
      }

      const apptRes = await axios.post('/api/appointments/', payload)
      const appointmentId = apptRes.data.appointment.id
      
      // Paiement de l'acompte via Stripe
      const paymentRes = await axios.post(`/api/payments/deposit/${appointmentId}`)
      
      if (paymentRes.data.checkout_url) {
        window.location.href = paymentRes.data.checkout_url
      } else {
        setSuccess(true)
      }
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
              Votre prestation <strong>{selectedService.name}</strong>
              {selectedVariant ? <> — <strong>{selectedVariant.label}</strong></> : null} le{' '}
              <strong>{format(date, 'dd MMMM yyyy', { locale: fr })} à {selectedSlot}</strong> est réservée.
            </p>
            <p className="booking__success-sub">
              Votre acompte de <strong>{depositAmount}€</strong> a été validé. Vous allez recevoir un SMS de confirmation dans quelques instants.
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
            <div className={`booking__step ${step >= 3 ? 'active' : ''}`}>3. Paiement de l'acompte</div>
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
                {servicesLoading ? (
                  <p className="no-slots">Chargement des prestations...</p>
                ) : (
                  <div className="services-grid">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className={`service-card ${selectedService?.id === service.id ? 'selected' : ''}`}
                        onClick={() => selectService(service)}
                      >
                        <h3 className="service-card__title font-serif">{service.name}</h3>
                        {service.description && (
                          <p className="service-card__desc">{service.description}</p>
                        )}
                        <div className="service-card__bottom">
                          <span className="service-card__duration">⏱ {Math.round(service.duration_minutes / 30) * 30 >= 60 ? `${Math.floor(service.duration_minutes / 60)}h${service.duration_minutes % 60 ? service.duration_minutes % 60 : ''}` : `${service.duration_minutes}min`}</span>
                          <span className="service-card__price">
                            {service.is_pack ? `À partir de ${service.price}€` : `${service.price}€`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sélection de la déclinaison (pack) */}
                {selectedService?.is_pack && (
                  <div className="booking__sub-section">
                    <h3 className="booking__sub-title font-serif">Choisissez votre déclinaison</h3>
                    <div className="variant-grid">
                      {selectedService.variants.map(variant => (
                        <button
                          key={variant.id}
                          type="button"
                          className={`variant-chip ${selectedVariant?.id === variant.id ? 'selected' : ''}`}
                          onClick={() => setSelectedVariant(variant)}
                        >
                          <span className="variant-chip__label">{variant.label}</span>
                          <span className="variant-chip__price">{variant.price}€</span>
                        </button>
                      ))}
                    </div>
                    {selectedService.conditions && (
                      <p className="booking__variant-note">ℹ️ {selectedService.conditions}</p>
                    )}
                  </div>
                )}

                {/* Détails de la prestation sélectionnée */}
                {selectedService && (selectedService.includes?.length > 0 || selectedService.conditions) && (
                  <div className="booking__sub-section">
                    {selectedService.includes?.length > 0 && (
                      <>
                        <h3 className="booking__sub-title font-serif">Ce qui est inclus</h3>
                        <ul className="booking__includes-list">
                          {selectedService.includes.map((line, i) => <li key={i}>{line}</li>)}
                        </ul>
                      </>
                    )}
                    {!selectedService.is_pack && selectedService.conditions && (
                      <p className="booking__variant-note">ℹ️ {selectedService.conditions}</p>
                    )}
                  </div>
                )}

                {/* Options payantes (ex: coloration) */}
                {selectedService?.options?.length > 0 && (
                  <div className="booking__sub-section">
                    <h3 className="booking__sub-title font-serif">Options (facultatif)</h3>
                    <div className="options-list">
                      {selectedService.options.map(option => (
                        <div key={option.id} className={`option-row ${selectedOptionIds.includes(option.id) ? 'selected' : ''}`}>
                          <label className="option-row__main">
                            <input
                              type="checkbox"
                              checked={selectedOptionIds.includes(option.id)}
                              onChange={() => toggleOption(option)}
                            />
                            <span>{option.name}</span>
                            <span className="option-row__price">+{option.price}€</span>
                          </label>
                          {option.allows_photo && selectedOptionIds.includes(option.id) && (
                            <div className="option-row__photo">
                              <label className="option-row__photo-label">
                                {uploadingOptionId === option.id ? 'Envoi en cours...' : (optionPhotos[option.id] ? '✓ Photo ajoutée — changer' : '📸 Ajouter une photo d\'inspiration (facultatif)')}
                                <input
                                  type="file"
                                  accept="image/*"
                                  hidden
                                  onChange={(e) => handlePhotoUpload(option.id, e.target.files?.[0])}
                                />
                              </label>
                              {optionPhotos[option.id] && (
                                <img src={optionPhotos[option.id]} alt="Aperçu couleur souhaitée" className="option-row__photo-preview" />
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                    {selectedVariant && <p><strong>Déclinaison :</strong> {selectedVariant.label}</p>}
                    {selectedOptions.length > 0 && (
                      <p><strong>Options :</strong> {selectedOptions.map(o => `${o.name} (+${o.price}€)`).join(', ')}</p>
                    )}
                    <p><strong>Date :</strong> {format(date, 'dd/MM/yyyy')}</p>
                    <p><strong>Heure :</strong> {selectedSlot}</p>
                    <p><strong>Prix total :</strong> {totalPrice}€</p>
                    <div className="summary-deposit">
                      <p>Acompte à régler maintenant : <strong>{depositAmount}€</strong></p>
                      <span>Le solde ({(totalPrice - depositAmount).toFixed(2)}€) sera réglé le jour du rendez-vous.</span>
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

                  {selectedService?.requires_wig_deposit && (
                    <p className="booking__reminder">
                      ⚠️ N'oubliez pas : Votre perruque doit être déposée au salon <strong>48h avant</strong> la prestation pour la customisation. Un SMS de rappel vous sera envoyé.
                    </p>
                  )}

                  <p className="booking__reminder booking__reminder--deposit">
                    🔒 Votre rendez-vous n'est <strong>confirmé qu'après paiement de l'acompte</strong> de {depositAmount}€. Sans ce paiement, le créneau n'est pas garanti et peut être repris.
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
              disabled={(step === 1 && !canProceedStep1) || (step === 2 && !selectedSlot)}
            >
              Étape suivante →
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Validation...' : `Confirmer et payer l'acompte (${depositAmount}€)`}
            </button>
          )}
        </div>

      </div>
    </main>
  )
}
