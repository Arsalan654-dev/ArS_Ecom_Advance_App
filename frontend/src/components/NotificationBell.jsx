// frontend/src/components/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';
import { MdNotifications, MdClose, MdCheckCircle, MdLocalShipping, MdRestaurant, MdDeliveryDining, MdCancel, MdDelete } from 'react-icons/md';
import { toast } from 'react-toastify';

const NotificationBell = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [socket, setSocket] = useState(null);
    const dropdownRef = useRef(null);
    const processedIds = useRef(new Set());
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (user._id) {
            fetchNotifications();
            connectSocket();
        }
        
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        
        return () => {
            if (socket) socket.disconnect();
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [user._id]);

    const connectSocket = () => {
        const token = localStorage.getItem('token');
        if (!token || !user._id) return;
        
        try {
            const newSocket = io(API_URL, {
                auth: { userId: user._id },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5
            });
            
            newSocket.on('connect', () => {
                console.log('Socket connected');
            });
            
            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
            });
            
            newSocket.on('notification', (notification) => {
                if (processedIds.current.has(notification._id)) {
                    console.log('Duplicate notification skipped:', notification._id);
                    return;
                }
                
                processedIds.current.add(notification._id);
                
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);
                
                toast.info(notification.message, {
                    toastId: notification._id,
                    onClick: () => {
                        if (notification.link) {
                            window.location.href = notification.link;
                        }
                        setIsOpen(false);
                    }
                });
            });
            
            setSocket(newSocket);
        } catch (error) {
            console.error("Socket connection failed:", error);
        }
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/notifications?limit=50`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
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
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/api/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const deleteAllNotifications = async () => {
        if (!confirm("Delete all notifications? This action cannot be undone.")) return;
        
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            setNotifications([]);
            setUnreadCount(0);
            toast.success("All notifications deleted");
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to delete all:", error);
            toast.error("Failed to delete notifications");
        }
    };

    const deleteNotification = async (id, e) => {
        e.stopPropagation();
        
        setDeletingId(id);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            
            const wasUnread = notifications.find(n => n._id === id)?.isRead === false;
            setNotifications(prev => prev.filter(n => n._id !== id));
            
            if (wasUnread) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            
            toast.success("Notification deleted");
        } catch (error) {
            console.error("Failed to delete notification:", error);
            toast.error("Failed to delete");
        } finally {
            setDeletingId(null);
        }
    };

    const getNotificationIcon = (type) => {
        switch(type) {
            case 'order_placed': return <MdCheckCircle className="text-green-500" size={20} />;
            case 'order_preparing': return <MdRestaurant className="text-blue-500" size={20} />;
            case 'order_ready': return <MdCheckCircle className="text-purple-500" size={20} />;
            case 'order_out_for_delivery': return <MdLocalShipping className="text-orange-500" size={20} />;
            case 'order_delivered': return <MdDeliveryDining className="text-green-500" size={20} />;
            case 'order_cancelled': return <MdCancel className="text-red-500" size={20} />;
            default: return <MdNotifications className="text-gray-500" size={20} />;
        }
    };

    const formatTime = (date) => {
        if (!date) return 'Just now';
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                title="Notifications"
            >
                <MdNotifications size={22} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>
            
            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-[9999] bg-black/50 lg:hidden"
                        onClick={() => setIsOpen(false)}
                    />
                    
                    <div className="fixed inset-x-4 bottom-0 top-auto z-[10000] rounded-t-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 lg:absolute lg:right-0 lg:mt-2 lg:inset-auto lg:w-96 lg:rounded-xl">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                            <div className="flex items-center gap-2">
                                {notifications.length > 0 && (
                                    <button
                                        onClick={deleteAllNotifications}
                                        className="text-xs text-red-500 hover:text-red-600"
                                    >
                                        Delete All
                                    </button>
                                )}
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-violet-600 hover:text-violet-700"
                                    >
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="lg:hidden p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <MdClose size={20} />
                                </button>
                            </div>
                        </div>
                        
                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center text-gray-500">Loading...</div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <MdNotifications size={40} className="mx-auto mb-2 text-gray-400" />
                                    No notifications yet
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
                                            !notification.isRead ? 'bg-violet-50 dark:bg-violet-900/10' : ''
                                        }`}
                                    >
                                        <div className="flex gap-3">
                                            <div 
                                                className="flex-1 min-w-0 cursor-pointer"
                                                onClick={() => {
                                                    if (!notification.isRead) markAsRead(notification._id);
                                                    if (notification.link) {
                                                        window.location.href = notification.link;
                                                    }
                                                    setIsOpen(false);
                                                }}
                                            >
                                                <div className="flex gap-3">
                                                    <div className="flex-shrink-0">
                                                        {getNotificationIcon(notification.type)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {formatTime(notification.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => deleteNotification(notification._id, e)}
                                                disabled={deletingId === notification._id}
                                                className="text-gray-400 hover:text-red-500 transition disabled:opacity-50"
                                            >
                                                {deletingId === notification._id ? (
                                                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <MdDelete size={16} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    navigate('/notifications');
                                }}
                                className="w-full text-center text-sm text-violet-600 hover:text-violet-700"
                            >
                                View All Notifications
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;