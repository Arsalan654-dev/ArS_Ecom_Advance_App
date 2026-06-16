// frontend/src/pages/owner/Orders.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../../config/api";
import {
  MdFilterList,
  MdVisibility,
  MdLocalShipping,
  MdPerson,
  MdChevronLeft,
  MdChevronRight,
  MdDelete,
} from "react-icons/md";

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    startDate: "",
    endDate: "",
    customerName: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [filters, pagination.currentPage]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...(filters.status && { status: filters.status }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.customerName && { customerName: filters.customerName }),
      });
      
      const res = await axios.get(`${API_URL}/api/order?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      
      setOrders(res.data.orders || []);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error("Fetch orders error:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingStatus(orderId);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/api/order/${orderId}/status`,
        { newStatus },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update status");
    } finally {
      setUpdatingStatus(null);
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
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete order");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusOptions = (currentStatus) => {
    if (currentStatus === 'payment_pending') {
      return [];
    }
    
    const transitions = {
      pending: ["preparing", "cancelled"],
      preparing: ["ready", "cancelled"],
      ready: ["out-for-delivery", "cancelled"],
      "out-for-delivery": ["delivered", "cancelled"],
      delivered: [],
      cancelled: [],
    };
    return transitions[currentStatus] || [];
  };

  const getStatusColor = (status) => {
    const colors = {
      payment_pending: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
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

  const resetFilters = () => {
    setFilters({ status: "", startDate: "", endDate: "", customerName: "" });
    setPagination({ ...pagination, currentPage: 1 });
  };

  const getPageNumbers = () => {
    const { currentPage, totalPages } = pagination;
    const pages = [];
    
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

  const canDelete = (status) => {
    return status === 'delivered' || status === 'cancelled';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Orders
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            {pagination.totalItems} total orders
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition hover:bg-gray-200"
        >
          <MdFilterList size={18} />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Order Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, currentPage: 1 })}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              >
                <option value="">All Status</option>
                <option value="payment_pending">Payment Pending</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="out-for-delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Customer Name</label>
              <input
                type="text"
                placeholder="Search by customer..."
                value={filters.customerName}
                onChange={(e) => setFilters({ ...filters, customerName: e.target.value })}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button onClick={resetFilters} className="px-4 py-1.5 text-sm text-violet-600 hover:text-violet-700 font-medium">
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <MdLocalShipping size={48} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No orders found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {Object.values(filters).some(v => v) ? "Try changing your filters" : "Orders will appear here when customers place them"}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {orders.map((order) => {
                  const statusOptions = getStatusOptions(order.status);
                  const isPaymentPending = order.status === 'payment_pending';
                  const showDelete = canDelete(order.status);
                  
                  return (
                    <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-900 dark:text-white">
                          #{order._id.slice(-8)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MdPerson size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {order.customer?.fullName || "Guest"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {order.foodItems?.length || 0} items
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          ₨ {order.totalAmount?.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                          {isPaymentPending && (
                            <span className="text-xs text-gray-400">(Waiting for payment)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/owner/orders/${order._id}`)}
                            className="p-1.5 rounded-lg text-violet-600 hover:bg-violet-50 transition"
                            title="View Details"
                          >
                            <MdVisibility size={18} />
                          </button>
                          
                          {statusOptions.length > 0 && !isPaymentPending && (
                            <select
                              value=""
                              onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                              disabled={updatingStatus === order._id}
                              className="text-xs p-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                            >
                              <option value="">Update Status</option>
                              {statusOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt.replace("-", " ").toUpperCase()}
                                </option>
                              ))}
                            </select>
                          )}
                          
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
                          
                          {isPaymentPending && (
                            <span className="text-xs text-gray-400 italic">Awaiting payment</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
            {pagination.totalItems} orders
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;