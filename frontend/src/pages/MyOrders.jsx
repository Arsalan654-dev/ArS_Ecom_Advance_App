// frontend/src/pages/MyOrders.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../config/api";
import { useCart } from "../context/CartContext";
import { MdShoppingBag, MdDelete, MdDeleteSweep, MdChevronLeft, MdChevronRight, MdRefresh } from "react-icons/md";

const MyOrders = () => {
    const navigate = useNavigate();
    const { fetchCart } = useCart();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [deletingAll, setDeletingAll] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
    });

    useEffect(() => {
        fetchOrders();
    }, [pagination.currentPage]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/api/orders/my-orders?page=${pagination.currentPage}&limit=10`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            setOrders(res.data.orders || []);
            setPagination(res.data.pagination);
        } catch (error) {
            console.error("Failed to load orders");
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    const deleteOrder = async (orderId, e) => {
        e.stopPropagation();
        
        if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
            return;
        }
        
        setDeletingId(orderId);
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_URL}/api/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            toast.success("Order deleted successfully");
            await fetchOrders();
            await fetchCart(); // Refresh cart count
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to delete order");
        } finally {
            setDeletingId(null);
        }
    };

    const deleteAllOrders = async () => {
        if (orders.length === 0) {
            toast.info("No orders to delete");
            return;
        }
        
        if (!confirm(`Are you sure you want to delete ALL ${pagination.totalItems} orders? This action cannot be undone.`)) {
            return;
        }
        
        setDeletingAll(true);
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_URL}/api/orders/all`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            toast.success("All orders deleted successfully");
            await fetchOrders();
            await fetchCart(); // Refresh cart count
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to delete orders");
        } finally {
            setDeletingAll(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            payment_pending: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
            pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
            preparing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            ready: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
            "out-for-delivery": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
            delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        };
        return colors[status] || colors.pending;
    };

    const getStatusLabel = (status) => {
        const labels = {
            payment_pending: "Payment Pending",
            pending: "Pending",
            preparing: "Preparing",
            ready: "Ready",
            "out-for-delivery": "Out for Delivery",
            delivered: "Delivered",
            cancelled: "Cancelled",
        };
        return labels[status] || status;
    };

    const canDelete = (status) => {
        // Allow deletion for payment_pending, delivered, and cancelled orders
        return status === 'payment_pending' || status === 'delivered' || status === 'cancelled';
    };

    const getPageNumbers = () => {
        const { currentPage, totalPages } = pagination;
        const pages = [];
        
        if (totalPages <= 0) return [1];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else if (currentPage <= 3) {
            for (let i = 1; i <= 5; i++) pages.push(i);
        } else if (currentPage >= totalPages - 2) {
            for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
        } else {
            for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
        }
        return pages;
    };

    if (loading && pagination.currentPage === 1) {
        return (
            <div className="space-y-4">
                <div className="h-8 w-40 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        My Orders
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        {pagination.totalItems} order{pagination.totalItems !== 1 ? 's' : ''} found
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchOrders}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition hover:bg-gray-200"
                        title="Refresh"
                    >
                        <MdRefresh size={18} />
                        Refresh
                    </button>
                    {orders.length > 0 && (
                        <button
                            onClick={deleteAllOrders}
                            disabled={deletingAll}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                        >
                            <MdDeleteSweep size={18} />
                            {deletingAll ? "Deleting..." : "Delete All"}
                        </button>
                    )}
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    <MdShoppingBag size={64} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No orders yet</p>
                    <button
                        onClick={() => navigate("/shop")}
                        className="mt-4 px-6 py-2 bg-violet-600 text-white rounded-lg"
                    >
                        Start Shopping
                    </button>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const showDelete = canDelete(order.status);
                            return (
                                <div
                                    key={order._id}
                                    onClick={() => navigate(`/order-tracking/${order._id}`)}
                                    className={`bg-white dark:bg-gray-900 rounded-xl border p-5 hover:shadow-md cursor-pointer transition ${
                                        order.status === 'payment_pending' 
                                            ? 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30'
                                            : 'border-gray-200 dark:border-gray-800'
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-gray-500">Order #{order._id.slice(-8)}</p>
                                            <p className="font-semibold mt-1">₨ {order.totalAmount?.toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                {getStatusLabel(order.status)}
                                            </span>
                                            {showDelete && (
                                                <button
                                                    onClick={(e) => deleteOrder(order._id, e)}
                                                    disabled={deletingId === order._id}
                                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                                                    title="Delete Order"
                                                >
                                                    {deletingId === order._id ? (
                                                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <MdDelete size={16} />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-3 text-sm text-gray-500">
                                        <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                                        <p>{order.foodItems?.length} items</p>
                                        {order.status === 'payment_pending' && (
                                            <p className="text-xs text-amber-600 mt-1">Payment pending - will be processed shortly</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex flex-col items-center gap-4 mt-6">
                            <div className="flex justify-center items-center gap-2">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                                    disabled={pagination.currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 transition"
                                >
                                    <MdChevronLeft size={20} />
                                </button>
                                
                                <div className="flex gap-1">
                                    {getPageNumbers().map(pageNum => (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPagination(prev => ({ ...prev, currentPage: pageNum }))}
                                            className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                                                pagination.currentPage === pageNum
                                                    ? 'bg-violet-600 text-white'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    ))}
                                </div>
                                
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                                    disabled={pagination.currentPage === pagination.totalPages}
                                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 transition"
                                >
                                    <MdChevronRight size={20} />
                                </button>
                            </div>
                            
                            <div className="text-sm text-gray-500">
                                Showing {pagination.totalItems === 0 ? 0 : ((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                                {pagination.totalItems} orders
                            </div>
                        </div>
                    )}
                    
                    {/* Show info when only 1 page but has items */}
                    {pagination.totalPages === 1 && pagination.totalItems > 0 && (
                        <div className="text-center text-sm text-gray-500 mt-4">
                            Showing all {pagination.totalItems} orders
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MyOrders;