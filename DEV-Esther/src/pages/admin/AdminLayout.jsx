import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import AdminDashboard from './AdminDashboard'
import AdminAppointments from './AdminAppointments'
import AdminOrders from './AdminOrders'
import AdminProducts from './AdminProducts'
import './Admin.css'

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: '⬛', exact: true },
    { path: '/admin/appointments', label: 'Rendez-vous', icon: '📅' },
    { path: '/admin/orders', label: 'Commandes', icon: '📦' },
    { path: '/admin/products', label: 'Produits & Stock', icon: '👜' },
  ]

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="admin-sidebar__brand">
          <span className="font-serif">EST'HAIR</span>
          <span className="admin-sidebar__tag">Admin</span>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `admin-nav__item ${isActive ? 'active' : ''}`
              }
            >
              <span className="admin-nav__icon">{item.icon}</span>
              {sidebarOpen && <span className="admin-nav__label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          className="admin-sidebar__toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="products" element={<AdminProducts />} />
        </Routes>
      </main>
    </div>
  )
}
