import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import './Admin.css'

export default function AdminServices() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingService, setEditingService] = useState(null)

  // Default empty service
  const initialServiceState = {
    name: '',
    description: '',
    price: '',
    duration_minutes: '60',
    deposit_amount: '0',
    deposit_is_percent: true,
    requires_wig_deposit: false,
    includes: '',
    conditions: '',
    is_pack: false,
    is_active: true
  }
  
  const [formData, setFormData] = useState(initialServiceState)

  const fetchServices = () => {
    setLoading(true)
    axios.get('/api/admin/services')
      .then(res => setServices(res.data))
      .catch(err => {
        console.error("Erreur chargement services:", err)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchServices() }, [])

  // ─── SERVICE ACTIONS ──────────────────────────────────────────────

  const toggleActive = (service) => {
    axios.put(`/api/admin/services/${service.id}`, { is_active: !service.is_active })
      .then(() => fetchServices())
  }

  const openAddForm = () => {
    setEditingService(null)
    setFormData(initialServiceState)
    setShowAddForm(true)
  }

  const openEditForm = (service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price,
      duration_minutes: service.duration_minutes,
      deposit_amount: service.deposit_amount,
      deposit_is_percent: service.deposit_is_percent,
      requires_wig_deposit: service.requires_wig_deposit,
      includes: service.includes ? service.includes.join('\n') : '',
      conditions: service.conditions || '',
      is_pack: service.is_pack,
      is_active: service.is_active
    })
    setShowAddForm(true)
  }

  const saveService = () => {
    if (!formData.name || formData.price === '') return

    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      duration_minutes: parseInt(formData.duration_minutes),
      deposit_amount: parseFloat(formData.deposit_amount)
    }

    if (editingService) {
      axios.put(`/api/admin/services/${editingService.id}`, payload)
        .then(() => {
          fetchServices()
          setShowAddForm(false)
        })
        .catch(() => alert('Erreur lors de la mise à jour'))
    } else {
      axios.post('/api/admin/services', payload)
        .then(() => {
          fetchServices()
          setShowAddForm(false)
        })
        .catch(() => alert('Erreur lors de la création'))
    }
  }

  // ─── VARIANTS ACTIONS ─────────────────────────────────────────────

  const toggleVariantActive = (variant) => {
    axios.put(`/api/admin/services/variants/${variant.id}`, { is_active: !variant.is_active })
      .then(() => fetchServices())
  }

  const saveVariantInline = (serviceId, variantId, field, value) => {
    axios.put(`/api/admin/services/variants/${variantId}`, { [field]: value })
      .then(() => fetchServices())
  }

  const addVariant = (serviceId) => {
    const label = prompt("Nom de la déclinaison (ex: '2 paquets de 16 pouces') :")
    if (!label) return
    const price = prompt("Prix pour cette déclinaison :", "0")
    if (price === null) return

    axios.post(`/api/admin/services/${serviceId}/variants`, {
      label,
      price: parseFloat(price)
    }).then(() => fetchServices())
  }

  // ─── OPTIONS ACTIONS ──────────────────────────────────────────────

  const toggleOptionActive = (option) => {
    axios.put(`/api/admin/services/options/${option.id}`, { is_active: !option.is_active })
      .then(() => fetchServices())
  }

  const toggleOptionPhoto = (option) => {
    axios.put(`/api/admin/services/options/${option.id}`, { allows_photo: !option.allows_photo })
      .then(() => fetchServices())
  }

  const saveOptionInline = (serviceId, optionId, field, value) => {
    axios.put(`/api/admin/services/options/${optionId}`, { [field]: value })
      .then(() => fetchServices())
  }

  const addOption = (serviceId) => {
    const name = prompt("Nom de l'option (ex: 'Coloration uniforme') :")
    if (!name) return
    const price = prompt("Prix de l'option :", "0")
    if (price === null) return

    axios.post(`/api/admin/services/${serviceId}/options`, {
      name,
      price: parseFloat(price),
      allows_photo: true
    }).then(() => fetchServices())
  }

  // ─── RENDER HELPER ───────────────────────────────────────────────

  const renderServiceCard = (service) => (
    <motion.div key={service.id} className="product-admin-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="product-admin-card__header">
        <div className="product-admin-card__info-group">
          <div>
            <h3 className="font-serif">{service.name} {service.is_pack && <span className="badge badge--wig">📦 Pack</span>}</h3>
            <p className="admin-table__sub">{service.description}</p>
            <div className="product-admin-card__meta">
              <span className="product-admin-card__price">{service.price} €</span>
              <span className="admin-table__sub" style={{ marginLeft: '1rem' }}>⏱ {service.duration_minutes} min</span>
              <span className="admin-table__sub" style={{ marginLeft: '1rem' }}>
                💳 Acompte : {service.deposit_amount}{service.deposit_is_percent ? '%' : '€'}
              </span>
            </div>
          </div>
        </div>
        <div className="product-admin-card__actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button className="btn-icon" onClick={() => openEditForm(service)} title="Modifier la prestation">✏️</button>
          <button className={`admin-toggle ${service.is_active ? 'active' : ''}`} onClick={() => toggleActive(service)}>
            {service.is_active ? '✓ Actif' : '✗ Inactif'}
          </button>
        </div>
      </div>

      {/* VARIANTS (if pack) */}
      {service.is_pack && (
        <div className="product-variants" style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4>Déclinaisons du Pack</h4>
            <button className="quick-msg-btn" onClick={() => addVariant(service.id)}>+ Ajouter une déclinaison</button>
          </div>
          <table className="admin-table variants-table">
            <thead>
              <tr>
                <th>Label</th>
                <th>Longueur</th>
                <th>Style</th>
                <th>Prix (€)</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {(service.variants || []).map(variant => (
                <tr key={variant.id} style={{ opacity: variant.is_active ? 1 : 0.5 }}>
                  <td>
                    <input className="stock-input" style={{ width: '150px', textAlign: 'left' }} defaultValue={variant.label} 
                           onBlur={e => e.target.value !== variant.label && saveVariantInline(service.id, variant.id, 'label', e.target.value)} />
                  </td>
                  <td>
                    <input className="stock-input" defaultValue={variant.length || ''} placeholder="ex: 18&quot;"
                           onBlur={e => e.target.value !== (variant.length || '') && saveVariantInline(service.id, variant.id, 'length', e.target.value)} />
                  </td>
                  <td>
                    <input className="stock-input" defaultValue={variant.style || ''} placeholder="ex: Lisse"
                           onBlur={e => e.target.value !== (variant.style || '') && saveVariantInline(service.id, variant.id, 'style', e.target.value)} />
                  </td>
                  <td>
                    <input className="stock-input" type="number" defaultValue={variant.price} 
                           onBlur={e => e.target.value != variant.price && saveVariantInline(service.id, variant.id, 'price', parseFloat(e.target.value))} />
                  </td>
                  <td>
                    <button className={`admin-toggle ${variant.is_active ? 'active' : ''}`} style={{ padding: '0.2rem 0.5rem' }} onClick={() => toggleVariantActive(variant)}>
                      {variant.is_active ? 'On' : 'Off'}
                    </button>
                  </td>
                </tr>
              ))}
              {!service.variants?.length && (
                <tr><td colSpan="5" className="admin-empty">Aucune déclinaison configurée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* OPTIONS */}
      <div className="product-variants" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4>Options Supplémentaires</h4>
          <button className="quick-msg-btn" onClick={() => addOption(service.id)}>+ Ajouter une option</button>
        </div>
        <table className="admin-table variants-table">
          <thead>
            <tr>
              <th>Nom de l'option</th>
              <th>Prix (€)</th>
              <th>Autorise Photo ?</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {(service.options || []).map(option => (
              <tr key={option.id} style={{ opacity: option.is_active ? 1 : 0.5 }}>
                <td>
                  <input className="stock-input" style={{ width: '200px', textAlign: 'left' }} defaultValue={option.name} 
                         onBlur={e => e.target.value !== option.name && saveOptionInline(service.id, option.id, 'name', e.target.value)} />
                </td>
                <td>
                  <input className="stock-input" type="number" defaultValue={option.price} 
                         onBlur={e => e.target.value != option.price && saveOptionInline(service.id, option.id, 'price', parseFloat(e.target.value))} />
                </td>
                <td>
                  <button className={`admin-toggle ${option.allows_photo ? 'active' : ''}`} style={{ padding: '0.2rem 0.5rem' }} onClick={() => toggleOptionPhoto(option)}>
                    {option.allows_photo ? '📸 Oui' : 'Non'}
                  </button>
                </td>
                <td>
                  <button className={`admin-toggle ${option.is_active ? 'active' : ''}`} style={{ padding: '0.2rem 0.5rem' }} onClick={() => toggleOptionActive(option)}>
                    {option.is_active ? 'On' : 'Off'}
                  </button>
                </td>
              </tr>
            ))}
            {!service.options?.length && (
              <tr><td colSpan="4" className="admin-empty">Aucune option configurée.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  )

  const packs = services.filter(s => s.is_pack)
  const simples = services.filter(s => !s.is_pack)

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title font-serif">Prestations & Packs</h1>
        <button className="btn btn-gold" onClick={openAddForm}>
          + Nouvelle prestation
        </button>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddForm(false)}>
            <motion.div className="admin-modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
              <button className="admin-modal__close" onClick={() => setShowAddForm(false)}>✕</button>
              <h3 className="font-serif">{editingService ? 'Modifier la prestation' : 'Nouvelle prestation'}</h3>

              <div className="admin-form">
                <div className="form-group">
                  <label>Nom *</label>
                  <input className="admin-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="admin-textarea" rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>

                <div className="admin-form__row">
                  <div className="form-group">
                    <label>Prix de base (€) *</label>
                    <input className="admin-input" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Durée (minutes) *</label>
                    <input className="admin-input" type="number" value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: e.target.value})} />
                  </div>
                </div>

                <div className="admin-form__row">
                  <div className="form-group">
                    <label>Acompte *</label>
                    <input className="admin-input" type="number" value={formData.deposit_amount} onChange={e => setFormData({...formData, deposit_amount: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '10px' }}>
                    <label className="admin-checkbox">
                      <input type="checkbox" checked={formData.deposit_is_percent} onChange={e => setFormData({...formData, deposit_is_percent: e.target.checked})} />
                      Calculé en % du prix (sinon € fixe)
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Ce qui est inclus (1 par ligne)</label>
                  <textarea className="admin-textarea" rows="3" placeholder="Brushing&#10;Nattes&#10;Pose" value={formData.includes} onChange={e => setFormData({...formData, includes: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>Conditions / Remarques (affichées au client)</label>
                  <textarea className="admin-textarea" rows="2" value={formData.conditions} onChange={e => setFormData({...formData, conditions: e.target.value})} />
                </div>

                <div className="admin-form__row" style={{ gap: '2rem', marginTop: '1rem', marginBottom: '1rem' }}>
                  <label className="admin-checkbox">
                    <input type="checkbox" checked={formData.is_pack} onChange={e => setFormData({...formData, is_pack: e.target.checked})} />
                    Il s'agit d'un "Pack" (avec déclinaisons de longueur)
                  </label>
                  <label className="admin-checkbox">
                    <input type="checkbox" checked={formData.requires_wig_deposit} onChange={e => setFormData({...formData, requires_wig_deposit: e.target.checked})} />
                    Dépôt de la perruque requis avant le RDV
                  </label>
                </div>

                <button className="btn btn-primary" onClick={saveService}>
                  {editingService ? "Enregistrer les modifications" : "Créer la prestation"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="admin-loading">Chargement...</div>
      ) : (
        <div className="products-admin-list">
          {packs.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 className="font-serif" style={{ color: 'var(--gold)', marginBottom: '1.5rem', fontSize: '1.8rem' }}>Les Packs</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {packs.map(renderServiceCard)}
              </div>
            </div>
          )}
          
          {simples.length > 0 && (
            <div>
              <h2 className="font-serif" style={{ color: 'var(--gold)', marginBottom: '1.5rem', fontSize: '1.8rem' }}>Prestations Classiques</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {simples.map(renderServiceCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
