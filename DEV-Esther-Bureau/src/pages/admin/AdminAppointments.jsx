import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import axios from 'axios'

const STATUS_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  completed: 'Terminé',
  cancelled: 'Annulé',
}

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [smsMessage, setSmsMessage] = useState('')
  const [adminNote, setAdminNote] = useState('')

  const fetchAppointments = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.append('status', statusFilter)
    if (dateFilter) params.append('date', dateFilter)

    axios.get(`/api/admin/appointments?${params}`)
      .then(res => setAppointments(res.data))
      .catch(() => {
        // Données simulées
        setAppointments([
          {
            id: 1,
            client_name: 'Marie Dupont',
            client_phone: '+33612345678',
            service_name: 'Pose Lace Front',
            scheduled_at: new Date().toISOString(),
            status: 'confirmed',
            deposit_paid: true,
            wig_deposit_received: false,
            admin_notes: '',
          },
          {
            id: 2,
            client_name: 'Sophie Martin',
            client_phone: '+32498765432',
            service_name: 'Entretien & Soin',
            scheduled_at: new Date(Date.now() + 86400000).toISOString(),
            status: 'pending',
            deposit_paid: false,
            wig_deposit_received: false,
            admin_notes: '',
          },
        ])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAppointments() }, [statusFilter, dateFilter])

  const updateStatus = (id, status) => {
    axios.put(`/api/admin/appointments/${id}`, { status })
      .then(() => fetchAppointments())
      .catch(() => alert('Erreur lors de la mise à jour'))
  }

  const toggleWigDeposit = (appt) => {
    axios.put(`/api/admin/appointments/${appt.id}`, { wig_deposit_received: !appt.wig_deposit_received })
      .then(() => fetchAppointments())
  }

  const sendSms = (id) => {
    if (!smsMessage) return
    axios.post(`/api/admin/appointments/${id}/sms`, { message: smsMessage })
      .then(() => { alert('SMS envoyé ✓'); setSmsMessage(''); setSelected(null) })
      .catch(() => alert('Erreur SMS'))
  }

  const saveNote = (id) => {
    axios.put(`/api/admin/appointments/${id}`, { admin_notes: adminNote })
      .then(() => { fetchAppointments(); setSelected(null) })
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title font-serif">Rendez-vous</h1>
        <div className="admin-filters">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-select">
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="admin-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Chargement...</div>
      ) : (
        <div className="admin-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Client</th>
                <th>Prestation</th>
                <th>Date & Heure</th>
                <th>Statut</th>
                <th>Acompte</th>
                <th>Perruque dép.</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(appt => (
                <motion.tr
                  key={appt.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <td>#{appt.id}</td>
                  <td>
                    <div>{appt.client_name}</div>
                    <div className="admin-table__sub">{appt.client_phone}</div>
                  </td>
                  <td>{appt.service_name}</td>
                  <td>
                    {format(new Date(appt.scheduled_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </td>
                  <td>
                    <select
                      className={`badge badge--${appt.status}`}
                      value={appt.status}
                      onChange={e => updateStatus(appt.id, e.target.value)}
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={`badge badge--${appt.deposit_paid ? 'paid' : 'pending'}`}>
                      {appt.deposit_paid ? '✓ Payé' : '✗ Non payé'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`admin-toggle ${appt.wig_deposit_received ? 'active' : ''}`}
                      onClick={() => toggleWigDeposit(appt)}
                    >
                      {appt.wig_deposit_received ? '✓ Reçue' : '✗ Non reçue'}
                    </button>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button
                        className="btn-icon" title="SMS"
                        onClick={() => { setSelected({ ...appt, mode: 'sms' }); setSmsMessage('') }}
                      >📱</button>
                      <button
                        className="btn-icon" title="Notes"
                        onClick={() => { setSelected({ ...appt, mode: 'note' }); setAdminNote(appt.admin_notes || '') }}
                      >📝</button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {appointments.length === 0 && (
            <p className="admin-empty">Aucun rendez-vous trouvé.</p>
          )}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <div className="admin-modal-overlay" onClick={() => setSelected(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <button className="admin-modal__close" onClick={() => setSelected(null)}>✕</button>
            <h3 className="font-serif">
              {selected.mode === 'sms' ? `Envoyer un SMS à ${selected.client_name}` : `Notes — ${selected.client_name}`}
            </h3>

            {selected.mode === 'sms' ? (
              <>
                <textarea
                  className="admin-textarea"
                  rows="4"
                  placeholder="Votre message SMS..."
                  value={smsMessage}
                  onChange={e => setSmsMessage(e.target.value)}
                />
                <div className="quick-messages">
                  {[
                    'EST\'HAIR & CO : N\'oubliez pas votre RDV demain. Merci !',
                    'EST\'HAIR & CO : Votre perruque est prête. Merci de la déposer 48h avant.',
                    'EST\'HAIR & CO : Votre acompte reste à régler pour confirmer votre RDV.',
                  ].map(msg => (
                    <button key={msg} className="quick-msg-btn" onClick={() => setSmsMessage(msg)}>
                      {msg.substring(0, 50)}...
                    </button>
                  ))}
                </div>
                <button className="btn btn-gold" onClick={() => sendSms(selected.id)}>
                  Envoyer le SMS
                </button>
              </>
            ) : (
              <>
                <textarea
                  className="admin-textarea"
                  rows="5"
                  placeholder="Notes internes (non visibles par le client)..."
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                />
                <button className="btn btn-gold" onClick={() => saveNote(selected.id)}>
                  Sauvegarder
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
