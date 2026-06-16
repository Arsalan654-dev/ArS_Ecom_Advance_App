// frontend/src/pages/delivery/DeliveryHistory.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL from "../../config/api";
import { 
    MdHistory, MdCheckCircle, MdDelete, MdDeleteSweep, 
    MdSearch, MdFilterList, MdChevronLeft, MdChevronRight,
    MdSort, MdRefresh 
} from "react-icons/md";
import { toast } from "react-toastify";

const DeliveryHistory = () => {
    const navigate = useNavigate();
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [deletingAll, setDeletingAll] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        search: "",
        startDate: "",
        endDate: "",
        minEarnings: "",
        maxEarnings: ""
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
    });
    const [sortConfig, setSortConfig] = useState({
        field: "deliveredAt",
        order: "desc"
    });

    useEffect(() => {
        fetchDeliveryHistory();
    }, [pagination.currentPage, sortConfig, filters]);

    const fetchDeliveryHistory = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const params = new URLSearchParams({
                page: pagination.currentPage,
                limit: pagination.itemsPerPage,
                sortBy: sortConfig.field,
                sortOrder: sortConfig.order,
                ...(filters.search && { search: filters.search }),
                ...(filters.startDate && { startDate: filters.startDate }),
                ...(filters.endDate && { endDate: filters.endDate }),
                ...(filters.minEarnings && { minEarnings: filters.minEarnings }),
                ...(filters.maxEarnings && { maxEarnings: filters.maxEarnings })
            });
            
            const res = await axios.get(`${API_URL}/api/delivery/history?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            
            setDeliveries(res.data.deliveries || []);
            if (res.data.pagination) {
                setPagination(res.data.pagination);
            }
        } catch (error) {
            console.error("Failed to load delivery history:", error);
            toast.error("Failed to load history");
        } finally {
            setLoading(false);
        }
    };

    const deleteDelivery = async (deliveryId, e) => {
        e.stopPropagation();
        
        if (!confirm("Are you sure you want to delete this delivery record? This action cannot be undone.")) {
            return;
        }
        
        setDeletingId(deliveryId);
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_URL}/api/delivery/${deliveryId}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            toast.success("Delivery record deleted successfully");
            fetchDeliveryHistory();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to delete delivery record");
        } finally {
            setDeletingId(null);
        }
    };

    const deleteAllDeliveries = async () => {
        if (deliveries.length === 0) {
            toast.info("No deliveries to delete");
            return;
        }
        
        if (!confirm(`Are you sure you want to delete ALL ${pagination.totalItems} delivery records? This action cannot be undone.`)) {
            return;
        }
        
        setDeletingAll(true);
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_URL}/api/delivery/all`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            toast.success("All delivery records deleted successfully");
            fetchDeliveryHistory();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to delete delivery records");
        } finally {
            setDeletingAll(false);
        }
    };

    const resetFilters = () => {
        setFilters({ search: "", startDate: "", endDate: "", minEarnings: "", maxEarnings: "" });
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        toast.info("Filters cleared");
    };

    const handleSort = (field) => {
        setSortConfig(prev => ({
            field: field,
            order: prev.field === field && prev.order === "desc" ? "asc" : "desc"
        }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const getSortIcon = (field) => {
        if (sortConfig.field !== field) {
            return <MdSort size={14} className="inline ml-1 opacity-50" />;
        }
        return sortConfig.order === "desc" ? "↓" : "↑";
    };

    const formatDate = (date) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
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
                <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Delivery History
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        {pagination.totalItems} delivery{pagination.totalItems !== 1 ? 's' : ''} completed
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={fetchDeliveryHistory}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition hover:bg-gray-200"
                        title="Refresh"
                    >
                        <MdRefresh size={18} />
                        Refresh
                    </button>
                    {deliveries.length > 0 && (
                        <button
                            onClick={deleteAllDeliveries}
                            disabled={deletingAll}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                        >
                            <MdDeleteSweep size={18} />
                            {deletingAll ? "Deleting..." : "Delete All"}
                        </button>
                    )}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition hover:bg-gray-200"
                    >
                        <MdFilterList size={18} />
                        {showFilters ? "Hide Filters" : "Show Filters"}
                    </button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Search</label>
                            <div className="relative">
                                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Restaurant or customer..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="w-full pl-9 p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                                />
                            </div>
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
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Min Earnings</label>
                            <input
                                type="number"
                                placeholder="Min ₨"
                                value={filters.minEarnings}
                                onChange={(e) => setFilters({ ...filters, minEarnings: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Max Earnings</label>
                            <input
                                type="number"
                                placeholder="Max ₨"
                                value={filters.maxEarnings}
                                onChange={(e) => setFilters({ ...filters, maxEarnings: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                            />
                        </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                        <button onClick={resetFilters} className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700">
                            Clear All
                        </button>
                    </div>
                </div>
            )}

            {/* History Table */}
            {deliveries.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    <MdHistory size={64} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No delivery history found</p>
                    {Object.values(filters).some(v => v) && (
                        <button onClick={resetFilters} className="mt-4 text-violet-600 hover:text-violet-700">
                            Clear Filters
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer hover:text-violet-600" onClick={() => handleSort("order")}>
                                            Order ID {getSortIcon("order")}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer hover:text-violet-600" onClick={() => handleSort("restaurant.businessName")}>
                                            Restaurant {getSortIcon("restaurant.businessName")}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer hover:text-violet-600" onClick={() => handleSort("distanceKm")}>
                                            Distance (km) {getSortIcon("distanceKm")}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer hover:text-violet-600" onClick={() => handleSort("earnings")}>
                                            Earnings (₨) {getSortIcon("earnings")}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer hover:text-violet-600" onClick={() => handleSort("deliveredAt")}>
                                            Delivered At {getSortIcon("deliveredAt")}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {deliveries.map((delivery) => (
                                        <tr 
                                            key={delivery._id} 
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition cursor-pointer" 
                                            onClick={() => navigate(`/delivery/orders/${delivery.order?._id}`)}
                                        >
                                            <td className="px-6 py-4 font-mono text-sm">
                                                #{delivery.order?._id?.slice(-8)}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {delivery.restaurant?.businessName || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {delivery.distanceKm?.toFixed(1)} km
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-green-600">
                                                ₨ {delivery.earnings}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <MdCheckCircle className="text-green-500" size={14} />
                                                    <span className="text-xs text-gray-500">{formatDate(delivery.deliveredAt)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={(e) => deleteDelivery(delivery._id, e)}
                                                    disabled={deletingId === delivery._id}
                                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                                                    title="Delete Record"
                                                >
                                                    {deletingId === delivery._id ? (
                                                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <MdDelete size={16} />
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
                                    {getPageNumbers().map((pageNum) => (
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
                                {pagination.totalItems} deliveries
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default DeliveryHistory;