import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL from "../config/api";
import { MdSearch, MdChevronLeft, MdChevronRight, MdRestaurant, MdStar } from "react-icons/md";

const AllFoodItems = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [dietary, setDietary] = useState("");

  useEffect(() => {
    fetchItems();
  }, [pagination.currentPage]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("q", search);
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);
      if (dietary) params.append("dietary", dietary);
      params.append("page", pagination.currentPage);
      params.append("limit", "12");

      const res = await axios.get(`${API_URL}/api/search?${params}`, { withCredentials: true });
      setItems(res.data.items || []);
      setPagination(prev => ({
        ...prev,
        totalPages: res.data.pagination?.totalPages || 1,
        totalItems: res.data.pagination?.totalItems || 0
      }));
    } catch (error) {
      console.error("Failed to load food items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchItems();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">Food Items</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Discover delicious meals from top restaurants</p>
      </div>

      {/* Search & Filters */}
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 mb-8">
        <div className="flex-1 relative">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search food items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <input
          type="number"
          placeholder="Min price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="w-28 px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
        />
        <input
          type="number"
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="w-28 px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
        />
        <select
          value={dietary}
          onChange={(e) => setDietary(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <option value="">All</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="non-vegetarian">Non-Vegetarian</option>
          <option value="vegan">Vegan</option>
          <option value="gluten-free">Gluten Free</option>
        </select>
        <button
          type="submit"
          className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition"
        >
          Search
        </button>
      </form>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="h-64 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <MdRestaurant size={64} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">No food items found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{pagination.totalItems} items found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map(item => (
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
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{item.name}</h3>
                  <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                    <MdStar size={12} className="text-yellow-500" />
                    {item.restaurant?.businessName}
                  </p>
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

export default AllFoodItems;
