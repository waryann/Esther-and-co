import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    // Load initial cart from local storage
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('esther_cart');
      if (savedCart) {
        try {
          return JSON.parse(savedCart);
        } catch (e) {
          console.error("Error parsing cart data", e);
        }
      }
    }
    return [];
  });

  // Save to local storage whenever cart changes
  useEffect(() => {
    localStorage.setItem('esther_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, quantity = 1, variant = null, finalPrice = 0) => {
    setCart(prevCart => {
      // Create a unique key for the item (product ID + variant traits)
      const variantKey = variant 
        ? `${product.id}-${variant.length || 'any'}-${variant.density || 'any'}-${variant.cap_type || 'any'}`
        : `${product.id}-default`;

      const existingItemIndex = prevCart.findIndex(item => item.variantKey === variantKey);

      if (existingItemIndex >= 0) {
        // Item exists, update quantity
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + quantity
        };
        return updatedCart;
      } else {
        // New item
        return [...prevCart, {
          product,
          variant,
          variantKey,
          quantity,
          price: finalPrice || product.base_price
        }];
      }
    });
  };

  const removeFromCart = (variantKey) => {
    setCart(prevCart => prevCart.filter(item => item.variantKey !== variantKey));
  };

  const updateQuantity = (variantKey, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(variantKey);
      return;
    }
    
    setCart(prevCart => prevCart.map(item => 
      item.variantKey === variantKey 
        ? { ...item, quantity: newQuantity } 
        : item
    ));
  };

  const getCartCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };
  
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      getCartCount,
      getCartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
