import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

const statCard = (label, value, icon, sub = '') => (
  <motion.div
    className="admin-stat-card"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    <div className="admin-stat-card__icon">{icon}</div>
    <div className="admin-stat-card__body">
      <p className="admin-stat-card__label">{label}</p>
      <h3 className="admin-stat-card__value font-serif">{value}</h3>
      {sub && <p className="admin-stat-card__sub">{sub}</p>}
    </div>
  </motion.div>
)

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/admin/dashboard')
      .then(res => setStats(res.data))
      .catch(() => {
        // Données simulées pour le développement
        setStats({
          appointments_today: 3,
          appointments_pending: 1,
          monthly_revenue: 2450.00,
          low_stock_alerts: 2,
          total_clients: 18,
          recent_orders: [],
        })
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="admin-loading">Chargement...</div>

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title font-serif">Dashboard</h1>
        <p className="admin-page__date">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="admin-stats-grid">
        {statCard('RDV aujourd\'hui', stats.appointments_today, '📅', 'Planifiés ce jour')}
        {statCard('En attente', stats.appointments_pending, '⏳', 'Nécessitent une action')}
        {statCard('Revenus du mois', `${stats.monthly_revenue.toFixed(2)} €`, '💶', 'Commandes payées')}
        {statCard('Alertes stock', stats.low_stock_alerts, '⚠️', 'Variants < 5 unités')}
        {statCard('Clients total', stats.total_clients, '👤', 'Comptes actifs')}
      </div>

      <div className="admin-dashboard-bottom">
        <div className="admin-card">
          <h2 className="admin-card__title font-serif">Commandes récentes</h2>
          {stats.recent_orders.length === 0 ? (
            <p className="admin-empty">Aucune commande récente.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Client</th>
                  <th>Total</th>
                  <th>Statut</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_orders.map(order => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.client_name || '—'}</td>
                    <td>{order.total_amount} €</td>
                    <td><span className={`badge badge--${order.status}`}>{order.status}</span></td>
                    <td>{new Date(order.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
