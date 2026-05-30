/* frontend/src/pages/Profile.jsx */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../config/api';
import {
    MdCameraAlt, MdEdit, MdSave, MdCancel,
    MdLock, MdSecurity, MdDownload, MdDelete, MdEmail, MdKey
} from 'react-icons/md';

const Card = ({ title, desc, children }) => (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {desc && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{desc}</p>}
        <div className="mt-4">{children}</div>
    </div>
);

const Profile = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [pdfBusy, setPdfBusy] = useState(false);
    const [pwdBusy, setPwdBusy] = useState(false);

    const [form, setForm] = useState({ fullName: '', mobile: '', role: 'user' });
    const [pwd, setPwd] = useState({ current: '', next: '' });

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletePwd, setDeletePwd] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [deleting, setDeleting] = useState(false);

    const forceLogout = (msg) => {
        localStorage.clear(); sessionStorage.clear();
        if (msg) toast.success(msg);
        navigate('/signin', { replace: true });
    };

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` }, withCredentials: true
            });
            setUser(res.data.user);
            setForm({
                fullName: res.data.user.fullName || '',
                mobile: res.data.user.mobile || '',
                role: res.data.user.role || 'user'
            });
        } catch (e) {
            if (e.response?.status === 401 || e.response?.status === 404) {
                forceLogout('Your session has ended. Please sign in again.');
                return;
            }
            toast.error(e.response?.data?.error || 'Failed to load profile');
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchProfile(); /* eslint-disable-next-line */ }, []);

    const hasPassword = user?.hasPassword !== undefined ? user.hasPassword : !!(user && user.password);

    const onAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return toast.error('Only image files allowed');
        if (file.size > 5 * 1024 * 1024) return toast.error('Image must be < 5MB');
        const fd = new FormData();
        fd.append('avatar', file);
        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/auth/upload-avatar`, fd, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            const next = { ...user, avatar: res.data.avatar };
            setUser(next);
            localStorage.setItem('user', JSON.stringify(next));
            toast.success('Profile picture updated!');
        } catch (err) { toast.error(err.response?.data?.error || 'Upload failed'); }
        finally { setUploading(false); e.target.value = ''; }
    };

    const saveProfile = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (!form.fullName.trim()) return toast.error('Full name is required');
        if (form.mobile && !/^\d{10,13}$/.test(form.mobile)) return toast.error('Mobile must be 10–13 digits');
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${API_URL}/api/auth/profile`, form, {
                headers: { Authorization: `Bearer ${token}` }, withCredentials: true
            });
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setEditing(false);
            toast.success('Profile updated!');
        } catch (e) { toast.error(e.response?.data?.error || 'Failed to update profile'); }
        finally { setSaving(false); }
    };

    const handlePasswordSubmit = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (!pwd.next || pwd.next.length < 6) return toast.error('Password must be at least 6 characters');
        setPwdBusy(true);
        try {
            const token = localStorage.getItem('token');
            if (hasPassword) {
                if (!pwd.current) return toast.error('Enter your current password');
                await axios.post(`${API_URL}/api/auth/change-password`, {
                    currentPassword: pwd.current, newPassword: pwd.next
                }, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true });
                toast.success('Password changed!');
            } else {
                await axios.post(`${API_URL}/api/auth/set-password`, {
                    newPassword: pwd.next
                }, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true });
                toast.success('Password set!');
                await fetchProfile();
            }
            setPwd({ current: '', next: '' });
        } catch (e) { toast.error(e.response?.data?.error || 'Failed to save password'); }
        finally { setPwdBusy(false); }
    };

    const downloadPdf = async () => {
        setPdfBusy(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/auth/download-pdf`, {
                headers: { Authorization: `Bearer ${token}` }, withCredentials: true, responseType: 'blob'
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
            a.href = url; a.download = `Vingo_Profile_${safe}_${Date.now()}.pdf`;
            document.body.appendChild(a); a.click(); a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Profile downloaded as PDF!');
        } catch (e) { toast.error(e.message || 'Failed to download PDF'); }
        finally { setPdfBusy(false); }
    };

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
                headers: { Authorization: `Bearer ${token}` }, withCredentials: true, data: body
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
                <div className="h-64 rounded-xl skeleton" />
                <div className="h-48 rounded-xl skeleton" />
            </div>
        );
    }
    if (!user) return null;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">View and edit your personal information.</p>
            </div>

            <Card title="Personal Information" desc="Update your name, avatar and contact details.">
                <form onSubmit={saveProfile} noValidate className="flex flex-col md:flex-row items-start gap-6">
                    <div className="flex flex-col items-center gap-3">
                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*"
                            onChange={onAvatarChange} disabled={uploading} />
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()} title="Change picture">
                            <div className="w-28 h-28 rounded-full bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-200 text-4xl font-bold flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow">
                                {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user.fullName?.charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                <MdCameraAlt size={26} className="text-white" />
                            </div>
                            {uploading && (
                                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Click to change</p>
                    </div>

                    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                            <input type="text" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                                disabled={!editing} autoComplete="name"
                                className="mt-1 w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:outline-none disabled:bg-gray-50 dark:disabled:bg-gray-800/40 disabled:cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <div className="mt-1 flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                                <MdEmail size={16} className="text-gray-400" /> {user.email}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mobile</label>
                            <input type="tel" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
                                disabled={!editing} placeholder="10–13 digits" autoComplete="tel"
                                className="mt-1 w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:outline-none disabled:bg-gray-50 dark:disabled:bg-gray-800/40 disabled:cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} disabled={!editing}
                                className="mt-1 w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:outline-none disabled:bg-gray-50 dark:disabled:bg-gray-800/40 disabled:cursor-not-allowed">
                                <option value="user">User</option>
                                <option value="owner">Owner</option>
                                <option value="deliveryBoy">Delivery Boy</option>
                            </select>
                        </div>

                        <div className="md:col-span-2 flex gap-2 mt-2">
                            {!editing ? (
                                <button type="button" onClick={() => setEditing(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition">
                                    <MdEdit size={18} /> Edit Profile
                                </button>
                            ) : (
                                <>
                                    <button type="submit" disabled={saving}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition disabled:opacity-50">
                                        <MdSave size={18} /> {saving ? 'Saving…' : 'Save Changes'}
                                    </button>
                                    <button type="button"
                                        onClick={() => { setEditing(false); setForm({ fullName: user.fullName, mobile: user.mobile || '', role: user.role }); }}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                                        <MdCancel size={18} /> Cancel
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </form>
            </Card>

            {/* Adaptive Set/Change Password */}
            <Card title={hasPassword ? 'Change Password' : 'Set Password'}
                  desc={hasPassword ? "Set a new password for your account."
                                    : "You signed up with Google. Set a password to also log in with email & password."}>
                {!hasPassword && (
                    <div className="mb-4 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 p-3 text-sm text-violet-800 dark:text-violet-200 flex items-center gap-2">
                        <MdKey size={18} />
                        You don't have a password yet. Setting one will enable email/password login.
                    </div>
                )}
                <form onSubmit={handlePasswordSubmit} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                    {hasPassword && (
                        <input type="password" value={pwd.current}
                            onChange={e => setPwd(p => ({ ...p, current: e.target.value }))}
                            placeholder="Current password" autoComplete="current-password"
                            className="p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:outline-none" />
                    )}
                    <input type="password" value={pwd.next}
                        onChange={e => setPwd(p => ({ ...p, next: e.target.value }))}
                        placeholder="New password" autoComplete="new-password"
                        className={`${hasPassword ? '' : 'md:col-span-2'} p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:outline-none`} />
                    <button type="submit" disabled={pwdBusy}
                        className="md:col-span-2 inline-flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition disabled:opacity-50">
                        <MdLock size={18} />
                        {pwdBusy ? 'Saving…' : (hasPassword ? 'Change Password' : 'Set Password')}
                    </button>
                </form>
            </Card>

            <Card title="Account Actions" desc="Manage your account data.">
                <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={downloadPdf} disabled={pdfBusy}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition disabled:opacity-50">
                        <MdDownload size={18} /> {pdfBusy ? 'Generating…' : 'Download Profile PDF'}
                    </button>
                    <button type="button" onClick={() => navigate('/settings?tab=security')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                        <MdSecurity size={18} /> Security Settings
                    </button>
                </div>
            </Card>

            <Card title="Danger Zone" desc="Once deleted, your account cannot be recovered.">
                <div className="rounded-lg border-2 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4">
                    <p className="text-sm text-red-800 dark:text-red-300 mb-3">
                        ⚠️ This will permanently delete your profile, all saved addresses, and avatar.
                    </p>
                    <button type="button" onClick={() => setDeleteOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition">
                        <MdDelete size={18} /> Delete My Account
                    </button>
                </div>
            </Card>

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
        </div>
    );
};

export default Profile;
