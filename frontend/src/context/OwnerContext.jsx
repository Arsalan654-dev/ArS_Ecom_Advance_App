// frontend/src/context/OwnerContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import  axiosInstance  from "../config/api";

const OwnerContext = createContext(null);

export const useOwner = () => {
  const ctx = useContext(OwnerContext);
  if (!ctx) throw new Error("useOwner must be used inside OwnerProvider");
  return ctx;
};

export const OwnerProvider = ({ children }) => {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(false);

  const fetchRestaurant = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const userRaw = localStorage.getItem("user");
      const user = userRaw ? JSON.parse(userRaw) : null;
      
      // ✅ ONLY fetch restaurant if user is owner
      if (!token || token === 'undefined' || token === 'null' || user?.role !== 'owner') {
        setLoading(false);
        setRestaurant(null);
        return;
      }
      
      const res = await axiosInstance.get('/api/restaurant');
      setRestaurant(res.data.restaurant);
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setRestaurant(null);
        setError(null);
      } else if (err.response?.status !== 403 && err.response?.status !== 401) {
        setError(err.response?.data?.error || "Failed to load restaurant");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant, refresh]);

  const refetch = useCallback(() => {
    setRefresh(prev => !prev);
  }, []);

  return (
    <OwnerContext.Provider value={{ restaurant, loading, error, refetch }}>
      {children}
    </OwnerContext.Provider>
  );
};