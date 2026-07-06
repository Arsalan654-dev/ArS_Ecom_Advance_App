import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL from "../config/api";
import { MdStar, MdLocationOn, MdAccessTime, MdTrendingUp, MdLocalOffer, MdRestaurant } from "react-icons/md";

const HomePage = () => {
  const navigate = useNavigate();
  const [topRestaurants, setTopRestaurants] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [restRes, foodRes] = await Promise.all([
        axios.get(`${API_URL}/api/restaurants?limit=6&page=1`, { withCredentials: true }),
        axios.get(`${API_URL}/api/search?limit=8`, { withCredentials: true })
      ]);
      setTopRestaurants(restRes.data.restaurants || []);
      setFoodItems(foodRes.data.items || []);
    } catch (error) {
      console.error("Homepage data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero Banner */}
      <div className="relative h-[400px] md:h-[500px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-900/90 via-violet-800/70 to-violet-900/90 z-10" />
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&h=900&fit=crop"
          alt="Food Banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="text-center text-white max-w-3xl px-4">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight">
              Delicious Food <span className="text-yellow-400">Delivered</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8">
              Order from the best restaurants near you
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => navigate("/restaurants")}
                className="px-8 py-3 bg-white text-violet-700 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-lg"
              >
                Browse Restaurants
              </button>
              <button
                onClick={() => navigate("/food-items")}
                className="px-8 py-3 bg-yellow-500 text-gray-900 rounded-full font-bold text-lg hover:bg-yellow-400 transition shadow-lg"
              >
                View Food Items
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
        {/* Top Restaurants */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <MdTrendingUp className="text-violet-600" />
                Top Restaurants
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Most popular restaurants near you</p>
            </div>
            <button
              onClick={() => navigate("/restaurants")}
              className="text-violet-600 hover:text-violet-700 font-medium text-sm"
            >
              View All →
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topRestaurants.map(r => (
                <div
                  key={r._id}
                  onClick={() => navigate(`/restaurant/${r._id}`)}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition cursor-pointer group"
                >
                  <div className="h-48 overflow-hidden">
                    <img
                      src={r.bannerImages?.[0]?.url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop"}
                      alt={r.businessName}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{r.businessName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center">
                        <MdStar className="text-yellow-500" size={16} />
                        <span className="text-sm ml-1">{r.avgRating || "New"}</span>
                      </div>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-500">{r.cuisines?.join(", ")}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <MdLocationOn size={14} />
                      <span className="truncate">{r.mainAddress?.city}, {r.mainAddress?.state}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <MdAccessTime size={14} />
                      <span>{r.deliveryTime || "30-45"} mins</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Food Items */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <MdRestaurant className="text-violet-600" />
                Popular Food Items
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Discover delicious meals</p>
            </div>
            <button
              onClick={() => navigate("/food-items")}
              className="text-violet-600 hover:text-violet-700 font-medium text-sm"
            >
              View All →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {foodItems.map(item => (
              <div
                key={item._id}
                onClick={() => navigate(`/food-item/${item._id}`)}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition cursor-pointer group"
              >
                <div className="h-40 overflow-hidden">
                  <img
                    src={item.images?.[0]?.url || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=200&fit=crop"}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{item.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{item.restaurant?.businessName}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-lg font-bold text-violet-600">₨ {item.price}</span>
                    <span className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full">
                      {item.dietary}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sale Banner */}
        <section className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-600" />
          <div className="relative z-10 px-8 py-12 md:py-16 text-center text-white">
            <MdLocalOffer size={48} className="mx-auto mb-4 opacity-80" />
            <h2 className="text-3xl md:text-4xl font-extrabold mb-2">Special Offers & Promotions</h2>
            <p className="text-lg text-yellow-100 mb-6">Get amazing discounts on your favorite meals</p>
            <button
              onClick={() => navigate("/restaurants")}
              className="px-8 py-3 bg-white text-orange-600 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-lg"
            >
              Order Now
            </button>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center py-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
            Ready to eat?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Sign in to order your favorite food</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate("/signin")}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold transition"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="px-6 py-2.5 border border-violet-600 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg font-semibold transition"
            >
              Create Account
            </button>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p className="font-bold text-lg text-violet-600">Vingo Food Delivery</p>
          <p className="mt-2">Delivering happiness to your doorstep</p>
          <p className="mt-4">© 2026 Vingo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
