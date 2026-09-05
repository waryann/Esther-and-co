import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', base_price: '', category: 'wig', is_featured: false, image_url: '',
    is_bestseller: false, is_new: true, on_sale: false, sale_price: ''
  })
  const [uploading, setUploading] = useState(false)
  const [autoRemoveBg, setAutoRemoveBg] = useState(true)

  const fetchProducts = () => {
    setLoading(true)
    axios.get('/api/admin/products')
      .then(res => setProducts(res.data))
      .catch(() => {
        setProducts([
          {
            id: 1,
            name: 'Lace Front Natural Black',
            description: 'Perruque 100% naturelle, 18 pouces',
            base_price: 250,
            category: 'wig',
            is_active: true,
            is_featured: true,
            variants: [
              { id: 1, length: '16"', density: '150%', cap_type: 'Lace Front', price_modifier: 0, stock_quantity: 3 },
              { id: 2, length: '18"', density: '150%', cap_type: 'Lace Front', price_modifier: 30, stock_quantity: 1 },
              { id: 3, length: '20"', density: '180%', cap_type: '360 Lace', price_modifier: 60, stock_quantity: 7 },
            ]
          },
          {
            id: 2,
            name: 'Spray Entretien Perruque',
            description: 'Spray hydratant spécial perruque',
            base_price: 25,
            category: 'care',
            is_active: true,
            is_featured: false,
            variants: [
              { id: 4, length: null, density: null, cap_type: null, price_modifier: 0, stock_quantity: 15 },
            ]
          },
        ])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProducts() }, [])

  const toggleFeatured = (product) => {
    axios.put(`/api/admin/products/${product.id}`, { is_featured: !product.is_featured })
      .then(() => fetchProducts())
  }

  const toggleActive = (product) => {
    axios.put(`/api/admin/products/${product.id}`, { is_active: !product.is_active })
      .then(() => fetchProducts())
  }

  const toggleBestseller = (product) => {
    axios.put(`/api/admin/products/${product.id}`, { is_bestseller: !product.is_bestseller })
      .then(() => fetchProducts())
  }

  const toggleNew = (product) => {
    axios.put(`/api/admin/products/${product.id}`, { is_new: !product.is_new })
      .then(() => fetchProducts())
  }

  const toggleOnSale = (product) => {
    let sale_price_val = null
    if (!product.on_sale) {
      const price_input = prompt("Saisir le prix soldé (€) :", Math.round(product.base_price * 0.8))
      if (price_input === null) return
      sale_price_val = parseFloat(price_input)
    }
    axios.put(`/api/admin/products/${product.id}`, { 
      on_sale: !product.on_sale, 
      sale_price: sale_price_val 
    }).then(() => fetchProducts())
  }

  const updateStock = (productId, variantId, newStock) => {
    axios.put(`/api/admin/products/${productId}`, {
      variants: [{ id: variantId, stock_quantity: parseInt(newStock) }]
    }).then(() => fetchProducts())
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('remove_bg', autoRemoveBg ? 'true' : 'false')

    axios.post('/api/admin/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then(res => {
      setNewProduct(prev => ({
        ...prev,
        image_url: res.data.image_url
      }))
    })
    .catch(err => {
      console.error(err)
      alert(err.response?.data?.error || "Erreur lors du téléversement/détourage")
    })
    .finally(() => {
      setUploading(false)
    })
  }

  const createProduct = () => {
    if (!newProduct.name || !newProduct.base_price) return
    axios.post('/api/admin/products', {
      ...newProduct,
      base_price: parseFloat(newProduct.base_price),
      sale_price: newProduct.sale_price ? parseFloat(newProduct.sale_price) : null
    }).then(() => {
      fetchProducts()
      setShowAddForm(false)
      setNewProduct({
        name: '', description: '', base_price: '', category: 'wig', is_featured: false, image_url: '',
        is_bestseller: false, is_new: true, on_sale: false, sale_price: ''
      })
    }).catch(() => alert('Erreur lors de la création'))
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title font-serif">Produits & Stock</h1>
        <button className="btn btn-gold" onClick={() => setShowAddForm(true)}>
          + Nouveau produit
        </button>
      </div>

      {/* Add Product Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            className="admin-modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              className="admin-modal"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="admin-modal__close" onClick={() => setShowAddForm(false)}>✕</button>
              <h3 className="font-serif">Nouveau produit</h3>

              <div className="admin-form">
                <div className="form-group">
                  <label>Nom *</label>
                  <input className="admin-input" value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="admin-textarea" rows="3" value={newProduct.description}
                    onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
                </div>
                <div className="admin-form__row">
                  <div className="form-group">
                    <label>Prix de base (€) *</label>
                    <input className="admin-input" type="number" value={newProduct.base_price}
                      onChange={e => setNewProduct({...newProduct, base_price: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Catégorie</label>
                    <select className="admin-select" value={newProduct.category}
                      onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                      <option value="wig">Perruque</option>
                      <option value="care">Produit d'entretien</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Photo du produit</label>
                  <div className="admin-upload-area">
                    <input 
                      type="file" 
                      accept="image/*" 
                      id="product-image-upload" 
                      onChange={handleFileUpload} 
                      style={{ display: 'none' }}
                      disabled={uploading}
                    />
                    <label htmlFor="product-image-upload" className={`admin-upload-label ${uploading ? 'uploading' : ''}`}>
                      {uploading ? "⏳ Traitement / Détourage par l'IA..." : "📸 Glisser ou Choisir une photo"}
                    </label>

                    {newProduct.image_url && (
                      <div className="admin-upload-preview">
                        <img src={newProduct.image_url} alt="Aperçu" className="preview-img" />
                        <span className="preview-badge">Aperçu détouré</span>
                      </div>
                    )}
                  </div>
                </div>

                <label className="admin-checkbox">
                  <input 
                    type="checkbox" 
                    checked={autoRemoveBg} 
                    onChange={e => setAutoRemoveBg(e.target.checked)} 
                  />
                  Détourer automatiquement la photo (fond transparent uniforme)
                </label>

                <div className="admin-form__row" style={{ gap: '2rem', marginBottom: '1rem' }}>
                  <label className="admin-checkbox">
                    <input type="checkbox" checked={newProduct.is_new}
                      onChange={e => setNewProduct({...newProduct, is_new: e.target.checked})} />
                    Badge "Nouveau"
                  </label>
                  <label className="admin-checkbox">
                    <input type="checkbox" checked={newProduct.is_bestseller}
                      onChange={e => setNewProduct({...newProduct, is_bestseller: e.target.checked})} />
                    Badge "Bestseller"
                  </label>
                </div>

                <div className="admin-form__row" style={{ gap: '2rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                  <label className="admin-checkbox">
                    <input type="checkbox" checked={newProduct.on_sale}
                      onChange={e => setNewProduct({...newProduct, on_sale: e.target.checked})} />
                    En Solde / Promotion
                  </label>
                  
                  {newProduct.on_sale && (
                    <div className="form-group" style={{ flex: 1, margin: 0 }}>
                      <label style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Prix Soldé (€) *</label>
                      <input className="admin-input" type="number" value={newProduct.sale_price}
                        onChange={e => setNewProduct({...newProduct, sale_price: e.target.value})} />
                    </div>
                  )}
                </div>

                <label className="admin-checkbox">
                  <input type="checkbox" checked={newProduct.is_featured}
                    onChange={e => setNewProduct({...newProduct, is_featured: e.target.checked})} />
                  Mettre en avant sur la Home (Featured)
                </label>
                <button className="btn btn-primary" onClick={createProduct} disabled={uploading}>
                  {uploading ? "Veuillez patienter..." : "Créer le produit"}
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
          {products.map(product => (
            <motion.div
              key={product.id}
              className="product-admin-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="product-admin-card__header">
                <div className="product-admin-card__info-group">
                  {product.image_url && (
                    <div className="product-admin-card__image-wrap">
                      <img src={product.image_url} alt={product.name} className="product-admin-card__image" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-serif">{product.name}</h3>
                    <p className="admin-table__sub">{product.description}</p>
                    <div className="product-admin-card__meta">
                      <span className={`badge badge--${product.category}`}>
                        {product.category === 'wig' ? '👜 Perruque' : '🧴 Entretien'}
                      </span>
                      {product.on_sale ? (
                        <span className="product-admin-card__price">
                          <span style={{ textDecoration: 'line-through', opacity: 0.5, marginRight: '8px', fontSize: '0.85em' }}>
                            {product.base_price} €
                          </span>
                          <span style={{ color: 'var(--gold)' }}>
                            {product.sale_price} €
                          </span>
                        </span>
                      ) : (
                        <span className="product-admin-card__price">{product.base_price} €</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="product-admin-card__actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    className={`admin-toggle ${product.is_new ? 'active' : ''}`}
                    onClick={() => toggleNew(product)}
                  >
                    ✨ {product.is_new ? 'Nouveau' : 'Standard'}
                  </button>
                  <button
                    className={`admin-toggle ${product.is_bestseller ? 'active' : ''}`}
                    onClick={() => toggleBestseller(product)}
                  >
                    🔥 {product.is_bestseller ? 'Bestseller' : 'Standard'}
                  </button>
                  <button
                    className={`admin-toggle ${product.on_sale ? 'active' : ''}`}
                    onClick={() => toggleOnSale(product)}
                  >
                    🏷️ {product.on_sale ? 'En solde' : 'Non soldé'}
                  </button>
                  <button
                    className={`admin-toggle ${product.is_featured ? 'active' : ''}`}
                    onClick={() => toggleFeatured(product)}
                    title="Mettre en avant"
                  >
                    ⭐ {product.is_featured ? 'Featured' : 'Normal'}
                  </button>
                  <button
                    className={`admin-toggle ${product.is_active ? 'active' : ''}`}
                    onClick={() => toggleActive(product)}
                  >
                    {product.is_active ? '✓ Actif' : '✗ Inactif'}
                  </button>
                </div>
              </div>

              {/* Variants & Stock */}
              <div className="product-variants">
                <h4>Stock par variante</h4>
                <table className="admin-table variants-table">
                  <thead>
                    <tr>
                      <th>Longueur</th>
                      <th>Densité</th>
                      <th>Type bonnet</th>
                      <th>Prix additionnel</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(product.variants || []).map(variant => (
                      <tr key={variant.id}>
                        <td>{variant.length || '—'}</td>
                        <td>{variant.density || '—'}</td>
                        <td>{variant.cap_type || '—'}</td>
                        <td>+ {variant.price_modifier} €</td>
                        <td>
                          <div className="stock-input-wrap">
                            <input
                              type="number"
                              min="0"
                              defaultValue={variant.stock_quantity}
                              className={`stock-input ${variant.stock_quantity < 5 ? 'low-stock' : ''}`}
                              onBlur={e => updateStock(product.id, variant.id, e.target.value)}
                            />
                            {variant.stock_quantity < 5 && (
                              <span className="stock-warning">⚠️ Faible</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
