import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

const STATUS_LABELS = {
  pending: 'En attente',
  paid: 'Payée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [expanded, setExpanded] = useState(null)

  const fetchOrders = () => {
    setLoading(true)
    const params = statusFilter ? `?status=${statusFilter}` : ''
    axios.get(`/api/admin/orders${params}`)
      .then(res => setOrders(res.data))
      .catch(() => {
        setOrders([
          {
            id: 101,
            client_name: 'Marie Dupont',
            client_email: 'marie@example.com',
            status: 'paid',
            total_amount: 180,
            subtotal: 170,
            shipping_cost: 10,
            created_at: new Date().toISOString(),
            items: [{ id: 1, quantity: 1, unit_price: 170, subtotal: 170 }],
          },
        ])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrders() }, [statusFilter])

  const updateStatus = (id, status) => {
    axios.put(`/api/admin/orders/${id}`, { status })
      .then(() => fetchOrders())
      .catch(() => alert('Erreur mise à jour'))
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title font-serif">Commandes</h1>
        <div className="admin-filters">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-select">
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
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
                <th>Total</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Détails</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <>
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td>#{order.id}</td>
                    <td>
                      <div>{order.client_name}</div>
                      <div className="admin-table__sub">{order.client_email}</div>
                    </td>
                    <td><strong>{order.total_amount} €</strong></td>
                    <td>
                      <select
                        className={`badge badge--${order.status}`}
                        value={order.status}
                        onChange={e => updateStatus(order.id, e.target.value)}
                      >
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </td>
                    <td>{new Date(order.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <button
                        className="btn-icon"
                        onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                      >
                        {expanded === order.id ? '▲' : '▼'}
                      </button>
                    </td>
                  </motion.tr>

                  {expanded === order.id && (
                    <tr key={`detail-${order.id}`} className="admin-table__detail">
                      <td colSpan={6}>
                        <div className="order-detail">
                          <div className="order-detail__items">
                            <h4>Articles</h4>
                            {(order.items || []).map(item => (
                              <div key={item.id} className="order-item">
                                <span>Quantité : {item.quantity}</span>
                                <span>Prix unitaire : {item.unit_price} €</span>
                                <span>Sous-total : {item.subtotal} €</span>
                              </div>
                            ))}
                          </div>
                          <div className="order-detail__totals">
                            <p>Sous-total : {order.subtotal} €</p>
                            <p>Livraison : {order.shipping_cost} €</p>
                            <p><strong>Total : {order.total_amount} €</strong></p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && <p className="admin-empty">Aucune commande trouvée.</p>}
        </div>
      )}
    </div>
  )
}
