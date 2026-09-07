import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Home from './pages/Home'
import Booking from './pages/Booking'
import BookingSuccess from './pages/BookingSuccess'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import AdminLayout from './pages/admin/AdminLayout'

// Pages à venir (décommentées au fil des étapes)
// import Cart from './pages/Cart'
// import Account from './pages/Account'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques (avec Navbar) */}
        <Route path="/" element={<><Navbar /><Home /></>} />
        <Route path="/booking" element={<><Navbar /><Booking /></>} />
        <Route path="/booking/success" element={<><Navbar /><BookingSuccess /></>} />
        <Route path="/shop" element={<><Navbar /><Shop /></>} />
        <Route path="/shop/:id" element={<><Navbar /><ProductDetail /></>} />

        {/* Panel Admin (sans Navbar publique) */}
        <Route path="/admin/*" element={<AdminLayout />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

