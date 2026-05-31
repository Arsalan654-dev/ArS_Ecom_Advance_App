import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import API_URL from "../config/api";
import {
  MdPerson,
  MdEmail,
  MdPhone,
  MdVerifiedUser,
  MdLocationOn,
  MdSecurity,
  MdEdit,
} from "react-icons/md";

const Stat = ({ icon: Icon, label, value }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-xs hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addressCount, setAddressCount] = useState(0);

  const forceLogout = useCallback((reason) => {
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    if (reason) toast.info(reason);
    navigate("/signin", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      forceLogout();
      return;
    }

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (_) {}
    }

    (async () => {
      try {
        const [profileRes, addrRes] = await Promise.all([
          axios.get(`${API_URL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }),
          axios.get(`${API_URL}/api/address`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }).catch(() => ({ data: { addresses: [] } })),
        ]);

        setUser(profileRes.data.user);
        localStorage.setItem("user", JSON.stringify(profileRes.data.user));
        setAddressCount(addrRes.data?.addresses?.length || 0);
      } catch (error) {
        console.error("Dashboard profile fetch failed:", error);
        if (error.response?.status === 401 || error.response?.status === 404) {
          forceLogout("Your session has expired. Please sign in again.");
          return;
        }
        toast.error(error.response?.data?.error || "Failed to load dashboard profile info");
      } finally {
        setLoading(false);
      }
    })();
  }, [forceLogout]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
        <div className="h-48 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Welcome Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Welcome back, {user.fullName?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Here is a summary overview of your transactional settings.
        </p>
      </div>

      {/* Stats row grid layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={MdVerifiedUser} label="Email Verified" value={user.isEmailVerified ? "Verified" : "Pending"} />
        <Stat icon={MdSecurity} label="Two-Factor Status" value={user.twoFactorEnabled ? "Active" : "Disabled"} />
        <Stat icon={MdLocationOn} label="Shipping Addresses" value={addressCount} />
        <Stat icon={MdPerson} label="Access Permissions" value={user.role} />
      </div>

      {/* Main card panel details */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-violet-500 to-violet-700" />
        <div className="px-6 pb-6 -mt-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex items-end gap-3">
              <div className="w-20 h-20 rounded-xl bg-white dark:bg-gray-900 p-1 shadow">
                <div className="w-full h-full rounded-lg bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 text-2xl font-bold flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt="avatar" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    user.fullName?.charAt(0).toUpperCase()
                  )}
                </div>
              </div>
              <div className="pb-1 text-gray-900 dark:text-white">
                <h2 className="text-lg font-bold">{user.fullName}</h2>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/profile")}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              <MdEdit size={14} /> Profile Admin
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center">
                <MdEmail size={18} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Primary Email</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center">
                <MdPhone size={18} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Mobile Device</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.mobile || "Not specified"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
