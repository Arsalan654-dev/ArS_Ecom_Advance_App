import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../../config/api";
import FreeMapPicker from "../../components/FreeMapPicker";
import StatusBadge from "../../components/owner/StatusBadge";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdLocalShipping,
  MdClose,
  MdMyLocation,
} from "react-icons/md";

const DeliveryZones = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    centerLat: 24.8607,
    centerLon: 67.0011,
    radiusKm: 5,
    deliveryChargeFlatRate: 50,
    freeDeliveryAbove: null,
    estimatedTimeMinutes: 30,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/delivery-zone`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setZones(res.data.zones || []);
    } catch (error) {
      toast.error("Failed to load delivery zones");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (locationData) => {
    setFormData((prev) => ({
      ...prev,
      centerLat: locationData.lat,
      centerLon: locationData.lng,
    }));
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          centerLat: pos.coords.latitude,
          centerLon: pos.coords.longitude,
        }));
        toast.success("Location updated to current position");
      },
      (error) => {
        toast.error("Could not get current location");
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.radiusKm) {
      toast.error("Name and radius are required");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      
      if (editingZone) {
        await axios.put(
          `${API_URL}/api/delivery-zone/${editingZone._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
        );
        toast.success("Delivery zone updated successfully");
      } else {
        await axios.post(
          `${API_URL}/api/delivery-zone`,
          formData,
          { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
        );
        toast.success("Delivery zone created successfully");
      }
      
      fetchZones();
      resetModal();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save delivery zone");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (zone) => {
    if (!window.confirm(`Delete delivery zone "${zone.name}"?`)) return;

    setDeletingId(zone._id);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/delivery-zone/${zone._id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      toast.success("Delivery zone deleted successfully");
      fetchZones();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete zone");
    } finally {
      setDeletingId(null);
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setEditingZone(null);
    setFormData({
      name: "",
      centerLat: 24.8607,
      centerLon: 67.0011,
      radiusKm: 5,
      deliveryChargeFlatRate: 50,
      freeDeliveryAbove: null,
      estimatedTimeMinutes: 30,
      isActive: true,
    });
  };

  const openEditModal = (zone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      centerLat: zone.centerLat,
      centerLon: zone.centerLon,
      radiusKm: zone.radiusKm,
      deliveryChargeFlatRate: zone.deliveryChargeFlatRate,
      freeDeliveryAbove: zone.freeDeliveryAbove,
      estimatedTimeMinutes: zone.estimatedTimeMinutes,
      isActive: zone.isActive,
    });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
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
            Delivery Zones
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Define areas where your restaurant delivers
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition"
        >
          <MdAdd size={20} /> Add Zone
        </button>
      </div>

      {zones.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <MdLocalShipping size={48} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No delivery zones yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create your first delivery zone to start accepting orders.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition"
          >
            <MdAdd size={18} /> Create Zone
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {zones.map((zone) => (
            <div
              key={zone._id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MdLocalShipping size={20} className="text-violet-600" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">{zone.name}</h3>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p>📍 Radius: {zone.radiusKm} km</p>
                    <p>💰 Delivery Fee: ₨ {zone.deliveryChargeFlatRate}</p>
                    {zone.freeDeliveryAbove && (
                      <p>🎉 Free delivery above ₨ {zone.freeDeliveryAbove}</p>
                    )}
                    <p>⏱️ Est. Time: {zone.estimatedTimeMinutes} min</p>
                  </div>
                  <div className="mt-2">
                    <StatusBadge status={zone.isActive} type="category" />
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(zone)}
                    className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                  >
                    <MdEdit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(zone)}
                    disabled={deletingId === zone._id}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
                  >
                    {deletingId === zone._id ? (
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
                {editingZone ? "Edit Delivery Zone" : "Add New Delivery Zone"}
              </h2>
              <button onClick={resetModal} className="text-gray-500 hover:text-gray-700">
                <MdClose size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Zone Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., DHA Phase 5, Clifton, Gulshan"
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>

              {/* Map Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Zone Center Location *
                </label>
                <div className="mb-2">
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="flex items-center gap-2 px-3 py-1.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg text-sm"
                  >
                    <MdMyLocation size={16} /> Use Current Location
                  </button>
                </div>
                <div className="h-64 rounded-lg overflow-hidden">
                  <FreeMapPicker
                    onLocationSelect={handleLocationSelect}
                    initialLat={formData.centerLat}
                    initialLng={formData.centerLon}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Radius (km) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.radiusKm}
                    onChange={(e) => setFormData({ ...formData, radiusKm: parseFloat(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Delivery Charge (PKR) *
                  </label>
                  <input
                    type="number"
                    value={formData.deliveryChargeFlatRate}
                    onChange={(e) => setFormData({ ...formData, deliveryChargeFlatRate: parseFloat(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Free Delivery Above (PKR)
                  </label>
                  <input
                    type="number"
                    value={formData.freeDeliveryAbove || ""}
                    onChange={(e) => setFormData({ ...formData, freeDeliveryAbove: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="Optional"
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estimated Time (minutes) *
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedTimeMinutes}
                    onChange={(e) => setFormData({ ...formData, estimatedTimeMinutes: parseInt(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
              </div>

              {editingZone && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active Zone</span>
                </label>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 rounded-lg disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingZone ? "Update Zone" : "Create Zone"}
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

export default DeliveryZones;