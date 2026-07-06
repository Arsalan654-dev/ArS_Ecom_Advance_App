// frontend/src/components/layout/Sidebar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import API_URL from "../../config/api";
import { useCart } from "../../context/CartContext";  // ✅ ADD THIS
import {
  MdDashboard,
  MdPerson,
  MdLocationOn,
  MdSettings,
  MdLogout,
  MdClose,
  MdStore,
  MdCategory,
  MdRestaurantMenu,
  MdLocalShipping,
  MdLocalOffer,
  MdShoppingBag,
  MdAnalytics,
  MdDeliveryDining,
  MdHistory,
  MdFavorite,
  MdShoppingCart,
  MdHome,
  MdPayment,
  MdNotifications,
  MdSmartToy,
} from "react-icons/md";

export const Sidebar = ({ collapsed = false, mobileOpen = false, onMobileClose }) => {
  const navigate = useNavigate();
  const { cartCount } = useCart();  // ✅ ADD THIS

  const handleSignOut = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/signout`, {}, { withCredentials: true });
    } catch (_) {}
    localStorage.clear();
    sessionStorage.clear();
    toast.success("Logged out successfully!");
    navigate("/signin", { replace: true });
  };

  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;
  const userRole = user?.role || "user";
  const initials = (user?.fullName || "V").charAt(0).toUpperCase();

  const getNavItems = () => {
    const common = [
      { to: "/notifications", label: "Notifications", icon: MdNotifications },
      { to: "/profile", label: "Profile", icon: MdPerson },
      { to: "/address-book", label: "Address Book", icon: MdLocationOn },
      { to: "/settings", label: "Settings", icon: MdSettings },
    ];

    if (userRole === "user") {
      return [
        { to: "/dashboard", label: "Dashboard", icon: MdDashboard },
        { to: "/shop", label: "Shop", icon: MdHome },
        { to: "/cart", label: "Cart", icon: MdShoppingCart, badge: cartCount },  // ✅ ADD BADGE
        { to: "/my-orders", label: "My Orders", icon: MdHistory },
        { to: "/wishlist", label: "Wishlist", icon: MdFavorite },
        ...common,
      ];
    }
    
    if (userRole === "owner") {
      return [
        { to: "/owner/dashboard", label: "Dashboard", icon: MdDashboard },
        { to: "/owner/restaurant", label: "My Restaurant", icon: MdStore },
        { to: "/owner/categories", label: "Categories", icon: MdCategory },
        { to: "/owner/menu", label: "Food Menu", icon: MdRestaurantMenu },
        { to: "/owner/delivery-zones", label: "Delivery Zones", icon: MdLocalShipping },
        { to: "/owner/promos", label: "Promo Codes", icon: MdLocalOffer },
        { to: "/owner/orders", label: "Orders", icon: MdShoppingBag },
        { to: "/payment-settings", label: "Payment Settings", icon: MdPayment },
        { to: "/owner/analytics", label: "Analytics", icon: MdAnalytics },
        ...common,
      ];
    }
    
    if (userRole === "deliveryBoy") {
      return [
        { to: "/delivery/assigned-orders", label: "Assigned Orders", icon: MdDeliveryDining },
        { to: "/delivery/history", label: "History", icon: MdHistory },
        { to: "/payment-settings", label: "Payment Settings", icon: MdPayment },
        { to: "/delivery/earnings", label: "Earnings", icon: MdAnalytics },
        ...common,
      ];
    }

    if (userRole === "admin") {
      return [
        { to: "/admin/dashboard", label: "Dashboard", icon: MdDashboard },
        { to: "/admin/restaurants", label: "Restaurants", icon: MdStore },
        { to: "/admin/payments", label: "Payments", icon: MdPayment },
        { to: "/admin/chatbot", label: "VingoBot", icon: MdSmartToy },
        ...common,
      ];
    }
    
    return common;
  };

  const navItems = getNavItems();

  const getRoleBadge = () => {
    if (userRole === "owner") return "Restaurant Owner";
    if (userRole === "deliveryBoy") return "Delivery Partner";
    if (userRole === "admin") return "Administrator";
    return "Customer";
  };

  const getDashboardLink = () => {
    if (userRole === "owner") return "/owner/dashboard";
    if (userRole === "deliveryBoy") return "/delivery/assigned-orders";
    if (userRole === "admin") return "/admin/dashboard";
    return "/dashboard";
  };

  const baseLink = "flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors cursor-pointer relative";
  const inactive = "text-white/85 hover:bg-white/10 hover:text-white";
  const active = "bg-white text-violet-700 shadow-sm";

  const SidebarBody = (
    <aside
      className={`bg-gradient-to-b from-violet-600 to-violet-700 dark:from-violet-800 dark:to-violet-950 flex flex-col h-full transition-all duration-200
        ${collapsed ? "lg:w-20" : "lg:w-64"} w-64`}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
        <NavLink to={getDashboardLink()} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-violet-700 font-extrabold flex items-center justify-center shadow">
            V
          </div>
          {!collapsed && (
            <div>
              <div className="text-white font-bold text-lg leading-none">Vingo</div>
              <div className="text-violet-200 text-xs mt-0.5 truncate max-w-[140px]">
                {user?.fullName?.split(" ")[0] || "Welcome"}
              </div>
              <div className="text-violet-300 text-[10px] mt-0.5">{getRoleBadge()}</div>
            </div>
          )}
        </NavLink>
        <button
          className="lg:hidden text-white/80 hover:text-white cursor-pointer"
          onClick={onMobileClose}
          aria-label="Close menu"
        >
          <MdClose size={22} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to + label}
            to={to}
            end={to === "/dashboard" || to === "/owner/dashboard" || to === "/delivery/assigned-orders"}
            onClick={onMobileClose}
            className={({ isActive }) =>
              `${baseLink} ${isActive && !to.includes("?") ? active : inactive}`
            }
            title={collapsed ? label : ""}
          >
            <Icon size={20} className="shrink-0" />
            {!collapsed && <span className="text-sm">{label}</span>}
            {badge > 0 && !collapsed && (  // ✅ SHOW BADGE
              <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
            {badge > 0 && collapsed && (  // ✅ SHOW BADGE ON COLLAPSED SIDEBAR
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 shrink-0">
        <button onClick={handleSignOut} className={`${baseLink} ${inactive} w-full`} title="Sign out">
          <MdLogout size={20} className="shrink-0" />
          {!collapsed && <span className="text-sm">Sign Out</span>}
        </button>
        {!collapsed && (
          <div className="mt-3 p-3 rounded-lg bg-white/10 text-violet-100 text-xs text-center">
            {getRoleBadge()} Portal
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block shrink-0 h-full">{SidebarBody}</div>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={onMobileClose} />
          <div className="relative z-10 self-stretch">{SidebarBody}</div>
        </div>
      )}
    </>
  );
};

export default Sidebar;