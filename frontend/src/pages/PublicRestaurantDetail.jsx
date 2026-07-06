import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../config/api";
import { useCart } from "../context/CartContext";
import { MdStar, MdLocationOn, MdAccessTime, MdAdd, MdRemove, MdArrowBack, MdFavorite, MdFavoriteBorder, MdShoppingCart } from "react-icons/md";

const PublicRestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);

  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      const [restRes, menuRes] = await Promise.all([
        axios.get(`${API_URL}/api/restaurants/${id}`, { withCredentials: true }),
        axios.get(`${API_URL}/api/restaurants/${id}/menu`, { withCredentials: true }),
      ]);
      setRestaurant(restRes.data.restaurant);
      const items = menuRes.data.items || [];
      setMenu(items);
      const cats = [...new Set(items.map(i => i.category?.name).filter(Boolean))];
      setCategories(cats);
      if (cats.length) setSelectedCategory(cats[0]);
    } catch (error) {
      toast.error("Failed to load restaurant");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (itemId, name) => {
    if (!isLoggedIn) {
      toast.info("Please login to add items to cart");
      navigate("/signin");
      return;
    }
    const ok = await addToCart(itemId, 1);
    if (ok) {
      setQuantities(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
      toast.success(`${name} added to cart!`);
    } else {
      toast.error("Failed to add to cart");
    }
  };

  const filteredMenu = menu.filter(i => i.category?.name === selectedCategory);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-8 w-64 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">Restaurant not found</p>
        <button onClick={() => navigate("/restaurants")} className="mt-4 px-6 py-2 bg-violet-600 text-white rounded-lg">
          Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <MdArrowBack size={20} /> Back
      </button>

      {/* Header */}
      <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-6">
        <img
          src={restaurant.bannerImages?.[0]?.url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop"}
          alt={restaurant.businessName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 text-white">
          <h1 className="text-3xl font-bold">{restaurant.businessName}</h1>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <div className="flex items-center gap-1">
              <MdStar className="text-yellow-500" />
              <span>{restaurant.avgRating || "New"}</span>
            </div>
            <div className="flex items-center gap-1">
              <MdLocationOn size={16} />
              <span>{restaurant.mainAddress?.city}, {restaurant.mainAddress?.state}</span>
            </div>
            <div className="flex items-center gap-1">
              <MdAccessTime size={16} />
              <span>{restaurant.deliveryTime || "30-45"} min</span>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-200 max-w-2xl">{restaurant.description}</p>
        </div>
      </div>

      {/* Category Tabs */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {categories.map(cat => (
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
        {filteredMenu.map(item => (
          <div key={item._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex gap-4 hover:shadow-md transition">
            {item.images?.[0] && (
              <img src={item.images[0].url} alt={item.name} className="w-20 h-20 rounded-lg object-cover" />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description || "Delicious food item"}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-lg font-bold text-violet-600">₨ {item.price}</span>
                <button
                  onClick={() => handleAddToCart(item._id, item.name)}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-1"
                >
                  <MdShoppingCart size={14} /> Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMenu.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No items in this category</p>
        </div>
      )}

      {!isLoggedIn && menu.length > 0 && (
        <p className="text-sm text-gray-400 text-center mt-6">
          <button onClick={() => navigate("/signin")} className="text-violet-600 hover:underline">Sign in</button> to add items to cart
        </p>
      )}
    </div>
  );
};

export default PublicRestaurantDetail;
