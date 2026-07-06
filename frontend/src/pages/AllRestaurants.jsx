import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL from "../config/api";
import { MdSearch, MdStar, MdLocationOn, MdAccessTime, MdChevronLeft, MdChevronRight } from "react-icons/md";

const AllRestaurants = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });

  useEffect(() => {
    fetchRestaurants();
  }, [pagination.currentPage]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (cuisine) params.append("cuisine", cuisine);
      params.append("page", pagination.currentPage);
      params.append("limit", "12");

      const res = await axios.get(`${API_URL}/api/restaurants?${params}`, { withCredentials: true });
      setRestaurants(res.data.restaurants || []);
      setPagination(prev => ({
        ...prev,
        totalPages: res.data.pagination?.totalPages || 1,
        totalItems: res.data.pagination?.totalItems || 0
      }));
    } catch (error) {
      console.error("Failed to load restaurants:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchRestaurants();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">All Restaurants</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Find the best restaurants near you</p>
      </div>

      {/* Search & Filters */}
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 mb-8">
        <div className="flex-1 relative">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search restaurants by name or cuisine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <select
          value={cuisine}
          onChange={(e) => setCuisine(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <option value="">All Cuisines</option>
          <option value="Pakistani">Pakistani</option>
          <option value="Chinese">Chinese</option>
          <option value="Italian">Italian</option>
          <option value="Fast Food">Fast Food</option>
          <option value="Arabic">Arabic</option>
          <option value="Desserts">Desserts</option>
        </select>
        <button
          type="submit"
          className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition"
        >
          Search
        </button>
      </form>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No restaurants found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{pagination.totalItems} restaurants found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map(r => (
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
                    <MdStar className="text-yellow-500" size={16} />
                    <span className="text-sm ml-1">{r.avgRating || "New"}</span>
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

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={pagination.currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <MdChevronLeft size={20} />
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: p }))}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                    pagination.currentPage === p
                      ? "bg-violet-600 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={pagination.currentPage === pagination.totalPages}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <MdChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AllRestaurants;
