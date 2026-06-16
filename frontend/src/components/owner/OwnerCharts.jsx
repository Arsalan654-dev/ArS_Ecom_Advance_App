import React from "react";
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
import { Line, Bar, Doughnut, Pie } from "react-chartjs-2";

// Register ChartJS components
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

// Line Chart Component
export const RevenueLineChart = ({ data, labels, loading, height = 300 }) => {
  const chartData = {
    labels: labels || data?.map((item) => item._id) || [],
    datasets: [
      {
        label: "Revenue (PKR)",
        data: data?.map((item) => item.revenue || item.total || 0) || [],
        borderColor: "rgb(139, 92, 246)",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: "rgb(139, 92, 246)",
        pointBorderColor: "#fff",
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#6B7280", font: { size: 11 } },
      },
      tooltip: {
        callbacks: {
          label: (context) => `₨ ${context.raw.toLocaleString()}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => `₨ ${value.toLocaleString()}`,
          color: "#6B7280",
        },
        grid: { color: "#E5E7EB" },
      },
      x: {
        ticks: { color: "#6B7280" },
        grid: { display: false },
      },
    },
  };

  if (loading) {
    return (
      <div className="h-full min-h-[300px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
        <span className="text-gray-400">Loading chart...</span>
      </div>
    );
  }

  return (
    <div style={{ height: `${height}px` }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

// Bar Chart Component
export const OrdersBarChart = ({ data, labels, loading, height = 300 }) => {
  const chartData = {
    labels: labels || data?.map((item) => item._id) || [],
    datasets: [
      {
        label: "Orders Count",
        data: data?.map((item) => item.count || 0) || [],
        backgroundColor: "rgba(139, 92, 246, 0.7)",
        borderColor: "rgb(139, 92, 246)",
        borderWidth: 1,
        borderRadius: 8,
      },
      {
        label: "Revenue (PKR)",
        data: data?.map((item) => (item.revenue || 0) / 100) || [],
        backgroundColor: "rgba(34, 197, 94, 0.7)",
        borderColor: "rgb(34, 197, 94)",
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#6B7280", font: { size: 11 } },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label;
            const value = context.raw;
            if (label === "Revenue (PKR)") {
              return `${label}: ₨ ${(value * 100).toLocaleString()}`;
            }
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: { color: "#6B7280" },
        grid: { color: "#E5E7EB" },
      },
      x: {
        ticks: { color: "#6B7280" },
        grid: { display: false },
      },
    },
  };

  if (loading) {
    return (
      <div className="h-full min-h-[300px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
        <span className="text-gray-400">Loading chart...</span>
      </div>
    );
  }

  return (
    <div style={{ height: `${height}px` }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

// Doughnut Chart Component
export const SentimentDoughnut = ({ positive, neutral, negative, loading, height = 250 }) => {
  const chartData = {
    labels: ["Positive", "Neutral", "Negative"],
    datasets: [
      {
        data: [positive || 0, neutral || 0, negative || 0],
        backgroundColor: ["#22C55E", "#F59E0B", "#EF4444"],
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#6B7280", font: { size: 11 } },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.raw}%`,
        },
      },
    },
    cutout: "60%",
  };

  if (loading) {
    return (
      <div className="h-full min-h-[250px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
        <span className="text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div style={{ height: `${height}px` }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

// Pie Chart Component
export const CategoryDistributionPie = ({ categories, loading, height = 300 }) => {
  const chartData = {
    labels: categories?.map((cat) => cat.name) || [],
    datasets: [
      {
        data: categories?.map((cat) => cat.count || 0) || [],
        backgroundColor: [
          "#8B5CF6",
          "#EC4899",
          "#06B6D4",
          "#F59E0B",
          "#10B981",
          "#EF4444",
          "#6366F1",
          "#14B8A6",
        ],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: { color: "#6B7280", font: { size: 10 } },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.raw} items`,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="h-full min-h-[300px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
        <span className="text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div style={{ height: `${height}px` }}>
      <Pie data={chartData} options={options} />
    </div>
  );
};

// Dual Axis Line Chart (Revenue + Orders)
export const DualAxisChart = ({ data, loading, height = 350 }) => {
  const chartData = {
    labels: data?.map((item) => item._id) || [],
    datasets: [
      {
        label: "Revenue (PKR)",
        data: data?.map((item) => item.revenue || 0) || [],
        borderColor: "rgb(139, 92, 246)",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        yAxisID: "y",
      },
      {
        label: "Orders",
        data: data?.map((item) => item.count || 0) || [],
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        yAxisID: "y1",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#6B7280", font: { size: 11 } },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label;
            const value = context.raw;
            if (label === "Revenue (PKR)") {
              return `${label}: ₨ ${value.toLocaleString()}`;
            }
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: { display: true, text: "Revenue (PKR)", color: "#6B7280" },
        ticks: { callback: (val) => `₨ ${val.toLocaleString()}`, color: "#6B7280" },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        title: { display: true, text: "Orders", color: "#6B7280" },
        ticks: { color: "#6B7280" },
        grid: { drawOnChartArea: false },
      },
      x: {
        ticks: { color: "#6B7280" },
        grid: { display: false },
      },
    },
  };

  if (loading) {
    return (
      <div className="h-full min-h-[350px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
        <span className="text-gray-400">Loading chart...</span>
      </div>
    );
  }

  return (
    <div style={{ height: `${height}px` }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

// Simple Stats Card with Mini Sparkline
export const StatsCardWithSparkline = ({ title, value, trend, sparklineData, loading }) => {
  const miniChartData = {
    labels: sparklineData?.map((_, i) => i) || [],
    datasets: [
      {
        data: sparklineData || [],
        borderColor: trend > 0 ? "#22C55E" : "#EF4444",
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
    elements: { point: { radius: 0 } },
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 animate-pulse">
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 hover:shadow-md transition">
      <p className="text-xs font-semibold text-gray-400">{title}</p>
      <div className="flex items-end justify-between mt-1">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {sparklineData && sparklineData.length > 0 && (
          <div className="w-20 h-8">
            <Line data={miniChartData} options={options} />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <p className={`text-xs mt-2 ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% from last period
        </p>
      )}
    </div>
  );
};

// Performance Gauge Chart
export const PerformanceGauge = ({ value, label, loading, height = 200 }) => {
  const chartData = {
    labels: ["Performance", "Remaining"],
    datasets: [
      {
        data: [value, 100 - value],
        backgroundColor: ["#8B5CF6", "#E5E7EB"],
        borderWidth: 0,
        circumference: 180,
        rotation: 270,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw}%` } },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" style={{ height: `${height}px` }}>
        <span className="text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height: `${height}px` }}>
      <Doughnut data={chartData} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">{value}%</span>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
    </div>
  );
};

// Export all as default
const OwnerCharts = {
  RevenueLineChart,
  OrdersBarChart,
  SentimentDoughnut,
  CategoryDistributionPie,
  DualAxisChart,
  StatsCardWithSparkline,
  PerformanceGauge,
};

export default OwnerCharts;