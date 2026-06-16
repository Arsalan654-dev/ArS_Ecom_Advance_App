import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../../config/api";
import {
  MdRestaurant,
  MdShoppingBag,
  MdPendingActions,
  MdAttachMoney,
  MdStar,
  MdTrendingUp,
  MdStore,
} from "react-icons/md";
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
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const StatCard = ({ title, value, icon: Icon, color, loading }) => (
  <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{title}</p>
        {loading ? (
          <div className="mt-2 h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ) : (
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        )}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  </div>
);

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    todayOrders: 0,
    pendingOrders: 0,
    todayRevenue: 0,
    averageRating: 0,
    totalRatings: 0,
  });
  const [restaurant, setRestaurant] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [earningsData, setEarningsData] = useState([]);
  const [sentiment, setSentiment] = useState({
    positive: 0,
    neutral: 0,
    negative: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");

      const [metricsRes, restaurantRes, ordersRes, earningsRes, sentimentRes] = await Promise.all([
        axios.get(`${API_URL}/api/metrics/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }),
        axios.get(`${API_URL}/api/restaurant`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }).catch(() => ({ data: { restaurant: null } })),
        axios.get(`${API_URL}/api/order?page=1&limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }).catch(() => ({ data: { orders: [] } })),
        axios.get(`${API_URL}/api/metrics/earnings?period=daily`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/api/metrics/sentiment`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }).catch(() => ({ data: { sentiment: { positive: 0, neutral: 0, negative: 0 } } })),
      ]);

      if (metricsRes.data.success) {
        setMetrics(metricsRes.data.metrics);
      }

      if (restaurantRes.data.restaurant) {
        setRestaurant(restaurantRes.data.restaurant);
      }

      if (ordersRes.data.orders) {
        setRecentOrders(ordersRes.data.orders);
      }

      if (earningsRes.data.data) {
        setEarningsData(earningsRes.data.data.slice(-7));
      }

      if (sentimentRes.data.sentiment) {
        setSentiment(sentimentRes.data.sentiment);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: earningsData.map((item) => item._id),
    datasets: [
      {
        label: "Revenue (PKR)",
        data: earningsData.map((item) => item.revenue || 0),
        borderColor: "rgb(139, 92, 246)",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#6B7280" },
      },
    },
    scales: {
      y: {
        ticks: { color: "#6B7280" },
        grid: { color: "#374151" },
      },
      x: {
        ticks: { color: "#6B7280" },
        grid: { display: false },
      },
    },
  };

  const sentimentData = {
    labels: ["Positive", "Neutral", "Negative"],
    datasets: [
      {
        data: [sentiment.positive, sentiment.neutral, sentiment.negative],
        backgroundColor: ["#22C55E", "#F59E0B", "#EF4444"],
        borderWidth: 0,
      },
    ],
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      preparing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      ready: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      "out-for-delivery": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return colors[status] || colors.pending;
  };

  if (!restaurant && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <MdStore size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Restaurant Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            You haven't created a restaurant yet. Get started by setting up your restaurant.
          </p>
          <button
            onClick={() => navigate("/owner/restaurant")}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition"
          >
            Create Restaurant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Welcome back, {restaurant?.businessName || "Owner"} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Here's what's happening with your restaurant today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Today's Orders"
          value={metrics.todayOrders}
          icon={MdShoppingBag}
          color="bg-violet-600"
          loading={loading}
        />
        <StatCard
          title="Pending Orders"
          value={metrics.pendingOrders}
          icon={MdPendingActions}
          color="bg-amber-500"
          loading={loading}
        />
        <StatCard
          title="Today's Revenue"
          value={`₨ ${metrics.todayRevenue.toLocaleString()}`}
          icon={MdAttachMoney}
          color="bg-green-600"
          loading={loading}
        />
        <StatCard
          title="Avg Rating"
          value={metrics.averageRating > 0 ? `${metrics.averageRating} ★` : "No ratings"}
          icon={MdStar}
          color="bg-yellow-500"
          loading={loading}
        />
        <StatCard
          title="Total Ratings"
          value={metrics.totalRatings}
          icon={MdTrendingUp}
          color="bg-blue-600"
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Trend (Last 7 Days)</h3>
          <div className="h-80">
            {earningsData.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No data available</div>
            )}
          </div>
        </div>

        {/* Sentiment Analysis */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Customer Sentiment</h3>
          <div className="h-64">
            <Doughnut data={sentimentData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Positive</span>
              <span className="font-semibold">{sentiment.positive}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-amber-500">Neutral</span>
              <span className="font-semibold">{sentiment.neutral}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-500">Negative</span>
              <span className="font-semibold">{sentiment.negative}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
          <button
            onClick={() => navigate("/owner/orders")}
            className="text-sm text-violet-600 hover:text-violet-700 font-medium"
          >
            View All →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {recentOrders.map((order) => (
                <tr
                  key={order._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition"
                  onClick={() => navigate(`/owner/orders/${order._id}`)}
                >
                  <td className="px-6 py-4 text-sm font-mono text-gray-900 dark:text-gray-100">
                    #{order._id.slice(-8)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {order.customer?.fullName || "Guest"}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                    ₨ {order.totalAmount?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status?.replace("-", " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;