// frontend/src/pages/Wishlist.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../config/api";
import { MdFavorite, MdFavoriteBorder, MdDelete } from "react-icons/md";

const Wishlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setItems(res.data.items || []);
    } catch (error) {
      toast.error("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (itemId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/wishlist/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      fetchWishlist();
      toast.success("Removed from wishlist");
    } catch (error) {
      toast.error("Failed to remove");
    }
  };

  if (loading) return <div className="animate-pulse">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
        My Wishlist
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <MdFavoriteBorder size={64} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Your wishlist is empty</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <img
                src={item.foodItem?.images?.[0]?.url || "/api/placeholder/300/200"}
                alt={item.foodItem?.name}
                className="w-full h-40 object-cover rounded-lg"
              />
              <h3 className="font-semibold mt-2">{item.foodItem?.name}</h3>
              <p className="text-lg font-bold text-violet-600">₨ {item.foodItem?.price}</p>
              <button
                onClick={() => removeFromWishlist(item.foodItem._id)}
                className="mt-2 text-red-500 hover:text-red-600"
              >
                <MdDelete size={20} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;