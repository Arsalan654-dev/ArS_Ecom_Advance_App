// frontend/src/pages/delivery/DeliveryOrderDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../../config/api";
import {
    MdArrowBack,
    MdPerson,
    MdLocationOn,
    MdPhone,
    MdFastfood,
    MdAttachMoney,
    MdCheckCircle,
    MdLocalShipping,
    MdRestaurant,
} from "react-icons/md";

const DeliveryOrderDetail = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [delivery, setDelivery] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchOrderDetail();
    }, [orderId]);

    const fetchOrderDetail = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/api/delivery/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            setOrder(res.data.order);
            setDelivery(res.data.delivery);
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error(error.response?.data?.error || "Failed to load order details");
            navigate("/delivery/assigned-orders");
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (status) => {
        setUpdating(true);
        try {
            const token = localStorage.getItem("token");
            await axios.put(
                `${API_URL}/api/delivery/orders/${orderId}/status`,
                { status },
                { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
            );
            toast.success(`Order ${status === "delivered" ? "delivered" : "updated"} successfully!`);
            fetchOrderDetail();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to update order");
        } finally {
            setUpdating(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: "bg-yellow-100 text-yellow-700",
            preparing: "bg-blue-100 text-blue-700",
            ready: "bg-purple-100 text-purple-700",
            "out-for-delivery": "bg-orange-100 text-orange-700",
            delivered: "bg-green-100 text-green-700",
            cancelled: "bg-red-100 text-red-700",
        };
        return colors[status] || colors.pending;
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-8 w-32 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                <div className="h-96 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate("/delivery/assigned-orders")}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                    <MdArrowBack size={24} />
                </button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Delivery Order #{order._id?.slice(-8)}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        Assigned on {new Date(delivery?.assignedAt).toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Order Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <MdFastfood size={20} /> Order Items
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-800">
                            {order.foodItems?.map((item, idx) => (
                                <div key={idx} className="px-6 py-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{item.foodItem?.name}</p>
                                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                                    </div>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        ₨ {(item.price * item.quantity).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800">
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total</span>
                                <span className="text-violet-600">₨ {order.totalAmount?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Restaurant Info */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <MdRestaurant size={20} /> Restaurant
                        </h2>
                        <div className="flex items-center gap-3">
                            {order.restaurant?.logoImage?.url && (
                                <img
                                    src={order.restaurant.logoImage.url}
                                    alt={order.restaurant.businessName}
                                    className="w-12 h-12 rounded-lg object-cover"
                                />
                            )}
                            <div>
                                <p className="font-semibold">{order.restaurant?.businessName}</p>
                                <p className="text-sm text-gray-500">{order.restaurant?.mainAddress?.fullAddress}</p>
                                <p className="text-sm text-gray-500">📞 {order.restaurant?.phone}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Delivery Info */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <MdPerson size={20} /> Customer Details
                        </h2>
                        <div className="space-y-3">
                            <p className="font-medium">{order.deliveryAddress?.receiverName}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                                <MdPhone size={14} /> {order.deliveryAddress?.phoneNumber}
                            </p>
                            <div className="flex items-start gap-2 text-sm">
                                <MdLocationOn className="text-gray-400 mt-0.5" />
                                <p className="text-gray-600">{order.deliveryAddress?.fullAddress}</p>
                            </div>
                            <p className="text-sm text-gray-500">
                                {order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}
                            </p>
                        </div>
                    </div>

                    {/* Delivery Status */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Delivery Status</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Current Status</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                    {order.status?.replace("-", " ").toUpperCase()}
                                </span>
                            </div>
                            {/* Distance and Earnings */}
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Distance</span>
                                <span className="font-semibold">
                                    {delivery?.distanceKm ? `${delivery.distanceKm.toFixed(1)} km` : 'Calculating...'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Estimated Time</span>
                                <span className="font-semibold">{delivery?.estimatedTime} minutes</span>
                            </div>
                            {delivery?.earnings > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Your Earnings</span>
                                    <span className="font-semibold text-green-600">₨ {delivery.earnings}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {order.status === "out-for-delivery" && (
                        <button
                            onClick={() => updateOrderStatus("delivered")}
                            disabled={updating}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                        >
                            <MdCheckCircle size={20} />
                            {updating ? "Updating..." : "Mark as Delivered"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeliveryOrderDetail;