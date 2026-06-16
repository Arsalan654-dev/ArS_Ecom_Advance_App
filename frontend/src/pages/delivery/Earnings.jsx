// frontend/src/pages/delivery/Earnings.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../../config/api";
import { MdAttachMoney, MdLocalShipping, MdTrendingUp, MdCalendarToday } from "react-icons/md";

const DeliveryEarnings = () => {
  const [earnings, setEarnings] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    totalDeliveries: 0,
  });
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
    fetchRecentDeliveries();
  }, []);

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/delivery/earnings`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setEarnings(res.data);
    } catch (error) {
      console.error("Earnings error:", error);
      toast.error("Failed to load earnings data");
    }
  };

  const fetchRecentDeliveries = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/delivery/recent-deliveries?limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setRecentDeliveries(res.data.deliveries || []);
    } catch (error) {
      console.error("Recent deliveries error:", error);
      // Don't show toast for this, it's not critical
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          My Earnings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Track your delivery earnings and performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400">Total Earnings</p>
              <p className="text-2xl font-bold text-green-600">₨ {earnings.total?.toLocaleString()}</p>
            </div>
            <MdAttachMoney size={32} className="text-green-500" />
          </div>
          <p className="text-xs text-gray-400 mt-2">{earnings.totalDeliveries} deliveries completed</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400">Today's Earnings</p>
              <p className="text-2xl font-bold text-violet-600">₨ {earnings.today?.toLocaleString()}</p>
            </div>
            <MdCalendarToday size={32} className="text-violet-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400">This Week</p>
              <p className="text-2xl font-bold text-blue-600">₨ {earnings.thisWeek?.toLocaleString()}</p>
            </div>
            <MdTrendingUp size={32} className="text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400">This Month</p>
              <p className="text-2xl font-bold text-purple-600">₨ {earnings.thisMonth?.toLocaleString()}</p>
            </div>
            <MdLocalShipping size={32} className="text-purple-500" />
          </div>
        </div>
      </div>

      {/* Recent Deliveries */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Deliveries</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {recentDeliveries.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">No deliveries yet</div>
          ) : (
            recentDeliveries.map((delivery) => (
              <div key={delivery._id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">
                    {delivery.restaurant?.businessName || "Restaurant"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {delivery.distanceKm?.toFixed(1)} km • {formatDate(delivery.deliveredAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">₨ {delivery.earnings}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4 border border-violet-200 dark:border-violet-800">
        <p className="text-sm text-violet-800 dark:text-violet-300">
          💡 You earn <strong className="font-bold">₨ 10 per km</strong> for every delivery. Complete more deliveries to increase your earnings!
        </p>
      </div>
    </div>
  );
};

export default DeliveryEarnings;