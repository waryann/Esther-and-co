import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import './Shop.css'

export default function Shop() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [lengthFilter, setLengthFilter] = useState('all')
  const [capFilter, setCapFilter] = useState('all')
  const [sortBy, setSortBy] = useState('featured')

  useEffect(() => {
    setLoading(true)
    axios.get('/api/products/')
      .then(res => {
        setProducts(res.data)
      })
      .catch(err => {
        console.error("Erreur chargement produits:", err)
      })
      .finally(() => setLoading(false))
  }, [])

  // Extraire toutes les longueurs et bonnets uniques de tous les variants pour alimenter dynamiquement les filtres
  const availableLengths = ['all', ...new Set(
    products.flatMap(p => (p.variants || []).map(v => v.length).filter(Boolean))
  )]

  const availableCaps = ['all', ...new Set(
    products.flatMap(p => (p.variants || []).map(v => v.cap_type).filter(Boolean))
  )]

  // Filtrage et tri
  const filteredProducts = products.filter(product => {
    // 1. Filtrage Catégorie
    if (categoryFilter !== 'all' && product.category !== categoryFilter) return false

    // 2. Filtrage Longueur (si perruque)
    if (lengthFilter !== 'all') {
      const hasLength = (product.variants || []).some(v => v.length === lengthFilter)
      if (!hasLength) return false
    }

    // 3. Filtrage Type de bonnet
    if (capFilter !== 'all') {
      const hasCap = (product.variants || []).some(v => v.cap_type === capFilter)
      if (!hasCap) return false
    }

    return true
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.base_price - b.base_price
    if (sortBy === 'price-desc') return b.base_price - a.base_price
    return b.is_featured - a.is_featured // featured en premier par défaut
  })

  return (
    <div className="shop-page">
      {/* Hero Banner */}
      <section className="shop-hero">
        <div className="shop-hero__content">
          <span className="shop-hero__subtitle font-sans">LA COLLECTION EST'HAIR</span>
          <h1 className="shop-hero__title font-serif">Des perruques d'exception & soins signature</h1>
          <p className="shop-hero__desc">
            Cheveux 100% naturels Remy Hair, customisés avec soin pour une indétectabilité totale.
          </p>
        </div>
      </section>

      <div className="shop-container">
        {/* Barre de filtres */}
        <aside className="shop-sidebar">
          <div className="shop-filter-group">
            <h3 className="shop-filter-title font-serif">Catégories</h3>
            <div className="shop-filter-options">
              <button 
                className={`filter-btn ${categoryFilter === 'all' ? 'active' : ''}`}
                onClick={() => setCategoryFilter('all')}
              >
                Tous les produits
              </button>
              <button 
                className={`filter-btn ${categoryFilter === 'wig' ? 'active' : ''}`}
                onClick={() => setCategoryFilter('wig')}
              >
                Perruques
              </button>
              <button 
                className={`filter-btn ${categoryFilter === 'care' ? 'active' : ''}`}
                onClick={() => setCategoryFilter('care')}
              >
                Produits d'entretien
              </button>
            </div>
          </div>

          {/* Filtres perruques (longueur, bonnet) visibles uniquement si non-filtré sur soins */}
          {categoryFilter !== 'care' && (
            <>
              <div className="shop-filter-group">
                <h3 className="shop-filter-title font-serif">Longueur</h3>
                <select 
                  value={lengthFilter} 
                  onChange={e => setLengthFilter(e.target.value)}
                  className="shop-select"
                >
                  <option value="all">Toutes les longueurs</option>
                  {availableLengths.filter(l => l !== 'all').map(len => (
                    <option key={len} value={len}>{len}</option>
                  ))}
                </select>
              </div>

              <div className="shop-filter-group">
                <h3 className="shop-filter-title font-serif">Type de bonnet</h3>
                <select 
                  value={capFilter} 
                  onChange={e => setCapFilter(e.target.value)}
                  className="shop-select"
                >
                  <option value="all">Tous les bonnets</option>
                  {availableCaps.filter(c => c !== 'all').map(cap => (
                    <option key={cap} value={cap}>{cap}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="shop-filter-group">
            <h3 className="shop-filter-title font-serif">Trier par</h3>
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)}
              className="shop-select"
            >
              <option value="featured">Populaires</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
            </select>
          </div>
        </aside>

        {/* Grille de produits */}
        <main className="shop-main">
          {loading ? (
            <div className="shop-loading">
              <div className="spinner"></div>
              <p>Sublimation de la collection en cours...</p>
            </div>
          ) : (
            <>
              <div className="shop-results-header">
                <p>{filteredProducts.length} article(s) trouvé(s)</p>
              </div>

              <div className="shop-grid">
                <AnimatePresence>
                  {filteredProducts.map(product => (
                    <motion.div
                      key={product.id}
                      className="shop-card"
                      layout
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Link to={`/shop/${product.id}`} className="shop-card__link">
                        <div className="shop-card__image-container">
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name} 
                              className="shop-card__image" 
                            />
                          ) : (
                            <div className="shop-card__placeholder font-serif">EST'HAIR</div>
                          )}
                          <div className="shop-card__tags-wrap">
                            {product.on_sale && (
                              <span className="shop-card__tag shop-card__tag--sale">Solde</span>
                            )}
                            {product.is_new && (
                              <span className="shop-card__tag shop-card__tag--new">Nouveau</span>
                            )}
                            {product.is_bestseller && (
                              <span className="shop-card__tag shop-card__tag--bestseller">Bestseller</span>
                            )}
                            {product.is_featured && !product.on_sale && !product.is_new && !product.is_bestseller && (
                              <span className="shop-card__tag">Édition Limitée</span>
                            )}
                          </div>
                        </div>

                        <div className="shop-card__content">
                          <span className="shop-card__category">
                            {product.category === 'wig' ? 'Perruque' : 'Soin & Entretien'}
                          </span>
                          <h3 className="shop-card__title font-serif">{product.name}</h3>
                          <div className="shop-card__footer">
                            <span className="shop-card__price">
                              {product.category === 'wig' ? 'À partir de\u00a0' : ''}
                              {product.on_sale ? (
                                <>
                                  <span className="shop-card__price-original">
                                    {product.base_price} €
                                  </span>
                                  <span className="shop-card__price-promo">
                                    {product.sale_price} €
                                  </span>
                                </>
                              ) : (
                                <>{product.base_price} €</>
                              )}
                            </span>
                            <span className="shop-card__discover">Découvrir ➔</span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {filteredProducts.length === 0 && (
                <div className="shop-empty font-serif">
                  <p>Aucun produit ne correspond à vos filtres.</p>
                  <button 
                    className="btn btn-gold"
                    onClick={() => {
                      setCategoryFilter('all')
                      setLengthFilter('all')
                      setCapFilter('all')
                    }}
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
