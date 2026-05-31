// frontend\src\components\AddressForm.jsx

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import FreeMapPicker from "./FreeMapPicker";
import axios from "axios";
import API_URL from "../config/api";

export const AddressForm = ({ address, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    label: "Home",
    customLabel: "",
    fullAddress: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    country: "Pakistan",
    latitude: null,
    longitude: null,
    placeId: null,
    isDefault: false,
    phoneNumber: "",
    receiverName: "",
    instructions: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (address) {
      setFormData({
        label: address.label || "Home",
        customLabel: address.customLabel || "",
        fullAddress: address.fullAddress || "",
        landmark: address.landmark || "",
        city: address.city || "",
        state: address.state || "",
        pincode: address.pincode || "",
        country: address.country || "Pakistan",
        latitude: address.latitude || null,
        longitude: address.longitude || null,
        placeId: address.placeId || null,
        isDefault: address.isDefault || false,
        phoneNumber: address.phoneNumber || "",
        receiverName: address.receiverName || "",
        instructions: address.instructions || "",
      });
    }
  }, [address]);

  const handleLocationSelect = (locationData) => {
    setFormData((prev) => ({
      ...prev,
      latitude: locationData.lat,
      longitude: locationData.lng,
      fullAddress: locationData.address || prev.fullAddress,
      city: locationData.addressComponents?.city || prev.city,
      state: locationData.addressComponents?.state || prev.state,
      pincode: locationData.addressComponents?.pincode || prev.pincode,
      country: locationData.addressComponents?.country || prev.country,
      placeId: locationData.placeId || prev.placeId,
    }));
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? e.target.checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: val,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.receiverName?.trim()) {
      newErrors.receiverName = "Receiver name is required";
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\d{10,13}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Phone number must be 10-13 digits";
    }

    if (!formData.fullAddress) {
      newErrors.location = "Please select a location on map";
    }

    if (!formData.city) {
      newErrors.city = "City is required";
    }

    if (!formData.state) {
      newErrors.state = "State is required";
    }

    if (!formData.pincode) {
      newErrors.pincode = "Pincode is required";
    }

    if (!formData.latitude || !formData.longitude) {
      newErrors.location = "Select your location using the map locator above";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      // Auto-scroll to the first invalid field
      setTimeout(() => {
        const errorInput = document.querySelector(".border-red-500");
        if (errorInput) {
          errorInput.scrollIntoView({ behavior: "smooth", block: "center" });
          errorInput.focus();
        } else {
          const firstErrorMsg = document.querySelector(".text-red-500");
          if (firstErrorMsg) {
            firstErrorMsg.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }, 80);
      return;
    }

    setLoading(true);
    const submitData = {
      ...formData,
      phoneNumber: formData.phoneNumber.toString(),
      pincode: formData.pincode.toString(),
    };

    try {
      const token = localStorage.getItem("token");
      if (address) {
        // Update
        await axios.put(`${API_URL}/api/address/${address._id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        toast.success("Address updated successfully!");
      } else {
        // Create
        await axios.post(`${API_URL}/api/address`, submitData, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        toast.success("Address added successfully!");
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-gray-700 dark:text-gray-300 text-sm">
      {/* Map Picker Selection */}
      <div>
        <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
          Select Location on Mobile Map <span className="text-red-500">*</span>
        </label>
        <FreeMapPicker
          onLocationSelect={handleLocationSelect}
          initialLat={formData.latitude || 24.8607}
          initialLng={formData.longitude || 67.0011}
          initialAddress={formData.fullAddress}
        />
        {errors.location && <p className="text-red-500 text-xs mt-1 font-medium">{errors.location}</p>}
      </div>

      {/* Receiver Name & Phone Number */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">Receiver Name *</label>
          <input
            type="text"
            name="receiverName"
            value={formData.receiverName}
            onChange={handleChange}
            placeholder="Recipient's Name"
            className={`w-full p-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
              errors.receiverName
                ? "border-red-500 focus:ring-red-500 ring-red-500"
                : "border-gray-300 dark:border-gray-700 focus:ring-violet-500"
            }`}
          />
          {errors.receiverName && <p className="text-red-500 text-xs mt-1">{errors.receiverName}</p>}
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">Phone Number *</label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="03XXXXXXXXX"
            className={`w-full p-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
              errors.phoneNumber
                ? "border-red-500 focus:ring-red-500 ring-red-500"
                : "border-gray-300 dark:border-gray-700 focus:ring-violet-500"
            }`}
          />
          {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
        </div>
      </div>

      {/* Address Label Choice */}
      <div>
        <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">Address Label</label>
        <div className="flex gap-4">
          {["Home", "Office", "Other"].map((l) => (
            <label key={l} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="label"
                value={l}
                checked={formData.label === l}
                onChange={handleChange}
                className="w-4 h-4 text-violet-600 focus:ring-violet-500"
              />
              <span>{l}</span>
            </label>
          ))}
        </div>
        {formData.label === "Other" && (
          <input
            type="text"
            name="customLabel"
            value={formData.customLabel}
            onChange={handleChange}
            placeholder="Custom Label (e.g. Gym, School)"
            className="mt-2 w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none"
          />
        )}
      </div>

      {/* Full Address */}
      <div>
        <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">Full Address (Auto-filled) *</label>
        <textarea
          name="fullAddress"
          value={formData.fullAddress}
          onChange={handleChange}
          rows={2}
          placeholder="Will fill automatically on selecting location on map"
          className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none"
          readOnly
        />
      </div>

      {/* City, State, Pincode */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">City</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            readOnly
          />
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">State</label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            readOnly
          />
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">Pincode *</label>
          <input
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            placeholder="Pincode/ZIP details"
            className={`w-full p-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
              errors.pincode
                ? "border-red-500 focus:ring-red-500 ring-red-500"
                : "border-gray-300 dark:border-gray-700 focus:ring-violet-500"
            }`}
          />
          {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
        </div>
      </div>

      {/* Instructions */}
      <div>
        <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">Delivery Instructions (Optional)</label>
        <input
          type="text"
          name="instructions"
          value={formData.instructions}
          onChange={handleChange}
          placeholder="e.g. Ring bell twice, leave with guards"
          className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none"
        />
      </div>

      {/* Default Checkbox selection */}
      <label className="flex items-center gap-2 cursor-pointer pt-1">
        <input
          type="checkbox"
          name="isDefault"
          checked={formData.isDefault}
          onChange={handleChange}
          className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
        />
        <span>Make this my default shipping address</span>
      </label>

      {/* Action buttons */}
      <div className="flex gap-3 pt-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold p-2.5 rounded-lg disabled:opacity-50 transition cursor-pointer"
        >
          {loading ? "Saving address..." : address ? "Save Changes" : "Save Address"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold p-2.5 rounded-lg transition cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddressForm;
