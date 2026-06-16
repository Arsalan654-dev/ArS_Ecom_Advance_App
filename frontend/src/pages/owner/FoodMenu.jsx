import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../../config/api";
import ImageUploader from "../../components/owner/ImageUploader";
import StatusBadge from "../../components/owner/StatusBadge";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdFastfood,
  MdClose,
  MdSearch,
  MdFilterList,
} from "react-icons/md";

const FoodMenu = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    dietary: "vegetarian",
    isAvailable: true,
    images: [],
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filters, setFilters] = useState({
    categoryId: "",
    isAvailable: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  useEffect(() => {
    fetchCategories();
    fetchFoodItems();
  }, [filters, pagination.currentPage]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/food-item/category`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setCategories(res.data.categories || []);
    } catch (error) {
      console.error("Failed to load categories");
    }
  };

  const fetchFoodItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: 10,
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.isAvailable && { isAvailable: filters.isAvailable }),
        sort: "-createdAt",
      });
      
      const res = await axios.get(`${API_URL}/api/food-item?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      
      setFoodItems(res.data.foodItems || []);
      setPagination(res.data.pagination);
    } catch (error) {
      toast.error("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file) => {
    const token = localStorage.getItem("token");
    const formDataImg = new FormData();
    formDataImg.append("images", file);

    const res = await axios.post(
      `${API_URL}/api/food-item/${editingItem?._id || formData._id}/images`,
      formDataImg,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      }
    );
    
    return res.data.foodItem;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.categoryId) {
      toast.error("Name, price, and category are required");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      
      if (editingItem) {
        await axios.put(
          `${API_URL}/api/food-item/${editingItem._id}`,
          {
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            categoryId: formData.categoryId,
            dietary: formData.dietary,
            isAvailable: formData.isAvailable,
          },
          { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
        );
        toast.success("Food item updated successfully");
      } else {
        const res = await axios.post(
          `${API_URL}/api/food-item`,
          {
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            categoryId: formData.categoryId,
            dietary: formData.dietary,
          },
          { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
        );
        
        if (formData.images.length > 0) {
          // Handle image uploads for new item
          for (const img of formData.images) {
            await handleImageUpload(img);
          }
        }
        
        toast.success("Food item created successfully");
      }
      
      resetModal();
      fetchFoodItems();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save food item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}" from menu?`)) return;

    setDeletingId(item._id);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/food-item/${item._id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      toast.success("Food item deleted successfully");
      fetchFoodItems();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete item");
    } finally {
      setDeletingId(null);
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      categoryId: "",
      dietary: "vegetarian",
      isAvailable: true,
      images: [],
    });
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price,
      categoryId: item.category?._id || item.category,
      dietary: item.dietary,
      isAvailable: item.isAvailable,
      images: item.images || [],
    });
    setShowModal(true);
  };

  const dietaryOptions = [
    { value: "vegetarian", label: "Vegetarian", color: "bg-green-100 text-green-700" },
    { value: "non-vegetarian", label: "Non-Vegetarian", color: "bg-red-100 text-red-700" },
    { value: "vegan", label: "Vegan", color: "bg-emerald-100 text-emerald-700" },
    { value: "gluten-free", label: "Gluten Free", color: "bg-yellow-100 text-yellow-700" },
  ];

  const getDietaryBadge = (dietary) => {
    const option = dietaryOptions.find(opt => opt.value === dietary);
    return option ? (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${option.color}`}>
        {option.label}
      </span>
    ) : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Food Menu
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Manage your restaurant's food items
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition"
        >
          <MdAdd size={20} /> Add Food Item
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Search</label>
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by name..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Category</label>
            <select
              value={filters.categoryId}
              onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Availability</label>
            <select
              value={filters.isAvailable}
              onChange={(e) => setFilters({ ...filters, isAvailable: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">All</option>
              <option value="true">Available</option>
              <option value="false">Unavailable</option>
            </select>
          </div>
          <button
            onClick={() => setFilters({ categoryId: "", isAvailable: "", search: "" })}
            className="px-4 py-2 text-gray-600 hover:text-violet-600 text-sm font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Food Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : foodItems.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <MdFastfood size={48} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No food items yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add your first menu item to get started.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition"
          >
            <MdAdd size={18} /> Add Food Item
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {foodItems.map((item) => (
              <div
                key={item._id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden hover:shadow-md transition"
              >
                {item.images && item.images[0] && (
                  <div className="h-40 overflow-hidden">
                    <img
                      src={item.images[0].url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description || "No description"}</p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                      >
                        <MdEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        disabled={deletingId === item._id}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
                      >
                        {deletingId === item._id ? (
                          <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <MdDelete size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 items-center">
                    <span className="text-lg font-bold text-violet-600">₨ {item.price}</span>
                    {getDietaryBadge(item.dietary)}
                    <StatusBadge status={item.isAvailable} type="category" />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Category: {item.category?.name || "Uncategorized"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full my-8 border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingItem ? "Edit Food Item" : "Add New Food Item"}
              </h2>
              <button onClick={resetModal} className="text-gray-500 hover:text-gray-700">
                <MdClose size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Chicken Biryani"
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price (PKR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dietary Type
                  </label>
                  <select
                    value={formData.dietary}
                    onChange={(e) => setFormData({ ...formData, dietary: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {dietaryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Describe your food item..."
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              {editingItem && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Available for ordering</span>
                </label>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 rounded-lg disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingItem ? "Update Item" : "Create Item"}
                </button>
                <button
                  type="button"
                  onClick={resetModal}
                  className="flex-1 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodMenu;