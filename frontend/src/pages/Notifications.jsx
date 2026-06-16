// frontend/src/pages/Notifications.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config/api';
import { toast } from 'react-toastify';
import { MdDelete, MdCheckCircle, MdLocalShipping, MdRestaurant, MdDeliveryDining, MdCancel } from 'react-icons/md';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

    useEffect(() => {
        fetchNotifications();
    }, [pagination.currentPage]);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/notifications?page=${pagination.currentPage}&limit=20`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            setNotifications(res.data.notifications);
            setPagination(res.data.pagination);
        } catch (error) {
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            setNotifications(prev => prev.map(n => 
                n._id === id ? { ...n, isRead: true } : n
            ));
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            setNotifications(prev => prev.filter(n => n._id !== id));
            toast.success("Notification deleted");
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const deleteAll = async () => {
        if (!confirm("Delete all notifications?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            setNotifications([]);
            toast.success("All notifications deleted");
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const getNotificationIcon = (type) => {
        switch(type) {
            case 'order_placed': return <MdCheckCircle className="text-green-500" size={24} />;
            case 'order_preparing': return <MdRestaurant className="text-blue-500" size={24} />;
            case 'order_ready': return <MdCheckCircle className="text-purple-500" size={24} />;
            case 'order_out_for_delivery': return <MdLocalShipping className="text-orange-500" size={24} />;
            case 'order_delivered': return <MdDeliveryDining className="text-green-500" size={24} />;
            case 'order_cancelled': return <MdCancel className="text-red-500" size={24} />;
            default: return <MdCheckCircle className="text-gray-500" size={24} />;
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString();
    };

    if (loading && pagination.currentPage === 1) {
        return <div className="animate-pulse">Loading notifications...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Notifications
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        Stay updated with your order status
                    </p>
                </div>
                {notifications.length > 0 && (
                    <button
                        onClick={deleteAll}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                    >
                        <MdDelete size={18} /> Delete All
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    <p className="text-gray-500">No notifications yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <div
                            key={notification._id}
                            className={`bg-white dark:bg-gray-900 rounded-xl border p-5 transition hover:shadow-md cursor-pointer ${
                                !notification.isRead ? 'border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/10' : 'border-gray-200 dark:border-gray-800'
                            }`}
                            onClick={() => {
                                if (!notification.isRead) markAsRead(notification._id);
                                if (notification.link) window.location.href = notification.link;
                            }}
                        >
                            <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{notification.title}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                                    <p className="text-xs text-gray-400 mt-2">{formatDate(notification.createdAt)}</p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notification._id);
                                    }}
                                    className="text-gray-400 hover:text-red-500 transition"
                                >
                                    <MdDelete size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                        disabled={pagination.currentPage === 1}
                        className="px-3 py-1 rounded-lg border disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="px-3 py-1">
                        Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="px-3 py-1 rounded-lg border disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default Notifications;