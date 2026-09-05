import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import './ProductDetail.css'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Choix utilisateur
  const [selectedLength, setSelectedLength] = useState('')
  const [selectedDensity, setSelectedDensity] = useState('')
  const [selectedCap, setSelectedCap] = useState('')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    setLoading(true)
    axios.get(`/api/products/${id}`)
      .then(res => {
        setProduct(res.data)
        
        // Initialiser les filtres avec le premier variant par défaut
        const variants = res.data.variants || []
        if (variants.length > 0) {
          const first = variants[0]
          setSelectedLength(first.length || '')
          setSelectedDensity(first.density || '')
          setSelectedCap(first.cap_type || '')
        }
      })
      .catch(err => {
        console.error("Erreur chargement détail produit:", err)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="product-detail-loading shop-loading">
        <div className="spinner"></div>
        <p>Création de votre expérience sur mesure...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="product-detail-error font-serif">
        <h2>Produit introuvable</h2>
        <Link to="/shop" className="btn btn-gold">Retourner à la collection</Link>
      </div>
    )
  }

  // Lister toutes les longueurs, densités et bonnets valides uniques pour ce produit
  const lengths = [...new Set((product.variants || []).map(v => v.length).filter(Boolean))]
  const densities = [...new Set((product.variants || []).map(v => v.density).filter(Boolean))]
  const caps = [...new Set((product.variants || []).map(v => v.cap_type).filter(Boolean))]

  // Trouver la variante actuellement sélectionnée par l'utilisateur
  const activeVariant = (product.variants || []).find(v => {
    const matchLength = lengths.length === 0 || v.length === selectedLength
    const matchDensity = densities.length === 0 || v.density === selectedDensity
    const matchCap = caps.length === 0 || v.cap_type === selectedCap
    return matchLength && matchDensity && matchCap
  })

  // Prix calculé
  const currentBasePrice = product.on_sale && product.sale_price ? product.sale_price : product.base_price
  const finalPrice = activeVariant 
    ? currentBasePrice + activeVariant.price_modifier 
    : currentBasePrice

  const originalPrice = activeVariant
    ? product.base_price + activeVariant.price_modifier
    : product.base_price

  const inStock = activeVariant ? activeVariant.stock > 0 : true
  const stockQuantity = activeVariant ? activeVariant.stock : 0

  const handleAddToCart = () => {
    if (!inStock) return
    alert(`Ajouté au panier: ${product.name} (Quantité: ${quantity}) - Total: ${finalPrice * quantity} €`)
  }

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
        {/* Bouton Retour */}
        <Link to="/shop" className="back-to-shop">
          ➔ Retour à la collection
        </Link>

        <div className="product-detail-layout">
          {/* Section Image */}
          <motion.div 
            className="product-detail-gallery"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="product-detail-image-wrap">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="product-detail-image" />
              ) : (
                <div className="shop-card__placeholder font-serif">EST'HAIR</div>
              )}
            </div>
          </motion.div>

          {/* Section Infos */}
          <motion.div 
            className="product-detail-info"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="product-detail-category">
              {product.category === 'wig' ? 'Perruque d\'Exception' : 'Soin Professionnel'}
            </span>
            <h1 className="product-detail-title font-serif">{product.name}</h1>
            {product.on_sale ? (
              <p className="product-detail-price font-sans">
                <span style={{ textDecoration: 'line-through', opacity: 0.5, marginRight: '15px', fontSize: '0.8em' }}>
                  {(originalPrice * quantity).toFixed(2)} €
                </span>
                <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>
                  {(finalPrice * quantity).toFixed(2)} €
                </span>
              </p>
            ) : (
              <p className="product-detail-price font-sans">
                {(finalPrice * quantity).toFixed(2)} €
              </p>
            )}

            <div className="product-detail-desc-block">
              <h3 className="section-subtitle font-serif">Description</h3>
              <p className="product-detail-desc">{product.description}</p>
            </div>

            {/* Options des déclinaisons (Variants) */}
            {product.category === 'wig' && (
              <div className="product-detail-options">
                {/* Choix Longueur */}
                {lengths.length > 0 && (
                  <div className="option-group">
                    <label>Longueur</label>
                    <div className="option-selectors">
                      {lengths.map(len => (
                        <button
                          key={len}
                          className={`option-selector-btn ${selectedLength === len ? 'active' : ''}`}
                          onClick={() => setSelectedLength(len)}
                        >
                          {len}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Choix Densité */}
                {densities.length > 0 && (
                  <div className="option-group">
                    <label>Densité</label>
                    <div className="option-selectors">
                      {densities.map(den => (
                        <button
                          key={den}
                          className={`option-selector-btn ${selectedDensity === den ? 'active' : ''}`}
                          onClick={() => setSelectedDensity(den)}
                        >
                          {den}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Choix Bonnet */}
                {caps.length > 0 && (
                  <div className="option-group">
                    <label>Type de Bonnet</label>
                    <div className="option-selectors">
                      {caps.map(cap => (
                        <button
                          key={cap}
                          className={`option-selector-btn ${selectedCap === cap ? 'active' : ''}`}
                          onClick={() => setSelectedCap(cap)}
                        >
                          {cap}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantité & Achat */}
            <div className="purchase-section">
              <div className="quantity-selector-wrap">
                <label>Quantité</label>
                <div className="quantity-selector">
                  <button 
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(quantity - 1)}
                  >
                    -
                  </button>
                  <span>{quantity}</span>
                  <button 
                    disabled={activeVariant && quantity >= stockQuantity}
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* État des stocks */}
              <div className="stock-status-info">
                {inStock ? (
                  <span className="stock-in font-sans">
                    ✓ En stock ({stockQuantity} disponible(s))
                  </span>
                ) : (
                  <span className="stock-out font-sans">
                    ✗ En rupture de stock
                  </span>
                )}
              </div>

              <button
                className="btn btn-gold btn-block purchase-btn"
                disabled={!inStock}
                onClick={handleAddToCart}
              >
                {inStock ? "Ajouter au Panier" : "Rupture de Stock"}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
