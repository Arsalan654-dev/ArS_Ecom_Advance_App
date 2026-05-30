/* frontend/src/components/AddressForm.jsx */

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import FreeMapPicker from './FreeMapPicker';
import axios from 'axios';
import API_URL from '../config/api';

const AddressForm = ({ address, onSuccess, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        label: 'Home',
        customLabel: '',
        fullAddress: '',
        landmark: '',
        city: '',
        state: '',
        pincode: '',
        country: 'Pakistan',
        latitude: null,
        longitude: null,
        placeId: null,
        isDefault: false,
        phoneNumber: '',
        receiverName: '',
        instructions: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (address) {
            setFormData({
                label: address.label || 'Home',
                customLabel: address.customLabel || '',
                fullAddress: address.fullAddress || '',
                landmark: address.landmark || '',
                city: address.city || '',
                state: address.state || '',
                pincode: address.pincode || '',
                country: address.country || 'Pakistan',
                latitude: address.latitude || null,
                longitude: address.longitude || null,
                placeId: address.placeId || null,
                isDefault: address.isDefault || false,
                phoneNumber: address.phoneNumber || '',
                receiverName: address.receiverName || '',
                instructions: address.instructions || ''
            });
        }
    }, [address]);

    const handleLocationSelect = (locationData) => {
        setFormData(prev => ({
            ...prev,
            latitude: locationData.lat,
            longitude: locationData.lng,
            fullAddress: locationData.address || prev.fullAddress,
            city: locationData.addressComponents?.city || prev.city,
            state: locationData.addressComponents?.state || prev.state,
            pincode: locationData.addressComponents?.pincode || prev.pincode,
            country: locationData.addressComponents?.country || prev.country,
            placeId: locationData.placeId || prev.placeId
        }));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.receiverName?.trim()) {
            newErrors.receiverName = 'Receiver name is required';
        }

        if (!formData.phoneNumber) {
            newErrors.phoneNumber = 'Phone number is required';
        } else if (!/^\d{10,13}$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = 'Phone number must be 10-13 digits';
        }

        if (!formData.fullAddress) {
            newErrors.fullAddress = 'Please select a location on map';
        }

        if (!formData.city) {
            newErrors.city = 'City is required';
        }

        if (!formData.state) {
            newErrors.state = 'State is required';
        }

        if (!formData.pincode) {
            newErrors.pincode = 'Pincode is required';
        } else if (!/^\d{5,6}$/.test(formData.pincode)) {
            newErrors.pincode = 'Pincode must be 5 or 6 digits';
        }

        if (!formData.latitude || !formData.longitude) {
            newErrors.location = 'Please select a location on map';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);

        const submitData = {
            ...formData,
            phoneNumber: formData.phoneNumber.toString(),
            pincode: formData.pincode.toString()
        };

        try {
            const token = localStorage.getItem('token');
            let response;

            if (address) {
                // Update existing address
                response = await axios.put(
                    `${API_URL}/api/address/${address._id}`,
                    submitData,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                        withCredentials: true
                    }
                );
                toast.success('Address updated successfully!');
            } else {
                // Add new address
                response = await axios.post(
                    `${API_URL}/api/address`,
                    submitData,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                        withCredentials: true
                    }
                );
                toast.success('Address added successfully!');
            }

            onSuccess?.(response.data.address);

        } catch (error) {
            console.error('Address save error:', error);
            toast.error(error.response?.data?.error || 'Failed to save address');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Map Picker */}
            <div>
                <label className="block text-gray-700 font-medium mb-2">
                    Select Location on Map <span className="text-red-500">*</span>
                </label>
                <FreeMapPicker
                    onLocationSelect={handleLocationSelect}
                    initialLat={formData.latitude || 24.8607}
                    initialLng={formData.longitude || 67.0011}
                    initialAddress={formData.fullAddress}
                />
                {errors.location && (
                    <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                )}
            </div>

            {/* Receiver Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-gray-700 mb-1">Receiver Name <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        name="receiverName"
                        value={formData.receiverName}
                        onChange={handleChange}
                        placeholder="Full name"
                        className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.receiverName ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.receiverName && <p className="text-red-500 text-sm mt-1">{errors.receiverName}</p>}
                </div>

                <div>
                    <label className="block text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                    <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="10-13 digits"
                        className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
                </div>
            </div>

            {/* Address Label */}
            <div>
                <label className="block text-gray-700 mb-1">Address Label</label>
                <div className="flex gap-4 flex-wrap">
                    {['Home', 'Office', 'Other'].map(label => (
                        <label key={label} className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="label"
                                value={label}
                                checked={formData.label === label}
                                onChange={handleChange}
                                className="w-4 h-4 text-indigo-600"
                            />
                            <span>{label}</span>
                        </label>
                    ))}
                </div>
                {formData.label === 'Other' && (
                    <input
                        type="text"
                        name="customLabel"
                        value={formData.customLabel}
                        onChange={handleChange}
                        placeholder="Enter custom label (e.g., Gym, Friend's House)"
                        className="mt-2 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                )}
            </div>

            {/* Full Address (Auto-filled from map) */}
            <div>
                <label className="block text-gray-700 mb-1">Full Address <span className="text-red-500">*</span></label>
                <textarea
                    name="fullAddress"
                    value={formData.fullAddress}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Will be auto-filled from map"
                    className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 ${errors.fullAddress ? 'border-red-500' : 'border-gray-300'}`}
                    readOnly
                />
                {errors.fullAddress && <p className="text-red-500 text-sm mt-1">{errors.fullAddress}</p>}
            </div>

            {/* Landmark */}
            <div>
                <label className="block text-gray-700 mb-1">Landmark (Optional)</label>
                <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    placeholder="Nearby landmark (e.g., Near City Hospital)"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {/* City, State, Pincode */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                        readOnly
                    />
                    {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>

                <div>
                    <label className="block text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
                        readOnly
                    />
                    {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                </div>

                <div>
                    <label className="block text-gray-700 mb-1">Pincode <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}  // Make sure handleChange allows editing
                        placeholder="5 or 6 digits"
                        maxLength="6"
                        className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.pincode ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
                </div>
            </div>

            {/* Delivery Instructions */}
            <div>
                <label className="block text-gray-700 mb-1">Delivery Instructions (Optional)</label>
                <textarea
                    name="instructions"
                    value={formData.instructions}
                    onChange={handleChange}
                    rows="2"
                    placeholder="e.g., Ring bell twice, Apartment number, Gate code..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {/* Default Address Checkbox */}
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600"
                />
                <label className="text-gray-700">Set as default address</label>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                    {loading ? 'Saving...' : (address ? 'Update Address' : 'Add Address')}
                </button>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-md hover:bg-gray-300 disabled:opacity-50 transition"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
};

export default AddressForm;