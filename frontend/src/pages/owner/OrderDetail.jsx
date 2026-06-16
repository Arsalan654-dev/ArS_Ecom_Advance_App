import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../../config/api";
import StatusBadge from "../../components/owner/StatusBadge";
import {
  MdArrowBack,
  MdPerson,
  MdLocationOn,
  MdPhone,
  MdEmail,
  MdFastfood,
  MdAttachMoney,
  MdLocalOffer,
  MdDeliveryDining,
  MdUpdate,
} from "react-icons/md";

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/order/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setOrder(res.data.order);
    } catch (error) {
      toast.error("Failed to load order details");
      navigate("/owner/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/api/order/${orderId}/status`,
        { newStatus },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrderDetail();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusOptions = () => {
    const transitions = {
      pending: ["preparing", "cancelled"],
      preparing: ["ready", "cancelled"],
      ready: ["out-for-delivery", "cancelled"],
      "out-for-delivery": ["delivered", "cancelled"],
      delivered: [],
      cancelled: [],
    };
    return transitions[order?.status] || [];
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
          onClick={() => navigate("/owner/orders")}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <MdArrowBack size={24} />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Order #{order._id.slice(-8)}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Items & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MdFastfood size={20} /> Order Items
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {order.foodItems?.map((item, idx) => (
                <div key={idx} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.foodItem?.name || "Item"}</p>
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ₨ {(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium">₨ {order.totalAmount?.toLocaleString()}</span>
                </div>
                {order.discountApplied > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Discount</span>
                    <span className="text-green-600">- ₨ {order.discountApplied.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span>Total</span>
                  <span className="text-violet-600">₨ {order.totalAmount?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MdUpdate size={20} /> Order Timeline
            </h2>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
              <div className="space-y-6">
                {["pending", "preparing", "ready", "out-for-delivery", "delivered"].map((status, idx) => {
                  const isCompleted = order.status === status || 
                    (status === "pending" && ["preparing", "ready", "out-for-delivery", "delivered"].includes(order.status)) ||
                    (status === "preparing" && ["ready", "out-for-delivery", "delivered"].includes(order.status)) ||
                    (status === "ready" && ["out-for-delivery", "delivered"].includes(order.status)) ||
                    (status === "out-for-delivery" && order.status === "delivered");
                  const isCurrent = order.status === status;
                  
                  return (
                    <div key={status} className="relative flex items-start gap-4">
                      <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted ? "bg-green-500 text-white" : 
                        isCurrent ? "bg-violet-500 text-white animate-pulse" : 
                        "bg-gray-200 dark:bg-gray-700 text-gray-400"
                      }`}>
                        {isCompleted ? "✓" : idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${
                          isCurrent ? "text-violet-600 dark:text-violet-400" : 
                          isCompleted ? "text-gray-900 dark:text-white" : "text-gray-400"
                        }`}>
                          {status.replace("-", " ").toUpperCase()}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-gray-500 mt-1">
                            Current status - {new Date(order.statusUpdatedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Customer & Delivery Info */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MdPerson size={20} /> Customer Details
            </h2>
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Name:</strong> {order.customer?.fullName || "Guest"}
              </p>
              <p className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <MdEmail size={16} /> {order.customer?.email || "N/A"}
              </p>
              <p className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <MdPhone size={16} /> {order.customer?.mobile || "N/A"}
              </p>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MdLocationOn size={20} /> Delivery Address
            </h2>
            <div className="space-y-2">
              <p className="text-gray-700 dark:text-gray-300">
                {order.deliveryAddress?.receiverName && (
                  <><strong>Receiver:</strong> {order.deliveryAddress.receiverName}<br /></>
                )}
                {order.deliveryAddress?.fullAddress}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}
              </p>
              {order.deliveryAddress?.phoneNumber && (
                <p className="text-gray-700 dark:text-gray-300 flex items-center gap-2 mt-2">
                  <MdPhone size={14} /> {order.deliveryAddress.phoneNumber}
                </p>
              )}
            </div>
          </div>

          {/* Delivery Info */}
          {order.delivery && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MdDeliveryDining size={20} /> Delivery Partner
              </h2>
              <div className="space-y-2">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Delivery Boy:</strong> {order.delivery?.deliveryBoy?.fullName || "Assigned"}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Est. Time:</strong> {order.delivery?.estimatedTime} minutes
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Assigned At:</strong> {new Date(order.delivery?.assignedAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Promo Code */}
          {order.promoCode && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <MdLocalOffer size={20} /> Promo Code Applied
              </h2>
              <p className="font-mono text-lg font-bold text-violet-600">{order.promoCode}</p>
              <p className="text-sm text-gray-500">Discount: ₨ {order.discountApplied}</p>
            </div>
          )}

          {/* Payment Info */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <MdAttachMoney size={20} /> Payment
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Method:</strong> {order.paymentMethod === "online" ? "Online Payment" : "Cash on Delivery"}
            </p>
          </div>

          {/* Status Update */}
          {getStatusOptions().length > 0 && order.status !== "delivered" && order.status !== "cancelled" && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Update Status</h2>
              <div className="flex flex-wrap gap-2">
                {getStatusOptions().map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(status)}
                    disabled={updating}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      status === "cancelled"
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-violet-600 hover:bg-violet-700 text-white"
                    } disabled:opacity-50`}
                  >
                    {updating ? "Updating..." : status.replace("-", " ").toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ratings & Review */}
          {order.ratedByCustomer && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Customer Review</h2>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-500 text-lg">★</span>
                <span className="font-bold">{order.ratings}/5</span>
              </div>
              {order.review && (
                <p className="text-gray-600 dark:text-gray-400 italic">"{order.review}"</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;