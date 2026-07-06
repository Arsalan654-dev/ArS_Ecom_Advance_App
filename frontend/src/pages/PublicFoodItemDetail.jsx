import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../config/api";
import { useCart } from "../context/CartContext";
import { MdStar, MdShoppingCart, MdFavorite, MdFavoriteBorder, MdArrowBack } from "react-icons/md";

const PublicFoodItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [foodItem, setFoodItem] = useState(null);
  const [relatedItems, setRelatedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);

  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    fetchFoodItem();
  }, [id]);

  const fetchFoodItem = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/food-items/${id}`, { withCredentials: true });
      setFoodItem(res.data.foodItem);
      setRelatedItems(res.data.relatedItems || []);
    } catch (error) {
      toast.error("Failed to load food item");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      toast.info("Please login to add items to cart");
      navigate("/signin");
      return;
    }
    const ok = await addToCart(id, 1);
    if (ok) {
      setAddedToCart(true);
      toast.success("Added to cart!");
    } else {
      toast.error("Failed to add to cart");
    }
  };

  const handleToggleWishlist = async () => {
    if (!isLoggedIn) {
      toast.info("Please login to add to wishlist");
      navigate("/signin");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (inWishlist) {
        await axios.delete(`${API_URL}/api/wishlist/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        setInWishlist(false);
        toast.success("Removed from wishlist");
      } else {
        await axios.post(`${API_URL}/api/wishlist`,
          { foodItem: id },
          { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
        );
        setInWishlist(true);
        toast.success("Added to wishlist!");
      }
    } catch (error) {
      toast.error("Failed to update wishlist");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="h-80 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse mb-4" />
        <div className="h-8 w-64 rounded bg-gray-200 dark:bg-gray-800 animate-pulse mb-2" />
        <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  if (!foodItem) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">Food item not found</p>
        <button onClick={() => navigate("/food-items")} className="mt-4 px-6 py-2 bg-violet-600 text-white rounded-lg">
          Browse Food Items
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <MdArrowBack size={20} /> Back
      </button>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="h-80 overflow-hidden">
          <img
            src={foodItem.images?.[0]?.url || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=400&fit=crop"}
            alt={foodItem.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{foodItem.name}</h1>
              <p className="text-gray-500 mt-1">{foodItem.restaurant?.businessName}</p>
            </div>
            <span className="text-3xl font-bold text-violet-600">₨ {foodItem.price}</span>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full">
              <MdStar className="text-yellow-500" size={18} />
              <span className="font-medium">{foodItem.restaurant?.avgRating || "New"}</span>
            </div>
            <span className="text-sm px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full">
              {foodItem.dietary}
            </span>
            <span className="text-sm text-gray-500">{foodItem.category?.name}</span>
          </div>

          {foodItem.description && (
            <p className="mt-4 text-gray-600 dark:text-gray-400">{foodItem.description}</p>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition"
            >
              <MdShoppingCart size={20} />
              {addedToCart ? "Added ✓" : "Add to Cart"}
            </button>
            <button
              onClick={handleToggleWishlist}
              className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              {inWishlist ? <MdFavorite className="text-red-500" size={22} /> : <MdFavoriteBorder size={22} />}
            </button>
          </div>

          {!isLoggedIn && (
            <p className="text-sm text-gray-400 mt-3 text-center">
              <button onClick={() => navigate("/signin")} className="text-violet-600 hover:underline">Sign in</button> to add to cart or wishlist
            </p>
          )}
        </div>
      </div>

      {/* Related Items */}
      {relatedItems.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Related Items</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {relatedItems.map(item => (
              <div
                key={item._id}
                onClick={() => navigate(`/food-item/${item._id}`)}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 cursor-pointer hover:shadow-md transition"
              >
                <img
                  src={item.images?.[0]?.url || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=150&fit=crop"}
                  alt={item.name}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <p className="font-medium text-sm mt-2 truncate">{item.name}</p>
                <p className="text-violet-600 font-bold text-sm">₨ {item.price}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicFoodItemDetail;
