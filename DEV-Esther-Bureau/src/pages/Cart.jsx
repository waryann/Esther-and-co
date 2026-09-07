import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCart } from '../context/CartContext'
import './Cart.css'

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart()

  return (
    <div className="cart-page container">
      <motion.h1 
        className="font-serif"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Votre Panier
      </motion.h1>

      {cart.length === 0 ? (
        <div className="cart-empty">
          <p>Votre panier est actuellement vide.</p>
          <Link to="/shop" className="btn btn-gold">Retourner à la boutique</Link>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.variantKey} className="cart-item">
                <div className="cart-item-image">
                  <img src={item.product.image_url} alt={item.product.name} />
                </div>
                <div className="cart-item-details">
                  <h3>{item.product.name}</h3>
                  {item.variant && (
                    <p className="cart-item-variant">
                      {item.variant.length && <span>{item.variant.length} </span>}
                      {item.variant.density && <span>- {item.variant.density} </span>}
                      {item.variant.cap_type && <span>- {item.variant.cap_type}</span>}
                    </p>
                  )}
                  <div className="cart-item-actions">
                    <div className="quantity-selector">
                      <button onClick={() => updateQuantity(item.variantKey, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.variantKey, item.quantity + 1)}>+</button>
                    </div>
                    <button className="remove-btn" onClick={() => removeFromCart(item.variantKey)}>
                      Supprimer
                    </button>
                  </div>
                </div>
                <div className="cart-item-price">
                  {(item.price * item.quantity).toFixed(2)} €
                </div>
              </div>
            ))}
          </div>
          
          <div className="cart-summary">
            <h3>Résumé de la commande</h3>
            <div className="cart-summary-row">
              <span>Sous-total</span>
              <span>{getCartTotal().toFixed(2)} €</span>
            </div>
            <div className="cart-summary-total">
              <span>Total</span>
              <span>{getCartTotal().toFixed(2)} €</span>
            </div>
            <button className="btn btn-gold btn-block" onClick={() => alert("Paiement Stripe en cours d'intégration...")}>
              Passer à la caisse
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
