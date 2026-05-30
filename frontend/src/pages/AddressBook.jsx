/* frontend/src/pages/AddressBook.jsx */

import React, { useState, useEffect } from 'react';
import {
    IoMdAdd, IoMdTrash, IoMdCreate, IoMdHome, IoMdBusiness, IoMdPin
} from 'react-icons/io';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../config/api';
import AddressForm from '../components/AddressForm';

const labelIcon = (label) => {
    if (label === 'Home') return <IoMdHome className="text-violet-600 dark:text-violet-400" size={20} />;
    if (label === 'Office') return <IoMdBusiness className="text-blue-600 dark:text-blue-400" size={20} />;
    return <IoMdPin className="text-green-600 dark:text-green-400" size={20} />;
};

const AddressBook = () => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const fetchAll = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/address`, {
                headers: { Authorization: `Bearer ${token}` }, withCredentials: true
            });
            setAddresses(res.data.addresses || []);
        } catch (e) {
            toast.error('Failed to load addresses');
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const setDefault = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_URL}/api/address/${id}/default`, {}, {
                headers: { Authorization: `Bearer ${token}` }, withCredentials: true
            });
            setAddresses(addresses.map(a => ({ ...a, isDefault: a._id === id })));
            toast.success('Default address updated!');
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to set default');
        }
    };

    const remove = async (id) => {
        if (!window.confirm('Delete this address?')) return;
        setDeletingId(id);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/address/${id}`, {
                headers: { Authorization: `Bearer ${token}` }, withCredentials: true
            });
            setAddresses(addresses.filter(a => a._id !== id));
            toast.success('Address deleted!');
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to delete');
        } finally { setDeletingId(null); }
    };

    const onSaved = () => { setShowForm(false); setEditing(null); fetchAll(); };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-12 rounded skeleton" />
                <div className="h-32 rounded-xl skeleton" />
                <div className="h-32 rounded-xl skeleton" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">My Addresses</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}
                    </p>
                </div>
                <button
                    onClick={() => { setEditing(null); setShowForm(true); }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition shadow-sm"
                >
                    <IoMdAdd size={20} /> Add New
                </button>
            </div>

            {addresses.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-12 text-center">
                    <IoMdPin size={48} className="mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No addresses yet</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add your first address to get started.</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition"
                    >
                        <IoMdAdd size={18} /> Add Address
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map(addr => (
                        <div
                            key={addr._id}
                            className={`bg-white dark:bg-gray-900 rounded-xl border shadow-sm p-5 transition hover:shadow-md
                                ${addr.isDefault
                                    ? 'border-violet-400 dark:border-violet-700 ring-2 ring-violet-200 dark:ring-violet-900/40'
                                    : 'border-gray-200 dark:border-gray-800'}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                    {labelIcon(addr.label)}
                                    <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                        {addr.label === 'Other' && addr.customLabel ? addr.customLabel : addr.label}
                                    </span>
                                    {addr.isDefault && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                                            Default
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <button
                                        onClick={() => { setEditing(addr); setShowForm(true); }}
                                        className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                                        title="Edit"
                                    >
                                        <IoMdCreate size={18} />
                                    </button>
                                    <button
                                        onClick={() => remove(addr._id)}
                                        disabled={deletingId === addr._id}
                                        className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
                                        title="Delete"
                                    >
                                        <IoMdTrash size={18} />
                                    </button>
                                </div>
                            </div>

                            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{addr.fullAddress}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {addr.city}, {addr.state} - {addr.pincode}
                            </p>
                            {addr.receiverName && (
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    📞 {addr.receiverName} · {addr.phoneNumber}
                                </p>
                            )}

                            {!addr.isDefault && (
                                <button
                                    onClick={() => setDefault(addr._id)}
                                    className="mt-3 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700"
                                >
                                    Set as default
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Form modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-start md:items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full my-8 border border-gray-200 dark:border-gray-800">
                        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editing ? 'Edit Address' : 'Add New Address'}
                            </h2>
                            <button
                                onClick={() => { setShowForm(false); setEditing(null); }}
                                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl leading-none"
                            >×</button>
                        </div>
                        <div className="p-6">
                            <AddressForm
                                address={editing}
                                onSuccess={onSaved}
                                onCancel={() => { setShowForm(false); setEditing(null); }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddressBook;
