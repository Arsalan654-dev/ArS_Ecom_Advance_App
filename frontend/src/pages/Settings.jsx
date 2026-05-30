/* frontend/src/pages/Settings.jsx */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import API_URL from '../config/api';
import { useTheme } from '../context/ThemeContext';
import {
    MdSettings, MdSecurity, MdAccountCircle, MdNotifications,
    MdLightMode, MdDarkMode, MdLanguage, MdDownload, MdDelete,
    MdLock, MdCheckCircle, MdCancel, MdKey
} from 'react-icons/md';

const TABS = [
    { id: 'general',       label: 'General',       icon: MdSettings },
    { id: 'security',      label: 'Security',      icon: MdSecurity },
    { id: 'notifications', label: 'Notifications', icon: MdNotifications },
    { id: 'account',       label: 'Account',       icon: MdAccountCircle },
];

const Section = ({ title, desc, children }) => (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {desc && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{desc}</p>}
        <div className="mt-5">{children}</div>
    </div>
);

const Toggle = ({ checked, onChange, label, desc }) => (
    <label className="flex items-start justify-between gap-4 cursor-pointer py-3">
        <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{label}</div>
            {desc && <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>}
        </div>
        <div className="relative inline-block w-11 h-6 flex-shrink-0">
            <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer-checked:bg-violet-600 transition" />
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition ${checked ? 'translate-x-5' : ''}`} />
        </div>
    </label>
);

const Settings = () => {
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const { theme, toggleTheme, isDark } = useTheme();

    const [activeTab, setActiveTab] = useState(params.get('tab') || 'general');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const [prefs, setPrefs] = useState(() => {
        try { return JSON.parse(localStorage.getItem('vingo-prefs') || '{}'); }
        catch { return {}; }
    });
    const savePrefs = (p) => { setPrefs(p); localStorage.setItem('vingo-prefs', JSON.stringify(p)); };

    const [language, setLanguage] = useState(localStorage.getItem('vingo-lang') || 'en');

    // Password state — works for both "change" and "set" modes
    const [pwd, setPwd] = useState({ current: '', next: '' });
    const [pwdSaving, setPwdSaving] = useState(false);

    // 2FA
    const [twoFactorBusy, setTwoFactorBusy] = useState(false);
    const [setupOtp, setSetupOtp] = useState('');
    const [otpRequested, setOtpRequested] = useState(false);

    // PDF + delete
    const [pdfBusy, setPdfBusy] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletePwd, setDeletePwd] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [deleting, setDeleting] = useState(false);

    useEffect(() => { setParams({ tab: activeTab }, { replace: true }); }, [activeTab, setParams]);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` }, withCredentials: true
            });
            setUser(res.data.user);
        } catch (e) {
            if (e.response?.status === 401 || e.response?.status === 404) {
                localStorage.clear(); sessionStorage.clear();
                navigate('/signin', { replace: true });
            } else { toast.error('Failed to load settings'); }
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchProfile(); /* eslint-disable-next-line */ }, []);

    const forceLogout = (msg) => {
        localStorage.clear(); sessionStorage.clear();
        if (msg) toast.success(msg);
        navigate('/signin', { replace: true });
    };

    // ─── Detect whether user has a password ───
    // Prefer the explicit `hasPassword` flag from backend; fallback to googleId-only detection
    const hasPassword = user?.hasPassword !== undefined
        ? user.hasPassword
        : !!(user && user.password); // last-resort fallback

    // ─── 2FA ───
    const request2FA = async () => {
        setTwoFactorBusy(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/auth/two-factor/setup/request`, {}, {
                headers: { Authorization: `Bearer ${token}` }, withCredentials: true
            });
            setOtpRequested(true);
            toast.success('Verification code sent to your email');
        } catch (e) { toast.error(e.response?.data?.error || 'Failed to send code'); }
        finally { setTwoFactorBusy(false); }
    };
    const verify2FA = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (setupOtp.length !== 6) return toast.error('Enter the 6-digit code');
        setTwoFactorBusy(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/auth/two-factor/setup/verify`, { otp: setupOtp }, {
                headers: { Authorization: `Bearer ${token}` }, withCredentials: true
            });
            setUser(u => ({ ...u, twoFactorEnabled: true }));
            setOtpRequested(false); setSetupOtp('');
            toast.success('Two-factor authentication enabled!');
        } catch (e) { toast.error(e.response?.data?.error || 'Invalid code'); }
        finally { setTwoFactorBusy(false); }
    };
    const disable2FA = async () => {
        if (!window.confirm('Disable two-factor authentication?')) return;
        setTwoFactorBusy(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/auth/two-factor/disable`, {}, {
                headers: { Authorization: `Bearer ${token}` }, withCredentials: true
            });
            setUser(u => ({ ...u, twoFactorEnabled: false }));
            toast.success('Two-factor disabled');
        } catch (e) { toast.error(e.response?.data?.error || 'Failed to disable'); }
        finally { setTwoFactorBusy(false); }
    };

    // ─── Password — handles BOTH "set" (no current) and "change" (has current) ───
    const handlePasswordSubmit = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (!pwd.next || pwd.next.length < 6) return toast.error('Password must be at least 6 characters');

        setPwdSaving(true);
        try {
            const token = localStorage.getItem('token');
            if (hasPassword) {
                if (!pwd.current) return toast.error('Enter your current password');
                await axios.post(`${API_URL}/api/auth/change-password`, {
                    currentPassword: pwd.current, newPassword: pwd.next
                }, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true });
                toast.success('Password changed successfully');
            } else {
                // ✨ NEW: Set password for Google-only users
                await axios.post(`${API_URL}/api/auth/set-password`, {
                    newPassword: pwd.next
                }, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true });
                toast.success('Password set! You can now log in with email & password.');
                await fetchProfile(); // refetch → hasPassword flips → UI switches to "Change"
            }
            setPwd({ current: '', next: '' });
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to save password');
        } finally { setPwdSaving(false); }
    };

    // ─── PDF download ───
    const downloadPdf = async () => {
        setPdfBusy(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/auth/download-pdf`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
                responseType: 'blob'
            });
            const ct = res.headers['content-type'] || '';
            if (!ct.includes('application/pdf')) {
                const text = await res.data.text();
                let msg = 'Failed to generate PDF';
                try { msg = JSON.parse(text).error || msg; } catch (_) {}
                throw new Error(msg);
            }
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const safe = (user?.fullName || 'User').replace(/\s+/g, '_');
            const a = document.createElement('a');
            a.href = url;
            a.download = `Vingo_Profile_${safe}_${Date.now()}.pdf`;
            document.body.appendChild(a); a.click(); a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Profile downloaded as PDF!');
        } catch (e) { toast.error(e.message || 'Failed to download PDF'); }
        finally { setPdfBusy(false); }
    };

    // ─── Delete account — adaptive ───
    const handleDelete = async (e) => {
        if (e?.preventDefault) e.preventDefault();

        if (hasPassword && !deletePwd.trim()) return toast.error('Enter your password');
        if (!hasPassword && deleteConfirm.trim().toUpperCase() !== 'DELETE') {
            return toast.error('Please type DELETE to confirm');
        }

        setDeleting(true);
        try {
            const token = localStorage.getItem('token');
            const body = hasPassword ? { password: deletePwd } : { confirmation: 'DELETE' };
            await axios.delete(`${API_URL}/api/auth/delete-account`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
                data: body
            });
            forceLogout('Account deleted successfully');
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to delete account');
            setDeletePwd(''); setDeleteConfirm('');
        } finally { setDeleting(false); }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-10 w-48 rounded skeleton" />
                <div className="h-12 rounded skeleton" />
                <div className="h-64 rounded-xl skeleton" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your preferences, security and account.</p>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800">
                {TABS.map(t => {
                    const Icon = t.icon;
                    const active = activeTab === t.id;
                    return (
                        <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition -mb-px
                                ${active ? 'text-violet-600 border-violet-600'
                                        : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200'}`}>
                            <Icon size={18} /> {t.label}
                        </button>
                    );
                })}
            </div>

            {/* ─── General ─── */}
            {activeTab === 'general' && (
                <>
                    <Section title="Appearance" desc="Choose how Vingo looks to you.">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {isDark ? <MdDarkMode size={22} className="text-violet-500" /> : <MdLightMode size={22} className="text-amber-500" />}
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-gray-100">{isDark ? 'Dark Mode' : 'Light Mode'}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Toggle between light and dark themes</div>
                                </div>
                            </div>
                            <button type="button" onClick={toggleTheme}
                                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg font-medium transition">
                                Switch to {isDark ? 'Light' : 'Dark'}
                            </button>
                        </div>
                    </Section>

                    <Section title="Language" desc="Choose your preferred language.">
                        <div className="flex items-center gap-3">
                            <MdLanguage size={22} className="text-violet-500" />
                            <select value={language}
                                onChange={e => { setLanguage(e.target.value); localStorage.setItem('vingo-lang', e.target.value); toast.success('Language preference saved'); }}
                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                                <option value="en">English</option>
                                <option value="ur">اردو (Urdu)</option>
                                <option value="ar">العربية (Arabic)</option>
                                <option value="hi">हिन्दी (Hindi)</option>
                            </select>
                        </div>
                    </Section>
                </>
            )}

            {/* ─── Security ─── */}
            {activeTab === 'security' && (
                <>
                    <Section title="Two-Factor Authentication" desc="Add an extra layer of security with email-based OTP.">
                        {user?.twoFactorEnabled ? (
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                    <MdCheckCircle size={22} /> <span className="font-medium">2FA is enabled</span>
                                </div>
                                <button type="button" onClick={disable2FA} disabled={twoFactorBusy}
                                    className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg font-medium hover:bg-red-200 transition disabled:opacity-50">
                                    {twoFactorBusy ? 'Working…' : 'Disable 2FA'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                    <MdCancel size={22} /> <span>2FA is currently disabled</span>
                                </div>
                                {!otpRequested ? (
                                    <button type="button" onClick={request2FA} disabled={twoFactorBusy}
                                        className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition disabled:opacity-50">
                                        {twoFactorBusy ? 'Sending…' : 'Enable 2FA'}
                                    </button>
                                ) : (
                                    <form onSubmit={verify2FA} className="flex flex-col sm:flex-row gap-2">
                                        <input type="text" inputMode="numeric" maxLength={6} value={setupOtp}
                                            onChange={e => setSetupOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="6-digit code" autoFocus autoComplete="one-time-code"
                                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 tracking-widest text-center" />
                                        <button type="submit" disabled={twoFactorBusy}
                                            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium disabled:opacity-50 transition">
                                            Verify & Enable
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}
                    </Section>

                    {/* ✨ Set Password vs Change Password */}
                    <Section
                        title={hasPassword ? 'Change Password' : 'Set Password'}
                        desc={hasPassword
                            ? "Use a strong password you don't reuse elsewhere."
                            : "You signed up with Google. Set a password to also log in with email & password."}>

                        {!hasPassword && (
                            <div className="mb-4 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 p-3 text-sm text-violet-800 dark:text-violet-200 flex items-center gap-2">
                                <MdKey size={18} />
                                You don't have a password yet. Setting one will let you log in without Google too.
                            </div>
                        )}

                        <form onSubmit={handlePasswordSubmit} noValidate className="space-y-3 max-w-md">
                            {hasPassword && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                                    <input type="password" value={pwd.current}
                                        onChange={e => setPwd(p => ({ ...p, current: e.target.value }))}
                                        autoComplete="current-password"
                                        className="mt-1 w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:outline-none" />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                                <input type="password" value={pwd.next}
                                    onChange={e => setPwd(p => ({ ...p, next: e.target.value }))}
                                    autoComplete="new-password" placeholder="At least 6 characters"
                                    className="mt-1 w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:outline-none" />
                            </div>
                            <button type="submit" disabled={pwdSaving}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition disabled:opacity-50">
                                <MdLock size={18} />
                                {pwdSaving ? 'Saving…' : (hasPassword ? 'Change Password' : 'Set Password')}
                            </button>
                        </form>
                    </Section>
                </>
            )}

            {/* ─── Notifications ─── */}
            {activeTab === 'notifications' && (
                <Section title="Notification Preferences" desc="Choose what you want to be notified about.">
                    <Toggle label="Email notifications" desc="Receive important updates by email"
                        checked={prefs.email !== false} onChange={e => savePrefs({ ...prefs, email: e.target.checked })} />
                    <Toggle label="Marketing & promotions" desc="Tips, news and special offers"
                        checked={!!prefs.marketing} onChange={e => savePrefs({ ...prefs, marketing: e.target.checked })} />
                    <Toggle label="Security alerts" desc="Sign-ins from new devices, password changes"
                        checked={prefs.security !== false} onChange={e => savePrefs({ ...prefs, security: e.target.checked })} />
                    <Toggle label="Order updates" desc="Delivery and order status notifications"
                        checked={prefs.orders !== false} onChange={e => savePrefs({ ...prefs, orders: e.target.checked })} />
                </Section>
            )}

            {/* ─── Account ─── */}
            {activeTab === 'account' && (
                <>
                    <Section title="Download Your Data" desc="Get a PDF copy of your profile and saved addresses.">
                        <button type="button" onClick={downloadPdf} disabled={pdfBusy}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition disabled:opacity-50">
                            <MdDownload size={18} /> {pdfBusy ? 'Generating…' : 'Download as PDF'}
                        </button>
                    </Section>

                    <Section title="Danger Zone" desc="Permanently delete your account and all associated data.">
                        <div className="rounded-lg border-2 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4">
                            <p className="text-sm text-red-800 dark:text-red-300 mb-3">
                                ⚠️ This will permanently delete your profile, all saved addresses, and avatar.
                                <strong> This action cannot be undone.</strong>
                            </p>
                            <button type="button" onClick={() => setDeleteOpen(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition">
                                <MdDelete size={18} /> Delete My Account
                            </button>
                        </div>
                    </Section>

                    {deleteOpen && (
                        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                            <form onSubmit={handleDelete}
                                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800 animate-fade-in">
                                <h3 className="text-lg font-bold text-red-600 dark:text-red-400">Confirm Account Deletion</h3>

                                {hasPassword ? (
                                    <>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                            Enter your password to permanently delete your account.
                                        </p>
                                        <input type="password" value={deletePwd}
                                            onChange={e => setDeletePwd(e.target.value)}
                                            placeholder="Your password" autoFocus autoComplete="current-password"
                                            className="mt-4 w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:outline-none" />
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                            You signed up with Google so no password is required.<br />
                                            Type <strong className="text-red-600 dark:text-red-400">DELETE</strong> to confirm.
                                        </p>
                                        <input type="text" value={deleteConfirm}
                                            onChange={e => setDeleteConfirm(e.target.value)}
                                            placeholder="Type DELETE" autoFocus
                                            className="mt-4 w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:outline-none uppercase tracking-wider" />
                                    </>
                                )}

                                <div className="mt-5 flex gap-2 justify-end">
                                    <button type="button"
                                        onClick={() => { setDeleteOpen(false); setDeletePwd(''); setDeleteConfirm(''); }}
                                        className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={deleting}
                                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition disabled:opacity-50">
                                        {deleting ? 'Deleting…' : 'Delete Forever'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Settings;
