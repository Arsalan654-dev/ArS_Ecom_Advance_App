import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import API_URL from "../../config/api";
import { useTheme } from "../../context/ThemeContext";
import {
  MdMenu,
  MdSearch,
  MdNotificationsNone,
  MdSettings,
  MdLightMode,
  MdDarkMode,
  MdLogout,
  MdPerson,
  MdStore,
} from "react-icons/md";

export const OwnerTopbar = ({ onToggleSidebar, onOpenMobile }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;
  const businessName = user?.businessName || "Owner";
  const initials = (businessName || "O").charAt(0).toUpperCase();

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSignOut = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/signout`, {}, { withCredentials: true });
    } catch (_) {}
    localStorage.clear();
    sessionStorage.clear();
    toast.success("Logged out successfully!");
    navigate("/signin", { replace: true });
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 md:px-6 h-16 gap-3 shrink-0">
      <button
        onClick={onOpenMobile}
        className="lg:hidden p-2 -ml-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
        aria-label="Open menu"
      >
        <MdMenu size={24} />
      </button>

      <button
        onClick={onToggleSidebar}
        className="hidden lg:block p-2 -ml-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
        aria-label="Toggle sidebar"
      >
        <MdMenu size={22} />
      </button>

      <div className="flex-1 max-w-xl">
        <div className="relative">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search orders, menu items..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 border-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <MdLightMode size={20} className="text-amber-500" /> : <MdDarkMode size={20} className="text-violet-500" />}
        </button>

        <button className="relative p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" title="Notifications">
          <MdNotificationsNone size={22} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-semibold flex items-center justify-center overflow-hidden ring-2 ring-transparent hover:ring-violet-300 transition cursor-pointer"
          >
            {user?.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" /> : initials}
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-fade-in text-gray-800 dark:text-gray-100">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="text-sm font-medium truncate">{businessName}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</div>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/owner/restaurant");
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
              >
                <MdStore size={16} /> My Restaurant
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/profile");
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
              >
                <MdPerson size={16} /> My Profile
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/settings");
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
              >
                <MdSettings size={16} /> Settings
              </button>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 border-t border-gray-200 dark:border-gray-700 cursor-pointer"
              >
                <MdLogout size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default OwnerTopbar;