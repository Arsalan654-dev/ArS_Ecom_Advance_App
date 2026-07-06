import React from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useCart } from "../../context/CartContext";
import { MdLightMode, MdDarkMode, MdShoppingCart, MdRestaurant, MdStore } from "react-icons/md";
import ChatBot from "../ChatBot";

const PublicLayout = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  const isLoggedIn = !!localStorage.getItem("token");
  const { cartCount } = useCart();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Top Navigation */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-violet-600 text-white font-extrabold text-sm flex items-center justify-center">
              V
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white">Vingo</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/restaurants" className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-violet-600 transition">
              <MdStore size={18} /> Restaurants
            </Link>
            <Link to="/food-items" className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-violet-600 transition">
              <MdRestaurant size={18} /> Food Items
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {/* Cart Icon */}
            {isLoggedIn && (
              <button
                onClick={() => navigate("/cart")}
                className="relative p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                title="Cart"
              >
                <MdShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              {isDark ? <MdLightMode size={20} className="text-amber-500" /> : <MdDarkMode size={20} className="text-violet-500" />}
            </button>

            {isLoggedIn ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition"
              >
                Dashboard
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/signin")}
                  className="px-4 py-2 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg text-sm font-medium transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main>
        <Outlet />
      </main>

      {/* ChatBot */}
      <ChatBot />
    </div>
  );
};

export default PublicLayout;
