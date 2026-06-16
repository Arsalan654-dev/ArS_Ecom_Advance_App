import React from "react";

export const OwnerStatsCard = ({ title, value, icon: Icon, color, loading, trend, trendValue }) => {
  const getColorClass = () => {
    const colors = {
      violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
      amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    };
    return colors[color] || colors.violet;
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition group">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {title}
          </p>
          {loading ? (
            <div className="mt-2 h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          )}
          {trend && (
            <p className={`mt-1 text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? '↑' : '↓'} {trendValue} from last week
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClass()}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

export default OwnerStatsCard;