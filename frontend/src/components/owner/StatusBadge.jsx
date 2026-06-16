import React from "react";

export const StatusBadge = ({ status, type = "order" }) => {
  const getOrderStatusConfig = () => {
    const configs = {
      pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
      preparing: { label: "Preparing", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
      ready: { label: "Ready", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
      "out-for-delivery": { label: "Out for Delivery", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
      delivered: { label: "Delivered", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
      cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    };
    return configs[status] || configs.pending;
  };

  const getPromoStatusConfig = () => {
    const configs = {
      active: { label: "Active", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
      inactive: { label: "Inactive", className: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" },
      expired: { label: "Expired", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    };
    return configs[status] || configs.inactive;
  };

  const getCategoryStatusConfig = () => {
    return status 
      ? { label: "Active", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" }
      : { label: "Inactive", className: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" };
  };

  let config;
  if (type === "order") config = getOrderStatusConfig();
  else if (type === "promo") config = getPromoStatusConfig();
  else config = getCategoryStatusConfig();

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;