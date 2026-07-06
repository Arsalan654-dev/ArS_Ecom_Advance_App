// frontend/src/App.jsx
import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Auth Pages
import SignUp from "./pages/SignuP";
import SignIn from "./pages/SignIn";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyEmail from "./pages/VerifyEmail";
import TwoFactorVerify from "./pages/TwoFactorVerify";
import SetPassword from "./pages/SetPassword";

// Common Pages (All roles can access)
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import AddressBook from "./pages/AddressBook";
import Settings from "./pages/Settings";

// Customer Only Pages
import Shop from "./pages/Shop";
import RestaurantDetail from "./pages/RestaurantDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderTracking from "./pages/OrderTracking";
import MyOrders from "./pages/MyOrders";
import Wishlist from "./pages/Wishlist";

// Owner Only Pages
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import RestaurantSetup from "./pages/owner/RestaurantSetup";
import FoodCategories from "./pages/owner/FoodCategories";
import FoodMenu from "./pages/owner/FoodMenu";
import DeliveryZones from "./pages/owner/DeliveryZones";
import PromoCodes from "./pages/owner/PromoCodes";
import Orders from "./pages/owner/Orders";
import OrderDetail from "./pages/owner/OrderDetail";
import Analytics from "./pages/owner/Analytics";

// Delivery Boy Only Pages
import AssignedOrders from "./pages/delivery/AssignedOrders";
import DeliveryEarnings from "./pages/delivery/Earnings";
import DeliveryOrderDetail from "./pages/delivery/DeliveryOrderDetail";
import DeliveryHistory from "./pages/delivery/DeliveryHistory";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import PublicLayout from "./components/layout/PublicLayout";
import { useTheme } from "./context/ThemeContext";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminRestaurants from "./pages/admin/AdminRestaurants";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminChatBot from "./pages/admin/AdminChatBot";
import PaymentSettings from "./pages/PaymentSettings";
import Notifications from "./pages/Notifications";
import DeliveryTracking from "./pages/delivery/DeliveryTracking";
import PaymentPage from "./pages/PaymentPage";

// Guest/Public Pages
import HomePage from "./pages/HomePage";
import AllRestaurants from "./pages/AllRestaurants";
import AllFoodItems from "./pages/AllFoodItems";
import PublicRestaurantDetail from "./pages/PublicRestaurantDetail";
import PublicFoodItemDetail from "./pages/PublicFoodItemDetail";

const RoleBasedRoute = ({ children, allowedRoles }) => {
  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;
  const userRole = user?.role || "user";

  if (!allowedRoles.includes(userRole)) {
    if (userRole === "owner") return <Navigate to="/owner/dashboard" replace />;
    if (userRole === "deliveryBoy") return <Navigate to="/delivery/assigned-orders" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App = () => {
  const { theme } = useTheme();

  const getUserRole = () => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const parsed = JSON.parse(user);
        return parsed.role || "user";
      } catch (e) {
        return "user";
      }
    }
    return "user";
  };

  const userRole = getUserRole();

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme === "dark" ? "dark" : "light"}
      />
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
        <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/two-factor-verify" element={<TwoFactorVerify />} />
        <Route path="/set-password" element={<PublicRoute><SetPassword /></PublicRoute>} />

        {/* Public/Guest Routes (no login required) */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/restaurants" element={<AllRestaurants />} />
          <Route path="/food-items" element={<AllFoodItems />} />
          <Route path="/food-item/:id" element={<PublicFoodItemDetail />} />
          <Route path="/restaurant/:id" element={<PublicRestaurantDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment/:orderId" element={<PaymentPage />} />
          <Route path="/order-tracking/:orderId" element={<OrderTracking />} />
        </Route>

        {/* Protected Routes with Dashboard Layout */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          {/* Common Routes - All Roles */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/address-book" element={<AddressBook />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/payment-settings" element={<PaymentSettings />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/payment/:orderId" element={<PaymentPage />} />

          <Route path="/admin/dashboard" element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </RoleBasedRoute>
          } />
          <Route path="/admin/restaurants" element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <AdminRestaurants />
            </RoleBasedRoute>
          } />
          <Route path="/admin/payments" element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <AdminPayments />
            </RoleBasedRoute>
          } />
          <Route path="/admin/chatbot" element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <AdminChatBot />
            </RoleBasedRoute>
          } />

          {/* Shop and Restaurant pages - Now inside layout */}
          <Route path="/shop" element={
            <RoleBasedRoute allowedRoles={["user"]}>
              <Shop />
            </RoleBasedRoute>
          } />
          <Route path="/restaurant/:id" element={
            <RoleBasedRoute allowedRoles={["user"]}>
              <RestaurantDetail />
            </RoleBasedRoute>
          } />
          <Route path="/cart" element={
            <RoleBasedRoute allowedRoles={["user"]}>
              <Cart />
            </RoleBasedRoute>
          } />
          <Route path="/checkout" element={
            <RoleBasedRoute allowedRoles={["user"]}>
              <Checkout />
            </RoleBasedRoute>
          } />
          <Route path="/order-tracking/:orderId" element={
            <RoleBasedRoute allowedRoles={["user"]}>
              <OrderTracking />
            </RoleBasedRoute>
          } />
          <Route path="/my-orders" element={
            <RoleBasedRoute allowedRoles={["user"]}>
              <MyOrders />
            </RoleBasedRoute>
          } />
          <Route path="/wishlist" element={
            <RoleBasedRoute allowedRoles={["user"]}>
              <Wishlist />
            </RoleBasedRoute>
          } />
          <Route path="/dashboard" element={
            <RoleBasedRoute allowedRoles={["user"]}>
              <Dashboard />
            </RoleBasedRoute>
          } />

          {/* Owner Only Routes */}
          <Route path="/owner/dashboard" element={
            <RoleBasedRoute allowedRoles={["owner"]}>
              <OwnerDashboard />
            </RoleBasedRoute>
          } />
          <Route path="/owner/restaurant" element={
            <RoleBasedRoute allowedRoles={["owner"]}>
              <RestaurantSetup />
            </RoleBasedRoute>
          } />
          <Route path="/owner/categories" element={
            <RoleBasedRoute allowedRoles={["owner"]}>
              <FoodCategories />
            </RoleBasedRoute>
          } />
          <Route path="/owner/menu" element={
            <RoleBasedRoute allowedRoles={["owner"]}>
              <FoodMenu />
            </RoleBasedRoute>
          } />
          <Route path="/owner/delivery-zones" element={
            <RoleBasedRoute allowedRoles={["owner"]}>
              <DeliveryZones />
            </RoleBasedRoute>
          } />
          <Route path="/owner/promos" element={
            <RoleBasedRoute allowedRoles={["owner"]}>
              <PromoCodes />
            </RoleBasedRoute>
          } />
          <Route path="/owner/orders" element={
            <RoleBasedRoute allowedRoles={["owner"]}>
              <Orders />
            </RoleBasedRoute>
          } />
          <Route path="/owner/orders/:orderId" element={
            <RoleBasedRoute allowedRoles={["owner"]}>
              <OrderDetail />
            </RoleBasedRoute>
          } />
          <Route path="/owner/analytics" element={
            <RoleBasedRoute allowedRoles={["owner"]}>
              <Analytics />
            </RoleBasedRoute>
          } />

          {/* Delivery Boy Only Routes */}
          <Route path="/delivery/assigned-orders" element={
            <RoleBasedRoute allowedRoles={["deliveryBoy"]}>
              <AssignedOrders />
            </RoleBasedRoute>
          } />
          <Route path="/delivery/track/:orderId" element={<DeliveryTracking />} />
          <Route path="/delivery/earnings" element={
            <RoleBasedRoute allowedRoles={["deliveryBoy"]}>
              <DeliveryEarnings />
            </RoleBasedRoute>
          } />
          <Route path="/delivery/history" element={
            <RoleBasedRoute allowedRoles={["deliveryBoy"]}>
              <DeliveryHistory />
            </RoleBasedRoute>
          } />
          <Route path="/delivery/orders/:orderId" element={
            <RoleBasedRoute allowedRoles={["deliveryBoy"]}>
              <DeliveryOrderDetail />
            </RoleBasedRoute>
          } />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;