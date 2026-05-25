// D:\Vingo\frontend\src\pages\AddressBook.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoMdArrowBack, IoMdAdd, IoMdTrash, IoMdCreate, IoMdCheckmarkCircle, IoMdHome, IoMdBusiness, IoMdPin } from 'react-icons/io';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../config/api';
import AddressForm from '../components/AddressForm';

const AddressBook = () => {
    const navigate = useNavigate();
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/address`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
            });
            
            setAddresses(response.data.addresses || []);
        } catch (error) {
            console.error('Fetch addresses error:', error);
            toast.error('Failed to load addresses');
        } finally {
            setLoading(false);
        }
    };

    const handleSetDefault = async (addressId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(
                `${API_URL}/api/address/${addressId}/default`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true
                }
            );
            
            // Update local state
            setAddresses(addresses.map(addr => ({
                ...addr,
                isDefault: addr._id === addressId
            })));
            
            toast.success('Default address updated!');
        } catch (error) {
            console.error('Set default error:', error);
            toast.error(error.response?.data?.error || 'Failed to set default address');
        }
    };

    const handleDelete = async (addressId) => {
        if (!window.confirm('Are you sure you want to delete this address?')) {
            return;
        }
        
        setDeletingId(addressId);
        
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/address/${addressId}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
            });
            
            setAddresses(addresses.filter(addr => addr._id !== addressId));
            toast.success('Address deleted successfully!');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error(error.response?.data?.error || 'Failed to delete address');
        } finally {
            setDeletingId(null);
        }
    };

    const handleEdit = (address) => {
        setEditingAddress(address);
        setShowForm(true);
    };

    const handleFormSuccess = (savedAddress) => {
        setShowForm(false);
        setEditingAddress(null);
        fetchAddresses(); // Refresh the list
    };

    const getLabelIcon = (label) => {
        switch (label) {
            case 'Home':
                return <IoMdHome className="text-indigo-600" size={20} />;
            case 'Office':
                return <IoMdBusiness className="text-blue-600" size={20} />;
            default:
                return <IoMdPin className="text-green-600" size={20} />;
        }
    };

    const getDisplayLabel = (address) => {
        if (address.label === 'Other' && address.customLabel) {
            return address.customLabel;
        }
        return address.label;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading addresses...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="container mx-auto max-w-3xl px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate('/profile')}
                        className="text-gray-600 hover:text-gray-800 transition"
                    >
                        <IoMdArrowBack size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">My Addresses</h1>
                    <button
                        onClick={() => {
                            setEditingAddress(null);
                            setShowForm(true);
                        }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition flex items-center gap-2"
                    >
                        <IoMdAdd size={20} />
                        Add New
                    </button>
                </div>

                {/* Address List */}
                {addresses.length === 0 && !showForm ? (
                    <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                        <IoMdPin size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Addresses Yet</h3>
                        <p className="text-gray-500 mb-6">Add your first address to get started</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition"
                        >
                            Add New Address
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {addresses.map((address) => (
                            <div
                                key={address._id}
                                className={`bg-white rounded-lg shadow-md p-5 border-l-4 transition ${
                                    address.isDefault ? 'border-indigo-600' : 'border-transparent'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            {getLabelIcon(address.label)}
                                            <span className="font-semibold text-gray-800">
                                                {getDisplayLabel(address)}
                                            </span>
                                            {address.isDefault && (
                                                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        
                                        <p className="text-gray-700 mb-1">{address.fullAddress}</p>
                                        {address.landmark && (
                                            <p className="text-gray-500 text-sm mb-1">
                                                Landmark: {address.landmark}
                                            </p>
                                        )}
                                        <p className="text-gray-600 text-sm">
                                            {address.city}, {address.state} - {address.pincode}
                                        </p>
                                        <p className="text-gray-600 text-sm mt-2">
                                            📞 {address.receiverName} | {address.phoneNumber}
                                        </p>
                                        {address.instructions && (
                                            <p className="text-gray-500 text-xs mt-2">
                                                📝 {address.instructions}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div className="flex gap-2 ml-4">
                                        
                                        <button
                                            onClick={() => handleEdit(address)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition"
                                            title="Edit"
                                        >
                                            <IoMdCreate size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(address._id)}
                                            disabled={deletingId === address._id}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition disabled:opacity-50"
                                            title="Delete"
                                        >
                                            {deletingId === address._id ? (
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                                            ) : (
                                                <IoMdTrash size={20} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Address Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                                <h2 className="text-xl font-bold">
                                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingAddress(null);
                                    }}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="p-6">
                                <AddressForm
                                    address={editingAddress}
                                    onSuccess={handleFormSuccess}
                                    onCancel={() => {
                                        setShowForm(false);
                                        setEditingAddress(null);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddressBook;