// frontend/src/pages/RestaurantDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useCart } from "../context/CartContext";
import API_URL from "../config/api";
import { MdStar, MdLocationOn, MdAccessTime, MdAdd, MdRemove } from "react-icons/md";

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [cartQuantities, setCartQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const { addToCart, fetchCart, cartItems } = useCart();

  useEffect(() => {
    fetchRestaurantDetails();
    loadCartQuantities();
  }, [id]);

  const loadCartQuantities = async () => {
    await fetchCart();
    const quantities = {};
    cartItems.forEach(item => {
      if (item.foodItem?._id) {
        quantities[item.foodItem._id] = item.quantity;
      }
    });
    setCartQuantities(quantities);
  };

  const fetchRestaurantDetails = async () => {
    try {
      const [restaurantRes, menuRes] = await Promise.all([
        axios.get(`${API_URL}/api/restaurants/${id}`, { withCredentials: true }),
        axios.get(`${API_URL}/api/restaurants/${id}/menu`, { withCredentials: true }),
      ]);
      setRestaurant(restaurantRes.data.restaurant);
      setMenu(menuRes.data.items || []);
      const uniqueCategories = [...new Set(menuRes.data.items?.map(item => item.category?.name))];
      setCategories(uniqueCategories);
      if (uniqueCategories.length) setSelectedCategory(uniqueCategories[0]);
    } catch (error) {
      console.error("Failed to load restaurant:", error);
      toast.error("Failed to load restaurant");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCart = async (itemId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    const token = localStorage.getItem("token");
    
    if (!token) {
      toast.error("Please login to add items to cart");
      navigate("/signin");
      return;
    }

    try {
      if (newQuantity <= 0) {
        // Remove from cart
        await axios.delete(`${API_URL}/api/cart/${itemId}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setCartQuantities(prev => ({ ...prev, [itemId]: 0 }));
        toast.success("Removed from cart");
      } else {
        // Add or update cart
        await axios.post(
          `${API_URL}/api/cart`,
          { foodItem: itemId, quantity: change },
          { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
        );
        setCartQuantities(prev => ({ ...prev, [itemId]: newQuantity }));
        if (change > 0) toast.success("Added to cart!");
      }
      await fetchCart(); // Refresh cart context
    } catch (error) {
      console.error("Cart update error:", error);
      toast.error(error.response?.data?.error || "Failed to update cart");
    }
  };

  const filteredMenu = menu.filter(item => item.category?.name === selectedCategory);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-12 w-64 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Restaurant not found</p>
        <button
          onClick={() => navigate("/shop")}
          className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg"
        >
          Back to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Restaurant Header */}
      <div className="relative h-64 md:h-80 rounded-xl overflow-hidden">
        <img
          src={restaurant?.bannerImages?.[0]?.url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop"}
          alt={restaurant?.businessName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 text-white">
          <h1 className="text-3xl font-bold">{restaurant?.businessName}</h1>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <div className="flex items-center gap-1">
              <MdStar className="text-yellow-500" />
              <span>{restaurant?.avgRating || "New"}</span>
            </div>
            <div className="flex items-center gap-1">
              <MdLocationOn size={16} />
              <span>{restaurant?.mainAddress?.city}, {restaurant?.mainAddress?.state}</span>
            </div>
            <div className="flex items-center gap-1">
              <MdAccessTime size={16} />
              <span>{restaurant?.deliveryTime || "30-45"} min</span>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-200 max-w-2xl">{restaurant?.description}</p>
        </div>
      </div>

      {/* Category Tabs */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? "bg-violet-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Menu Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMenu.map((item) => {
          const quantity = cartQuantities[item._id] || 0;
          return (
            <div key={item._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex gap-4 hover:shadow-md transition">
              {item.images?.[0] && (
                <img src={item.images[0].url} alt={item.name} className="w-20 h-20 rounded-lg object-cover" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description || "Delicious food item"}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-lg font-bold text-violet-600">₨ {item.price}</span>
                  <div className="flex items-center gap-2">
                    {quantity > 0 ? (
                      <div className="flex items-center gap-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                        <button
                          onClick={() => handleUpdateCart(item._id, quantity, -1)}
                          className="p-1.5 hover:bg-violet-200 rounded-l-lg transition"
                        >
                          <MdRemove size={16} />
                        </button>
                        <span className="w-6 text-center font-medium">{quantity}</span>
                        <button
                          onClick={() => handleUpdateCart(item._id, quantity, 1)}
                          className="p-1.5 hover:bg-violet-200 rounded-r-lg transition"
                        >
                          <MdAdd size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUpdateCart(item._id, 0, 1)}
                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition"
                      >
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMenu.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No items in this category</p>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetail;