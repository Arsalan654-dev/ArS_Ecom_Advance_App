import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../config/api";

export const useOwnerData = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  // Fetch Restaurant
  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/api/restaurant`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setRestaurant(res.data.restaurant);
        setError(null);
      } catch (err) {
        if (err.response?.status !== 404) {
          setError(err.response?.data?.error || "Failed to load restaurant");
        }
        setRestaurant(null);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, [refetchTrigger]);

  return { restaurant, loading, error, refetch };
};

// Hook for Dashboard Metrics
export const useDashboardMetrics = () => {
  const [metrics, setMetrics] = useState({
    todayOrders: 0,
    pendingOrders: 0,
    todayRevenue: 0,
    averageRating: 0,
    totalRatings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/metrics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setMetrics(res.data.metrics);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refetch: fetchMetrics };
};

// Hook for Earnings Report
export const useEarningsReport = (period = "daily", year = null, month = null) => {
  const [earningsData, setEarningsData] = useState([]);
  const [summary, setSummary] = useState({
    totalEarnings: 0,
    totalDiscount: 0,
    orderCount: 0,
    averageOrderValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const params = new URLSearchParams({ period });
        if (period === "daily" && month) params.append("month", month);
        if (year) params.append("year", year);

        const res = await axios.get(`${API_URL}/api/metrics/earnings?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setEarningsData(res.data.data || []);
        setSummary(res.data.summary);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load earnings");
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, [period, year, month]);

  return { earningsData, summary, loading, error };
};

// Hook for Sentiment Analysis
export const useSentimentAnalysis = () => {
  const [sentiment, setSentiment] = useState({
    positive: 0,
    neutral: 0,
    negative: 0,
    totalReviews: 0,
  });
  const [topPositiveReviews, setTopPositiveReviews] = useState([]);
  const [topNegativeReviews, setTopNegativeReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSentiment = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/api/metrics/sentiment`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setSentiment(res.data.sentiment);
        setTopPositiveReviews(res.data.topPositiveReviews || []);
        setTopNegativeReviews(res.data.topNegativeReviews || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load sentiment");
      } finally {
        setLoading(false);
      }
    };
    fetchSentiment();
  }, []);

  return { sentiment, topPositiveReviews, topNegativeReviews, loading, error };
};

// Hook for Orders
export const useOrders = (initialFilters = {}) => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...(filters.status && { status: filters.status }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.customerName && { customerName: filters.customerName }),
      });

      const res = await axios.get(`${API_URL}/api/order?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setOrders(res.data.orders || []);
      setPagination(res.data.pagination);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.itemsPerPage, filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_URL}/api/order/${orderId}/status`,
        { newStatus },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders(); // Refresh list
      return res.data.order;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update status");
      throw err;
    }
  }, [fetchOrders]);

  const goToPage = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  return {
    orders,
    pagination,
    loading,
    error,
    filters,
    setFilters,
    updateOrderStatus,
    goToPage,
    refetch: fetchOrders,
  };
};

// Hook for Food Categories
export const useFoodCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/food-item/category`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setCategories(res.data.categories || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = useCallback(async (name) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/api/food-item/category`,
        { name },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      toast.success("Category created successfully");
      await fetchCategories();
      return res.data.category;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create category");
      throw err;
    }
  }, [fetchCategories]);

  const updateCategory = useCallback(async (categoryId, data) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_URL}/api/food-item/category/${categoryId}`,
        data,
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      toast.success("Category updated successfully");
      await fetchCategories();
      return res.data.category;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update category");
      throw err;
    }
  }, [fetchCategories]);

  const deleteCategory = useCallback(async (categoryId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/food-item/category/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      toast.success("Category deleted successfully");
      await fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete category");
      throw err;
    }
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
};

// Hook for Food Items (Menu)
export const useFoodItems = (initialFilters = {}) => {
  const [foodItems, setFoodItems] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchFoodItems = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.isAvailable && { isAvailable: filters.isAvailable }),
        ...(filters.search && { search: filters.search }),
        sort: "-createdAt",
      });

      const res = await axios.get(`${API_URL}/api/food-item?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setFoodItems(res.data.foodItems || []);
      setPagination(res.data.pagination);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load food items");
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.itemsPerPage, filters]);

  useEffect(() => {
    fetchFoodItems();
  }, [fetchFoodItems]);

  const createFoodItem = useCallback(async (data) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/api/food-item`,
        data,
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      toast.success("Food item created successfully");
      await fetchFoodItems();
      return res.data.foodItem;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create food item");
      throw err;
    }
  }, [fetchFoodItems]);

  const updateFoodItem = useCallback(async (itemId, data) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_URL}/api/food-item/${itemId}`,
        data,
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      toast.success("Food item updated successfully");
      await fetchFoodItems();
      return res.data.foodItem;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update food item");
      throw err;
    }
  }, [fetchFoodItems]);

  const deleteFoodItem = useCallback(async (itemId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/food-item/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      toast.success("Food item deleted successfully");
      await fetchFoodItems();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete food item");
      throw err;
    }
  }, [fetchFoodItems]);

  const uploadFoodImages = useCallback(async (itemId, files) => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      files.forEach(file => formData.append("images", file));

      const res = await axios.post(
        `${API_URL}/api/food-item/${itemId}/images`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );
      toast.success("Images uploaded successfully");
      await fetchFoodItems();
      return res.data.foodItem;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to upload images");
      throw err;
    }
  }, [fetchFoodItems]);

  const goToPage = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  return {
    foodItems,
    pagination,
    loading,
    error,
    filters,
    setFilters,
    createFoodItem,
    updateFoodItem,
    deleteFoodItem,
    uploadFoodImages,
    goToPage,
    refetch: fetchFoodItems,
  };
};

// Hook for Delivery Zones
export const useDeliveryZones = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchZones = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/delivery-zone`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setZones(res.data.zones || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load delivery zones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const createZone = useCallback(async (data) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/api/delivery-zone`,
        data,
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      toast.success("Delivery zone created successfully");
      await fetchZones();
      return res.data.zone;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create delivery zone");
      throw err;
    }
  }, [fetchZones]);

  const updateZone = useCallback(async (zoneId, data) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_URL}/api/delivery-zone/${zoneId}`,
        data,
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      toast.success("Delivery zone updated successfully");
      await fetchZones();
      return res.data.zone;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update delivery zone");
      throw err;
    }
  }, [fetchZones]);

  const deleteZone = useCallback(async (zoneId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/delivery-zone/${zoneId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      toast.success("Delivery zone deleted successfully");
      await fetchZones();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete delivery zone");
      throw err;
    }
  }, [fetchZones]);

  return {
    zones,
    loading,
    error,
    createZone,
    updateZone,
    deleteZone,
    refetch: fetchZones,
  };
};

// Hook for Promo Codes
export const usePromoCodes = () => {
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPromoCodes = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/promo-code`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setPromoCodes(res.data.promoCodes || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);

  const createPromoCode = useCallback(async (data) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/api/promo-code`,
        data,
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      toast.success("Promo code created successfully");
      await fetchPromoCodes();
      return res.data.promoCode;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create promo code");
      throw err;
    }
  }, [fetchPromoCodes]);

  const updatePromoCode = useCallback(async (codeId, data) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_URL}/api/promo-code/${codeId}`,
        data,
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      toast.success("Promo code updated successfully");
      await fetchPromoCodes();
      return res.data.promoCode;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update promo code");
      throw err;
    }
  }, [fetchPromoCodes]);

  const deletePromoCode = useCallback(async (codeId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/promo-code/${codeId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      toast.success("Promo code deleted successfully");
      await fetchPromoCodes();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete promo code");
      throw err;
    }
  }, [fetchPromoCodes]);

  return {
    promoCodes,
    loading,
    error,
    createPromoCode,
    updatePromoCode,
    deletePromoCode,
    refetch: fetchPromoCodes,
  };
};

// Default export
const useOwnerData = {
  useOwnerData,
  useDashboardMetrics,
  useEarningsReport,
  useSentimentAnalysis,
  useOrders,
  useFoodCategories,
  useFoodItems,
  useDeliveryZones,
  usePromoCodes,
};

export default useOwnerData;