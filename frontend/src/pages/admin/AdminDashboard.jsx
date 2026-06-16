// frontend/src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../../config/api';
import { toast } from 'react-toastify';
import {
    MdDashboard,
    MdPayment,
    MdStore,
    MdPeople,
    MdReceipt,
    MdWarning,
    MdCheckCircle,
    MdRefresh,
    MdTrendingUp,
    MdAccountBalance,
} from 'react-icons/md';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

const StatCard = ({ title, value, icon: Icon, color, loading }) => (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs font-semibold uppercase text-gray-400">{title}</p>
                {loading ? (
                    <div className="mt-2 h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ) : (
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                )}
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={20} className="text-white" />
            </div>
        </div>
    </div>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [recentWebhooks, setRecentWebhooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/admin/stats`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            setStats(res.data.stats);
            setRecentWebhooks(res.data.recentWebhooks || []);
        } catch (error) {
            console.error("Failed to fetch stats:", error);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const getWebhookStatusColor = (eventType) => {
        if (eventType.includes('succeeded') || eventType.includes('paid')) return 'text-green-600';
        if (eventType.includes('failed')) return 'text-red-600';
        return 'text-blue-600';
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-8 w-40 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Admin Dashboard
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        Monitor platform activity, payments, and webhooks
                    </p>
                </div>
                <button
                    onClick={fetchStats}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                    <MdRefresh size={20} />
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Revenue"
                    value={`₨ ${stats?.revenue?.totalRevenue?.toLocaleString() || 0}`}
                    icon={MdAccountBalance}
                    color="bg-green-600"
                    loading={loading}
                />
                <StatCard
                    title="Platform Fees"
                    value={`₨ ${stats?.revenue?.platformFees?.toLocaleString() || 0}`}
                    icon={MdPayment}
                    color="bg-violet-600"
                    loading={loading}
                />
                <StatCard
                    title="Total Orders"
                    value={stats?.orders?.total?.toLocaleString() || 0}
                    icon={MdReceipt}
                    color="bg-blue-600"
                    loading={loading}
                />
                <StatCard
                    title="Today's Orders"
                    value={stats?.orders?.today?.toLocaleString() || 0}
                    icon={MdTrendingUp}
                    color="bg-orange-600"
                    loading={loading}
                />
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    title="Restaurants"
                    value={stats?.users?.restaurants?.toLocaleString() || 0}
                    icon={MdStore}
                    color="bg-purple-600"
                    loading={loading}
                />
                <StatCard
                    title="Delivery Boys"
                    value={stats?.users?.deliveryBoys?.toLocaleString() || 0}
                    icon={MdPeople}
                    color="bg-cyan-600"
                    loading={loading}
                />
                <StatCard
                    title="Total Users"
                    value={stats?.users?.total?.toLocaleString() || 0}
                    icon={MdPeople}
                    color="bg-pink-600"
                    loading={loading}
                />
            </div>

            {/* Stripe Balance */}
            {stats?.stripeBalance && (
                <div className="bg-gradient-to-r from-violet-500 to-violet-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Stripe Balance</h2>
                            <div className="flex gap-6">
                                <div>
                                    <p className="text-sm text-violet-200">Available</p>
                                    <p className="text-2xl font-bold">₨ {stats.stripeBalance.available?.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-violet-200">Pending</p>
                                    <p className="text-2xl font-bold">₨ {stats.stripeBalance.pending?.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        <MdAccountBalance size={48} className="text-violet-200" />
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 text-sm font-medium transition ${
                        activeTab === 'overview'
                            ? 'text-violet-600 border-b-2 border-violet-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Webhook Events
                </button>
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`px-4 py-2 text-sm font-medium transition ${
                        activeTab === 'transactions'
                            ? 'text-violet-600 border-b-2 border-violet-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Transactions
                </button>
            </div>

            {activeTab === 'overview' && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Recent Webhook Events
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Event Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Event ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Created</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                {recentWebhooks.map((webhook) => (
                                    <tr key={webhook._id}>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm font-medium ${getWebhookStatusColor(webhook.eventType)}`}>
                                                {webhook.eventType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-gray-500">
                                            {webhook.eventId?.slice(-12)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(webhook.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {webhook.processed ? (
                                                <span className="flex items-center gap-1 text-green-600">
                                                    <MdCheckCircle size={14} /> Processed
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-yellow-600">
                                                    <MdWarning size={14} /> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => window.open(`/admin/webhook-events/${webhook._id}`, '_blank')}
                                                className="text-violet-600 hover:text-violet-700 text-sm"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'transactions' && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Recent Transactions
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Order ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Restaurant</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Platform Fee</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                {/* Transactions would be loaded here */}
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Load transactions from API
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;