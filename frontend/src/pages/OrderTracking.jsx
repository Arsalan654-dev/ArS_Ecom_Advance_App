// frontend/src/pages/OrderTracking.jsx (Updated)
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import API_URL from "../config/api";
import DeliveryBoyLocationTracker from "../components/DeliveryBoyLocationTracker";
import { MdCheckCircle, MdLocalShipping, MdRestaurant, MdDeliveryDining } from "react-icons/md";

const OrderTracking = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrder();
        const interval = setInterval(fetchOrder, 15000);
        return () => clearInterval(interval);
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/api/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            setOrder(res.data.order);
        } catch (error) {
            console.error("Failed to fetch order:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStep = () => {
        const steps = ["pending", "preparing", "ready", "out-for-delivery", "delivered"];
        return steps.indexOf(order?.status);
    };

    const statusConfig = {
        pending: { label: "Order Received", icon: MdCheckCircle, color: "bg-gray-400" },
        preparing: { label: "Preparing", icon: MdRestaurant, color: "bg-blue-500" },
        ready: { label: "Ready", icon: MdCheckCircle, color: "bg-purple-500" },
        "out-for-delivery": { label: "Out for Delivery", icon: MdLocalShipping, color: "bg-orange-500" },
        delivered: { label: "Delivered", icon: MdDeliveryDining, color: "bg-green-500" },
    };

    if (loading) return <div className="animate-pulse">Loading...</div>;

    const currentStep = getStatusStep();

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Track Your Order</h1>
                <p className="text-gray-500 mt-1">Order #{orderId?.slice(-8)}</p>
            </div>

            {/* Progress Steps */}
            <div className="relative">
                <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
                    <div
                        className="h-full bg-violet-600 transition-all duration-500"
                        style={{ width: `${(currentStep / 4) * 100}%` }}
                    />
                </div>
                <div className="relative flex justify-between">
                    {Object.entries(statusConfig).map(([status, config], idx) => {
                        const Icon = config.icon;
                        const isCompleted = idx <= currentStep;
                        return (
                            <div key={status} className="text-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto ${
                                        isCompleted ? config.color : "bg-gray-300 dark:bg-gray-600"
                                    } text-white`}
                                >
                                    <Icon size={20} />
                                </div>
                                <p className="text-xs mt-2 font-medium">{config.label}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Live Location Tracking for out-for-delivery status */}
            {order?.status === "out-for-delivery" && order?.deliveryAddress && (
                <DeliveryBoyLocationTracker 
                    orderId={orderId} 
                    deliveryAddress={order.deliveryAddress}
                />
            )}

            {/* Order Details */}
            {order && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
                    <h3 className="font-semibold text-lg">Order Details</h3>
                    {order.foodItems?.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                            <span>{item.foodItem?.name} x {item.quantity}</span>
                            <span>₨ {(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                    ))}
                    <div className="border-t pt-3">
                        <div className="flex justify-between font-bold">
                            <span>Total</span>
                            <span className="text-violet-600">₨ {order.totalAmount?.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderTracking;