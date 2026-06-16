// frontend/src/pages/delivery/AssignedOrders.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../../config/api";
import { MdLocationOn, MdAccessTime, MdCheckCircle, MdCancel } from "react-icons/md";

const AssignedOrders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 15000);
        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/api/delivery/assigned-orders`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            setOrders(res.data.orders || []);
        } catch (error) {
            console.error("Failed to fetch orders");
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, status) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(
                `${API_URL}/api/delivery/orders/${orderId}/status`,
                { status },
                { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
            );
            toast.success(`Order ${status === "delivered" ? "delivered" : "updated"}!`);
            fetchOrders();
        } catch (error) {
            toast.error("Failed to update order");
        }
    };

    const getStatusColor = (status) => {
        if (status === "out-for-delivery") return "bg-orange-100 text-orange-700";
        if (status === "delivered") return "bg-green-100 text-green-700";
        return "bg-blue-100 text-blue-700";
    };

    if (loading) {
        return <div className="animate-pulse">Loading orders...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    Assigned Orders
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                    Orders assigned to you for delivery
                </p>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">No assigned orders at the moment</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orders.map((order) => (
                        <div
                            key={order._id}
                            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500">Order #{order._id.slice(-8)}</p>
                                    <p className="font-semibold mt-1">₨ {order.totalAmount?.toLocaleString()}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                    {order.status?.replace("-", " ").toUpperCase()}
                                </span>
                            </div>

                            <div className="mt-3 space-y-2">
                                <div className="flex items-start gap-2 text-sm">
                                    <MdLocationOn className="text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="font-medium">{order.deliveryAddress?.receiverName}</p>
                                        <p className="text-gray-500 text-xs">{order.deliveryAddress?.fullAddress}</p>
                                        <p className="text-gray-500 text-xs">📞 {order.deliveryAddress?.phoneNumber}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <MdAccessTime size={14} />
                                    <span>{new Date(order.createdAt).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-4">
                                {order.status === "out-for-delivery" && (
                                    <button
                                        onClick={() => updateOrderStatus(order._id, "delivered")}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                                    >
                                        <MdCheckCircle size={16} /> Mark Delivered
                                    </button>
                                )}
                                <button
                                    onClick={() => navigate(`/delivery/orders/${order._id}`)}
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    View Details
                                </button>
                                <button
                                    onClick={() => navigate(`/delivery/track/${order._id}`)}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                                >
                                    Share Live Location
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AssignedOrders;