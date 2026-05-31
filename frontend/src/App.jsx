import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import SignUp from "./pages/SignuP"; // Standard naming cased file
import SignIn from "./pages/SignIn";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import AddressBook from "./pages/AddressBook";
import Settings from "./pages/Settings";
import VerifyEmail from "./pages/VerifyEmail";
import TwoFactorVerify from "./pages/TwoFactorVerify";
import SetPassword from "./pages/SetPassword";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import { useTheme } from "./context/ThemeContext";

export const App = () => {
  const { theme } = useTheme();

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
        {/* Public Routes */}
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignUp />
            </PublicRoute>
          }
        />
        <Route
          path="/signin"
          element={
            <PublicRoute>
              <SignIn />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/two-factor-verify" element={<TwoFactorVerify />} />
        <Route
          path="/set-password"
          element={
            <PublicRoute>
              <SetPassword />
            </PublicRoute>
          }
        />

        {/* Protected Dashboard Views inside shared DashboardLayout */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/address-book" element={<AddressBook />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Home redirection defaults */}
        <Route
          path="/"
          element={
            localStorage.getItem("token") ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </>
  );
};

export default App;
