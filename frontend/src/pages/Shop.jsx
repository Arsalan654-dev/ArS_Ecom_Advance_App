// frontend/src/pages/Shop.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../config/api";
import { MdSearch, MdFilterList, MdStar, MdLocationOn, MdAccessTime } from "react-icons/md";

const Shop = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ cuisine: "", rating: "" });
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    fetchRestaurants();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.log("Location denied")
      );
    }
  };

  const fetchRestaurants = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/restaurants`, { withCredentials: true });
      setRestaurants(res.data.restaurants || []);
    } catch (error) {
      toast.error("Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch = r.businessName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCuisine = !filters.cuisine || r.cuisines?.includes(filters.cuisine);
    return matchesSearch && matchesCuisine;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Restaurants Near You
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Discover the best food in your area
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search restaurants by name, cuisine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <select
          value={filters.cuisine}
          onChange={(e) => setFilters({ ...filters, cuisine: e.target.value })}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <option value="">All Cuisines</option>
          <option value="Pakistani">Pakistani</option>
          <option value="Chinese">Chinese</option>
          <option value="Italian">Italian</option>
          <option value="Fast Food">Fast Food</option>
        </select>
      </div>

      {/* Restaurants Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : filteredRestaurants.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No restaurants found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant) => (
            <div
              key={restaurant._id}
              onClick={() => navigate(`/restaurant/${restaurant._id}`)}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition cursor-pointer"
            >
              <div className="h-48 overflow-hidden">
                <img
                  src={restaurant.bannerImages?.[0]?.url || "/api/placeholder/400/300"}
                  alt={restaurant.businessName}
                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{restaurant.businessName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center">
                    <MdStar className="text-yellow-500" size={16} />
                    <span className="text-sm ml-1">{restaurant.avgRating || "New"}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-500">{restaurant.cuisines?.join(", ")}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <MdLocationOn size={14} />
                  <span className="truncate">{restaurant.mainAddress?.city}, {restaurant.mainAddress?.state}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <MdAccessTime size={14} />
                  <span>{restaurant.deliveryTime || "30-45"} mins</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Shop;