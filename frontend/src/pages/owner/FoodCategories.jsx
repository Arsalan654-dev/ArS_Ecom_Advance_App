import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../../config/api";
import StatusBadge from "../../components/owner/StatusBadge";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdCategory,
  MdClose,
  MdCheckCircle,
} from "react-icons/md";

const FoodCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", isActive: true });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/food-item/category`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setCategories(res.data.categories || []);
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      
      if (editingCategory) {
        await axios.put(
          `${API_URL}/api/food-item/category/${editingCategory._id}`,
          { name: formData.name, isActive: formData.isActive },
          { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
        );
        toast.success("Category updated successfully");
      } else {
        await axios.post(
          `${API_URL}/api/food-item/category`,
          { name: formData.name },
          { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
        );
        toast.success("Category created successfully");
      }
      
      fetchCategories();
      resetModal();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"? All food items in this category will also be deleted.`)) {
      return;
    }

    setDeletingId(category._id);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/food-item/category/${category._id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      toast.success("Category deleted successfully");
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete category");
    } finally {
      setDeletingId(null);
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: "", isActive: true });
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, isActive: category.isActive });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Food Categories
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Manage your restaurant menu categories
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition"
        >
          <MdAdd size={20} /> Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <MdCategory size={48} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No categories yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create your first category to organize your menu.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition"
          >
            <MdAdd size={18} /> Create Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category._id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MdCategory size={20} className="text-violet-600" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">{category.name}</h3>
                  </div>
                  <div className="mt-2">
                    <StatusBadge status={category.isActive} type="category" />
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(category)}
                    className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                  >
                    <MdEdit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    disabled={deletingId === category._id}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
                  >
                    {deletingId === category._id ? (
                      <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <MdDelete size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h2>
              <button onClick={resetModal} className="text-gray-500 hover:text-gray-700">
                <MdClose size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Appetizers, Main Course, Desserts"
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  autoFocus
                />
              </div>

              {editingCategory && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 rounded-lg disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingCategory ? "Update" : "Create"}
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

export default FoodCategories;