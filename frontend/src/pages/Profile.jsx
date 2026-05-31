// frontend\src\pages\Profile.jsx

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../config/api";
import {
  MdCameraAlt,
  MdEdit,
  MdSave,
  MdCancel,
  MdLock,
  MdSecurity,
  MdDownload,
  MdDelete,
  MdEmail,
  MdKey,
} from "react-icons/md";

const Card = ({ title, desc, children }) => (
  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 text-sm">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
    {desc && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{desc}</p>}
    <div className="mt-4">{children}</div>
  </div>
);

export const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pwdBusy, setPwdBusy] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  // Form states - properly initiated
  const [form, setForm] = useState({ fullName: "", mobile: "", role: "user" });
  const [pwd, setPwd] = useState({ current: "", next: "" });

  // Account deletion components
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const forceLogout = (msg) => {
    localStorage.clear();
    sessionStorage.clear();
    if (msg) toast.success(msg);
    navigate("/signin", { replace: true });
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setUser(res.data.user);
      setForm({
        fullName: res.data.user.fullName || "",
        mobile: res.data.user.mobile || "",
        role: res.data.user.role || "user",
      });
    } catch (e) {
      if (e.response?.status === 401 || e.response?.status === 404) {
        forceLogout("Session expired. Please sign in again.");
        return;
      }
      toast.error(e.response?.data?.error || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const hasPassword = user?.hasPassword === true;

  const onAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Only image files are allowed");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be smaller than 5MB");

    const fd = new FormData();
    fd.append("avatar", file);
    setUploading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/api/auth/upload-avatar`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      const next = { ...user, avatar: res.data.avatar };
      setUser(next);
      localStorage.setItem("user", JSON.stringify(next));
      toast.success("Profile picture updated!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (form.mobile && !/^\d{10,13}$/.test(form.mobile)) errs.mobile = "Mobile must be 10–13 digits";

    if (Object.keys(errs).length > 0) {
      setProfileErrors(errs);
      setTimeout(() => {
        const firstErrorBorder = document.querySelector(".border-red-500");
        if (firstErrorBorder) {
          firstErrorBorder.scrollIntoView({ behavior: "smooth", block: "center" });
          firstErrorBorder.focus();
        }
      }, 80);
      return;
    }

    setProfileErrors({});
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`${API_URL}/api/auth/profile`, form, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setUser(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setEditing(false);
      toast.success("Profile updated successfully!");
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Password set/change submit handler - refetches profile to immediately reflect change to outer UI cards
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!pwd.next || pwd.next.length < 6) return toast.error("New password must be at least 6 characters");

    setPwdBusy(true);
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
        toast.success("Password changed successfully!");
      } else {
        await axios.post(
          `${API_URL}/api/auth/set-password`,
          {
            newPassword: pwd.next,
          },
          { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
        );
        toast.success("Password set completed! You can now bypass Google Sign In.");
      }
      setPwd({ current: "", next: "" });
      await fetchProfile(); // Refetches to flip hasPassword instantly
    } catch (e) {
      toast.error(e.response?.data?.error || "Password adjustment unsuccessful");
    } finally {
      setPwdBusy(false);
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
      toast.success("Profile report PDF downloaded!");
    } catch (e) {
      toast.error("Failed to download PDF report.");
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
      forceLogout("Your account and address card records were fully cascade deleted successfully.");
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed safety validation. Deletion aborted.");
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
            All your saved addresses, shipping details, and profile data will be cascade deleted. Security passwords are
            not required.
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
        <div className="h-48 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">My Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">View or adjust your account credentials.</p>
      </div>

      <Card title="Personal Information" desc="Update name, mobile, role and image avatar.">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar Picture */}
          <div className="flex flex-col items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={onAvatarChange}
              disabled={uploading}
            />
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              title="Change picture"
            >
              <div className="w-24 h-24 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 text-3xl font-bold flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow">
                {user.avatar ? (
                  <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  user.fullName?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <MdCameraAlt size={22} className="text-white" />
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400">Click to change picture</p>
          </div>

          {/* Form details */}
          <div className="flex-1 w-full font-medium">
            {!editing ? (
              // Display static values
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400">Full Name</label>
                  <p className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-gray-100">
                    {user.fullName}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400">Email Address</label>
                  <p className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <MdEmail /> {user.email}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400">Mobile Phone</label>
                  <p className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-gray-100">
                    {user.mobile || "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400">User Type Role</label>
                  <p className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-gray-100 capitalize">
                    {user.role}
                  </p>
                </div>

                <div className="md:col-span-2 pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setForm({
                        fullName: user.fullName || "",
                        mobile: user.mobile || "",
                        role: user.role || "user",
                      });
                      setEditing(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <MdEdit size={14} /> Adjust Information
                  </button>
                </div>
              </div>
            ) : (
              // Edit mode form fields
              <form onSubmit={saveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400">Full Name</label>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => {
                        setForm({ ...form, fullName: e.target.value });
                        if (profileErrors.fullName) setProfileErrors({ ...profileErrors, fullName: "" });
                      }}
                      className={`mt-1 w-full p-2 border rounded-lg text-sm focus:ring-2 focus:outline-none font-medium bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                        profileErrors.fullName
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 dark:border-gray-700 focus:ring-violet-500"
                      }`}
                    />
                    {profileErrors.fullName && (
                      <p className="text-red-500 text-[11px] mt-1 font-medium">{profileErrors.fullName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400">Email Address (Locked)</label>
                    <p className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 text-sm">
                      {user.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400">Mobile Phone</label>
                    <input
                      type="tel"
                      value={form.mobile}
                      onChange={(e) => {
                        setForm({ ...form, mobile: e.target.value });
                        if (profileErrors.mobile) setProfileErrors({ ...profileErrors, mobile: "" });
                      }}
                      placeholder="e.g. 10-13 digits"
                      className={`mt-1 w-full p-2 border rounded-lg text-sm focus:ring-2 focus:outline-none font-medium bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                        profileErrors.mobile
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 dark:border-gray-700 focus:ring-violet-500"
                      }`}
                    />
                    {profileErrors.mobile && (
                      <p className="text-red-500 text-[11px] mt-1 font-medium">{profileErrors.mobile}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400">User Role Permissions</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="mt-1.5 w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="user">User</option>
                      <option value="owner">Restaurant Owner</option>
                      <option value="deliveryBoy">Delivery Boy</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition disabled:opacity-50"
                  >
                    <MdSave size={14} /> {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setForm({
                        fullName: user.fullName || "",
                        mobile: user.mobile || "",
                        role: user.role || "user",
                      });
                      setEditing(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <MdCancel size={14} /> Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Card>

      {/* Dynamic Set/Change Password section based on active state check */}
      <Card
        title={hasPassword ? "Change Password" : "Set Password"}
        desc={
          hasPassword
            ? "Enter your current password and assign a strong replacement."
            : "Use a backup password to log in without Google federations."
        }
      >
        {!hasPassword && (
          <div className="mb-4 rounded-lg bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-850 p-3 italic text-xs text-violet-800 dark:text-violet-200 flex items-center gap-2">
            <MdKey size={16} /> Password is not set. Setting a password enables standard email credentials login.
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {hasPassword && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Current Password *</label>
                <input
                  type="password"
                  value={pwd.current}
                  onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                  placeholder="Your current password"
                  autoComplete="current-password"
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none font-medium"
                />
              </div>
            )}
            <div className={hasPassword ? "" : "md:col-span-2"}>
              <label className="block text-xs font-semibold text-gray-400 mb-1">New Password *</label>
              <input
                type="password"
                value={pwd.next}
                onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none font-medium"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={pwdBusy}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition disabled:opacity-50"
          >
            <MdLock size={14} /> {pwdBusy ? "Saving..." : hasPassword ? "Change Password" : "Set Password"}
          </button>
        </form>
      </Card>

      {/* Downloader action blocks */}
      <Card title="Account Actions" desc="Acquire and download personal profile details.">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadPdf}
            disabled={pdfBusy}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
          >
            <MdDownload size={14} /> {pdfBusy ? "Generating PDF..." : "Download Profile Report (PDF)"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/settings?tab=security")}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <MdSecurity size={14} /> Security Settings
          </button>
        </div>
      </Card>

      {/* Danger panel */}
      <Card title="Danger Zone" desc="Actions here can irreversibly affect your billing logs.">
        <div className="border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 rounded-xl p-4">
          <h4 className="text-red-800 dark:text-red-400 font-bold text-sm">Permanent Deletion</h4>
          <p className="text-xs text-red-700 dark:text-red-300 mt-1">
            ⚠️ Deleting this account will permanently destroy your user settings, order book billing configurations, and
            associated addresses. This action cannot be recalled.
          </p>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-xs font-bold transition cursor-pointer"
          >
            <MdDelete className="inline mr-1" /> Delete My Account
          </button>
        </div>
      </Card>

      {deleteOpen && renderDeleteModal()}
    </div>
  );
};

export default Profile;
