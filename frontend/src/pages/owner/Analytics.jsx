import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../../config/api";
import {
  MdShowChart,
  MdTrendingUp,
  MdTrendingDown,
  MdStar,
  MdThumbUp,
  MdThumbDown,
  MdSentimentNeutral,
  MdAttachMoney,
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
  Filler,
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
  ArcElement,
  Filler
);

const Analytics = () => {
  const [period, setPeriod] = useState("daily");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [earningsData, setEarningsData] = useState([]);
  const [summary, setSummary] = useState({
    totalEarnings: 0,
    totalDiscount: 0,
    orderCount: 0,
    averageOrderValue: 0,
  });
  const [sentiment, setSentiment] = useState({
    positive: 0,
    neutral: 0,
    negative: 0,
    totalReviews: 0,
  });
  const [topPositiveReviews, setTopPositiveReviews] = useState([]);
  const [topNegativeReviews, setTopNegativeReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
    fetchSentiment();
  }, [period, year, month]);

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({ period });
      if (period === "daily" && month) params.append("month", month);
      if (year) params.append("year", year);
      
      const res = await axios.get(`${API_URL}/api/metrics/earnings?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      
      setEarningsData(res.data.data || []);
      setSummary(res.data.summary);
    } catch (error) {
      toast.error("Failed to load earnings data");
    }
  };

  const fetchSentiment = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/metrics/sentiment`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      
      setSentiment(res.data.sentiment);
      setTopPositiveReviews(res.data.topPositiveReviews || []);
      setTopNegativeReviews(res.data.topNegativeReviews || []);
    } catch (error) {
      toast.error("Failed to load sentiment data");
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    const labels = earningsData.map((item) => item._id);
    const revenue = earningsData.map((item) => item.revenue || 0);
    const counts = earningsData.map((item) => item.count || 0);

    return {
      labels,
      datasets: [
        {
          label: "Revenue (PKR)",
          data: revenue,
          borderColor: "rgb(139, 92, 246)",
          backgroundColor: "rgba(139, 92, 246, 0.1)",
          tension: 0.4,
          fill: true,
          yAxisID: "y",
        },
        {
          label: "Orders Count",
          data: counts,
          borderColor: "rgb(34, 197, 94)",
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          tension: 0.4,
          fill: true,
          yAxisID: "y1",
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { position: "top", labels: { color: "#6B7280" } },
      tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toLocaleString()}` } },
    },
    scales: {
      y: { type: "linear", display: true, position: "left", ticks: { callback: (val) => `₨ ${val.toLocaleString()}` } },
      y1: { type: "linear", display: true, position: "right", grid: { drawOnChartArea: false }, ticks: { callback: (val) => `${val} orders` } },
    },
  };

  const sentimentData = {
    labels: ["Positive", "Neutral", "Negative"],
    datasets: [{
      data: [sentiment.positive, sentiment.neutral, sentiment.negative],
      backgroundColor: ["#22C55E", "#F59E0B", "#EF4444"],
      borderWidth: 0,
    }],
  };

  const StarRating = ({ rating }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? "text-yellow-500" : "text-gray-300"}>
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-96 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Analytics
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Track your restaurant's performance and customer insights
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ₨ {summary.totalEarnings.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <MdShowChart size={20} className="text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {summary.orderCount}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <MdTrendingUp size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400">Average Order Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ₨ {summary.averageOrderValue.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <MdAttachMoney size={20} className="text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {sentiment.totalReviews}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <MdStar size={20} className="text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          {period === "daily" && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString("default", { month: "long" })}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {period === "daily" ? "Daily" : "Monthly"} Revenue & Orders
          </h3>
          <div className="h-80">
            {earningsData.length > 0 ? (
              <Line data={getChartData()} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No data available</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Customer Sentiment</h3>
          <div className="h-48">
            <Doughnut data={sentimentData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2"><MdThumbUp className="text-green-500" /> Positive</span>
              <span className="font-semibold">{sentiment.positive}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2"><MdSentimentNeutral className="text-amber-500" /> Neutral</span>
              <span className="font-semibold">{sentiment.neutral}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2"><MdThumbDown className="text-red-500" /> Negative</span>
              <span className="font-semibold">{sentiment.negative}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Positive Reviews */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-green-50 dark:bg-green-900/10">
            <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
              <MdThumbUp size={20} /> Recent Positive Reviews
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {topPositiveReviews.length > 0 ? (
              topPositiveReviews.map((review, idx) => (
                <div key={idx} className="px-6 py-4">
                  <div className="flex justify-between items-start mb-2">
                    <StarRating rating={review.rating} />
                    <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 italic">"{review.review}"</p>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">No positive reviews yet</div>
            )}
          </div>
        </div>

        {/* Negative Reviews */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-red-50 dark:bg-red-900/10">
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
              <MdThumbDown size={20} /> Areas for Improvement
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {topNegativeReviews.length > 0 ? (
              topNegativeReviews.map((review, idx) => (
                <div key={idx} className="px-6 py-4">
                  <div className="flex justify-between items-start mb-2">
                    <StarRating rating={review.rating} />
                    <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 italic">"{review.review}"</p>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">No negative reviews yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;