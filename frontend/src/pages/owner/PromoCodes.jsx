import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../../config/api";
import StatusBadge from "../../components/owner/StatusBadge";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdLocalOffer,
  MdClose,
  MdPercent,
} from "react-icons/md";

const PromoCodes = () => {
  const [promoCodes, setPromoCodes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    discountPercentage: "",
    minOrderValue: 0,
    maxDiscount: "",
    validFrom: "",
    validUpto: "",
    usageLimit: "",
    applicableCategories: [],
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);

  useEffect(() => {
    fetchPromoCodes();
    fetchCategories();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/promo-code`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setPromoCodes(res.data.promoCodes || []);
    } catch (error) {
      toast.error("Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.discountPercentage || !formData.validFrom || !formData.validUpto) {
      toast.error("Code, discount, and validity dates are required");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...formData,
        discountPercentage: parseFloat(formData.discountPercentage),
        minOrderValue: parseFloat(formData.minOrderValue) || 0,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        applicableCategories: selectedCategories,
      };
      
      if (editingCode) {
        await axios.put(
          `${API_URL}/api/promo-code/${editingCode._id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
        );
        toast.success("Promo code updated successfully");
      } else {
        await axios.post(
          `${API_URL}/api/promo-code`,
          payload,
          { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
        );
        toast.success("Promo code created successfully");
      }
      
      fetchPromoCodes();
      resetModal();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save promo code");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (code) => {
    if (!window.confirm(`Delete promo code "${code.code}"?`)) return;

    setDeletingId(code._id);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/promo-code/${code._id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      toast.success("Promo code deleted successfully");
      fetchPromoCodes();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete code");
    } finally {
      setDeletingId(null);
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setEditingCode(null);
    setSelectedCategories([]);
    setFormData({
      code: "",
      discountPercentage: "",
      minOrderValue: 0,
      maxDiscount: "",
      validFrom: "",
      validUpto: "",
      usageLimit: "",
      applicableCategories: [],
      isActive: true,
    });
  };

  const openEditModal = (code) => {
    setEditingCode(code);
    setSelectedCategories(code.applicableCategories || []);
    setFormData({
      code: code.code,
      discountPercentage: code.discountPercentage,
      minOrderValue: code.minOrderValue,
      maxDiscount: code.maxDiscount || "",
      validFrom: code.validFrom.split("T")[0],
      validUpto: code.validUpto.split("T")[0],
      usageLimit: code.usageLimit || "",
      applicableCategories: code.applicableCategories || [],
      isActive: code.isActive,
    });
    setShowModal(true);
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const isExpired = (validUpto) => {
    return new Date(validUpto) < new Date();
  };

  const getStatus = (code) => {
    if (!code.isActive) return "inactive";
    if (isExpired(code.validUpto)) return "expired";
    return "active";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
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
            Promo Codes
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Create discount offers for your customers
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition"
        >
          <MdAdd size={20} /> Add Promo Code
        </button>
      </div>

      {promoCodes.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <MdLocalOffer size={48} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No promo codes yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create your first promo code to attract more customers.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition"
          >
            <MdAdd size={18} /> Create Promo Code
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promoCodes.map((code) => (
            <div
              key={code._id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MdPercent size={20} className="text-violet-600" />
                    <h3 className="font-mono font-bold text-lg text-gray-900 dark:text-white">
                      {code.code}
                    </h3>
                  </div>
                  <div className="mt-2">
                    <p className="text-2xl font-bold text-violet-600">
                      {code.discountPercentage}% OFF
                    </p>
                    {code.maxDiscount && (
                      <p className="text-xs text-gray-500">Max discount: ₨ {code.maxDiscount}</p>
                    )}
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p>💰 Min order: ₨ {code.minOrderValue}</p>
                    <p>📅 Valid: {new Date(code.validFrom).toLocaleDateString()} - {new Date(code.validUpto).toLocaleDateString()}</p>
                    {code.usageLimit && (
                      <p>🔄 Used: {code.timesUsed}/{code.usageLimit}</p>
                    )}
                  </div>
                  <div className="mt-2">
                    <StatusBadge status={getStatus(code)} type="promo" />
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(code)}
                    className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                  >
                    <MdEdit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(code)}
                    disabled={deletingId === code._id}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
                  >
                    {deletingId === code._id ? (
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full my-8 border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingCode ? "Edit Promo Code" : "Create Promo Code"}
              </h2>
              <button onClick={resetModal} className="text-gray-500 hover:text-gray-700">
                <MdClose size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Promo Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SAVE20"
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Discount (%) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    max="100"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Min Order Value (PKR)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Discount (PKR)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    placeholder="Optional"
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valid From *
                  </label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valid Until *
                  </label>
                  <input
                    type="date"
                    value={formData.validUpto}
                    onChange={(e) => setFormData({ ...formData, validUpto: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    placeholder="Unlimited"
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Applicable Categories (Optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat._id}
                        type="button"
                        onClick={() => toggleCategory(cat._id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                          selectedCategories.includes(cat._id)
                            ? "bg-violet-600 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {editingCode && (
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
                  {saving ? "Saving..." : editingCode ? "Update Code" : "Create Code"}
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

export default PromoCodes;