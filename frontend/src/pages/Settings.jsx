// frontend\src\pages\Settings.jsx

import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import API_URL from "../config/api";
import { useTheme } from "../context/ThemeContext";
import {
  MdSettings,
  MdSecurity,
  MdAccountCircle,
  MdNotifications,
  MdLightMode,
  MdDarkMode,
  MdLanguage,
  MdDownload,
  MdDelete,
  MdLock,
  MdCheckCircle,
  MdCancel,
  MdKey,
} from "react-icons/md";

const TABS = [
  { id: "general", label: "General", icon: MdSettings },
  { id: "security", label: "Security", icon: MdSecurity },
  { id: "notifications", label: "Notifications", icon: MdNotifications },
  { id: "account", label: "Account", icon: MdAccountCircle },
];

const Section = ({ title, desc, children }) => (
  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 text-sm">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
    {desc && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{desc}</p>}
    <div className="mt-5">{children}</div>
  </div>
);

const Toggle = ({ checked, onChange, label, desc }) => (
  <label className="flex items-start justify-between gap-4 cursor-pointer py-3 text-sm">
    <div>
      <div className="font-semibold text-gray-900 dark:text-gray-100">{label}</div>
      {desc && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>}
    </div>
    <div className="relative inline-block w-11 h-6 shrink-0">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer-checked:bg-violet-600 transition" />
      <div
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </div>
  </label>
);

export const Settings = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { theme, toggleTheme, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState(params.get("tab") || "general");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [prefs, setPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("vingo-prefs") || "{}");
    } catch {
      return {};
    }
  });

  const savePrefs = (p) => {
    setPrefs(p);
    localStorage.setItem("vingo-prefs", JSON.stringify(p));
  };

  const [language, setLanguage] = useState(localStorage.getItem("vingo-lang") || "en");

  // Password state details
  const [pwd, setPwd] = useState({ current: "", next: "" });
  const [pwdSaving, setPwdSaving] = useState(false);

  // Two factor auth setup elements
  const [twoFactorBusy, setTwoFactorBusy] = useState(false);
  const [setupOtp, setSetupOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);

  // PDF stream report and account delete controllers
  const [pdfBusy, setPdfBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setParams]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setUser(res.data.user);
    } catch (e) {
      if (e.response?.status === 401 || e.response?.status === 404) {
        localStorage.clear();
        sessionStorage.clear();
        navigate("/signin", { replace: true });
      } else {
        toast.error("Failed to load settings profile");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const forceLogout = (msg) => {
    localStorage.clear();
    sessionStorage.clear();
    if (msg) toast.success(msg);
    navigate("/signin", { replace: true });
  };

  const hasPassword = user?.hasPassword === true;

  // Two Factor enable / disable controllers
  const request2FA = async () => {
    setTwoFactorBusy(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/auth/two-factor/setup/request`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setOtpRequested(true);
      toast.success("Verification token printed directly to console logs!");
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed sending setup code");
    } finally {
      setTwoFactorBusy(false);
    }
  };

  const verify2FA = async (e) => {
    e.preventDefault();
    if (setupOtp.length !== 6) return toast.error("Enter the valid 6-digit setup code");
    setTwoFactorBusy(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/auth/two-factor/setup/verify`,
        { otp: setupOtp },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setUser((u) => ({ ...u, twoFactorEnabled: true }));
      setOtpRequested(false);
      setSetupOtp("");
      toast.success("Two factor authentication enabled!");
    } catch (e) {
      toast.error(e.response?.data?.error || "Invalid configuration code");
    } finally {
      setTwoFactorBusy(false);
    }
  };

  const disable2FA = async () => {
    if (!window.confirm("Disable two factor authentication?")) return;
    setTwoFactorBusy(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/auth/two-factor/disable`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setUser((u) => ({ ...u, twoFactorEnabled: false }));
      toast.success("Two factor security disabled.");
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed disable action");
    } finally {
      setTwoFactorBusy(false);
    }
  };

  // Password set/change setup click handler
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!pwd.next || pwd.next.length < 6) return toast.error("New password must be at least 6 characters");
    setPwdSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (hasPassword) {
        if (!pwd.current) return toast.error("Current password is required");
        await axios.post(
          `${API_URL}/api/auth/change-password`,
          {
            currentPassword: pwd.current,
            newPassword: pwd.next,
          },
          { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
        );
        toast.success("Password changed successfully");
      } else {
        await axios.post(
          `${API_URL}/api/auth/set-password`,
          {
            newPassword: pwd.next,
          },
          { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
        );
        toast.success("Password set completed! You can log in using password credentials too.");
      }
      setPwd({ current: "", next: "" });
      await fetchProfile(); // updates password state cleanly
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to update security credentials.");
    } finally {
      setPwdSaving(false);
    }
  };

  const downloadPdf = async () => {
    setPdfBusy(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/auth/download-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const safe = (user?.fullName || "User").replace(/\s+/g, "_");
      const a = document.createElement("a");
      a.href = url;
      a.download = `Vingo_Profile_${safe}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Profile records PDF generated!");
    } catch (err) {
      toast.error("Failed to generate PDF reports.");
    } finally {
      setPdfBusy(false);
    }
  };

  // Safe Cascade account deletion handler
  const handleDelete = async (e) => {
    e.preventDefault();

    if (deleteConfirm.trim().toUpperCase() !== "DELETE") {
      return toast.error("Please type DELETE to confirm");
    }

    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/auth/delete-account`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
        data: { confirmation: "DELETE" },
      });
      forceLogout("Your account and all addresses were fully cascade deleted successfully.");
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed safety confirmations. Deletion declined.");
      setDeleteConfirm("");
    } finally {
      setDeleting(false);
    }
  };

  const renderDeleteModal = () => {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <form
          onSubmit={handleDelete}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-200 dark:border-gray-800 animate-fade-in text-gray-800 dark:text-gray-100"
        >
          <h3 className="text-base font-bold text-red-600 dark:text-red-400">Permanently Delete Account?</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
            All your saved addresses, shipping details, and profile configurations will be cascade deleted. Security
            passwords are not required.
          </p>
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-3">
            Please type <span className="text-red-600 font-bold dark:text-red-400">DELETE</span> to confirm:
          </p>
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="DELETE"
            autoFocus
            className="mt-2 w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white uppercase font-bold text-center tracking-widest focus:ring-2 focus:ring-red-500 focus:outline-none"
          />

          <div className="mt-5 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteConfirm("");
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={deleting}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50 cursor-pointer"
            >
              {deleting ? "Deleting..." : "Delete Forever"}
            </button>
          </div>
        </form>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-10 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-48 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-sm">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage preferences, security and billing defaults.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800 shrink-0">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition -mb-px cursor-pointer
                ${
                  active
                    ? "text-violet-600 border-violet-600 font-bold"
                    : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200"
                }`}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* General tab panel */}
      {activeTab === "general" && (
        <>
          <Section title="Appearance Theme" desc="Toggle light/dark appearance styles.">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isDark ? (
                  <MdDarkMode size={22} className="text-violet-500" />
                ) : (
                  <MdLightMode size={22} className="text-amber-500" />
                )}
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {isDark ? "Dark Mode Theme" : "Light Mode Theme"}
                  </div>
                  <div className="text-xs text-gray-500">Enable warm colors eye protection.</div>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition overflow-hidden cursor-pointer"
              >
                Switch to {isDark ? "Light theme" : "Dark theme"}
              </button>
            </div>
          </Section>

          <Section title="E-Commerce Language" desc="Select display language configuration files.">
            <div className="flex items-center gap-3">
              <MdLanguage size={20} className="text-violet-500 shrink-0" />
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  localStorage.setItem("vingo-lang", e.target.value);
                  toast.success("Preferred portal languages set.");
                }}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none"
              >
                <option value="en">English</option>
                <option value="ur">اردو (Urdu)</option>
                <option value="ar">العربية (Arabic)</option>
              </select>
            </div>
          </Section>
        </>
      )}

      {/* Security tab panel */}
      {activeTab === "security" && (
        <>
          <Section title="Two-Factor Security Verification" desc="Add security protections by sending backup codes on login.">
            {user?.twoFactorEnabled ? (
              <div className="flex flex-col sm:flex-row md:items-center md:justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <MdCheckCircle size={22} />{" "}
                  <span className="font-semibold">MFA / Two factor controls are active</span>
                </div>
                <button
                  type="button"
                  onClick={disable2FA}
                  disabled={twoFactorBusy}
                  className="px-3.5 py-1.5 bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-200 transition cursor-pointer"
                >
                  {twoFactorBusy ? "Working..." : "Deactivate 2FA"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <MdCancel size={22} /> <span>Two factor credentials inactive</span>
                </div>
                {!otpRequested ? (
                  <button
                    type="button"
                    onClick={request2FA}
                    disabled={twoFactorBusy}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    {twoFactorBusy ? "Sending setup token..." : "Activate Two-Factor"}
                  </button>
                ) : (
                  <form onSubmit={verify2FA} className="flex flex-col sm:flex-row gap-2 max-w-sm">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={setupOtp}
                      onChange={(e) => setSetupOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold tracking-widest text-center"
                    />
                    <button
                      type="submit"
                      disabled={twoFactorBusy}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Verify Code
                    </button>
                  </form>
                )}
              </div>
            )}
          </Section>

          {/* Password adjusters */}
          <Section
            title={hasPassword ? "Adjust Credentials Password" : "Set Credentials Password"}
            desc="Configure strong password requirements to enable secondary billing accesses."
          >
            {!hasPassword && (
              <div className="mb-4 rounded-lg border border-violet-100 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/10 p-3 text-violet-800 dark:text-violet-300 flex items-center gap-2 text-xs">
                <MdKey size={16} /> No backup password defined yet. Assigning one allows logging in without Google.
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
              {hasPassword && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Current Password *</label>
                  <input
                    type="password"
                    value={pwd.current}
                    onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">New Password *</label>
                <input
                  type="password"
                  value={pwd.next}
                  onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={pwdSaving}
                className="inline-flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-4 py-2 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              >
                <MdLock size={14} />{" "}
                {pwdSaving ? "Saving..." : hasPassword ? "Change Password" : "Set Password"}
              </button>
            </form>
          </Section>
        </>
      )}

      {/* Notifications tab panel */}
      {activeTab === "notifications" && (
        <Section title="Delivery Alerts Feed" desc="Manage delivery updates and product transactional lists.">
          <Toggle
            label="Email delivery logs"
            desc="Keep informed with order dispatched emails"
            checked={prefs.email !== false}
            onChange={(e) => savePrefs({ ...prefs, email: e.target.checked })}
          />
          <Toggle
            label="Special Promo Offers"
            desc="Discounts and occasional coupon newsletters"
            checked={!!prefs.marketing}
            onChange={(e) => savePrefs({ ...prefs, marketing: e.target.checked })}
          />
          <Toggle
            label="Security credentials update alerts"
            desc="Changes inside MFA settings or password resets"
            checked={prefs.security !== false}
            onChange={(e) => savePrefs({ ...prefs, security: e.target.checked })}
          />
        </Section>
      )}

      {/* Account tab panel */}
      {activeTab === "account" && (
        <>
          <Section title="Download Report Details" desc="Generate a downloadable PDF copy of your address book.">
            <button
              type="button"
              onClick={downloadPdf}
              disabled={pdfBusy}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
            >
              <MdDownload size={14} /> {pdfBusy ? "Compiling PDF document..." : "Download PDF Data Sheet"}
            </button>
          </Section>

          <Section title="Danger Zone" desc="Actions here can permanently destroy billing logs.">
            <div className="border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 rounded-xl p-4">
              <h4 className="text-red-800 dark:text-red-400 font-bold block mb-1">Permanent Portal Deletion</h4>
              <p className="text-xs text-red-700 dark:text-red-300">
                ⚠️ Account deletion cascade sweeps all shipping records, defaults, and passwords completely. Action
                cannot be reflowed.
              </p>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-xs font-bold transition cursor-pointer"
              >
                <MdDelete className="inline mr-1" /> Delete My Account
              </button>
            </div>
          </Section>

          {deleteOpen && renderDeleteModal()}
        </>
      )}
    </div>
  );
};

export default Settings;
