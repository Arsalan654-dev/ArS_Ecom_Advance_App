// frontend/src/context/CartContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import API_URL from "../config/api";

const CartContext = createContext(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("user");
    const user = userRaw ? JSON.parse(userRaw) : null;
    
    // Only fetch cart for customer role
    if (!token || user?.role !== "user") {
      setCartCount(0);
      setCartItems([]);
      setRestaurantId(null);
      setLoading(false);
      return;
    }
    
    try {
      const res = await axios.get(`${API_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      
      console.log("Cart API response:", res.data); // Debug log
      
      const cartData = res.data.cart;
      const items = cartData?.items || [];
      setCartItems(items);
      const count = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      setCartCount(count);
      setRestaurantId(cartData?.restaurantId || null);
      
      console.log("RestaurantId set to:", cartData?.restaurantId); // Debug log
      
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      setCartCount(0);
      setCartItems([]);
      setRestaurantId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = async (foodItemId, quantity = 1) => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/signin";
      return false;
    }
    
    try {
      await axios.post(
        `${API_URL}/api/cart`,
        { foodItem: foodItemId, quantity },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      await fetchCart(); // Refresh cart after adding
      return true;
    } catch (error) {
      console.error("Failed to add to cart:", error);
      return false;
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    const token = localStorage.getItem("token");
    try {
      if (quantity <= 0) {
        await axios.delete(`${API_URL}/api/cart/${itemId}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
      } else {
        await axios.put(
          `${API_URL}/api/cart/${itemId}`,
          { quantity },
          { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
        );
      }
      await fetchCart();
      return true;
    } catch (error) {
      console.error("Failed to update cart:", error);
      return false;
    }
  };

  const clearCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    try {
      await axios.delete(`${API_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setCartCount(0);
      setCartItems([]);
      setRestaurantId(null);
    } catch (error) {
      console.error("Failed to clear cart:", error);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return (
    <CartContext.Provider
      value={{
        cartCount,
        cartItems,
        restaurantId,
        loading,
        fetchCart,
        addToCart,
        updateCartItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};