/* frontend/src/pages/Dashboard.jsx */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import API_URL from '../config/api';
import {
    MdPerson, MdEmail, MdPhone, MdVerifiedUser, MdLocationOn,
    MdSecurity, MdEdit
} from 'react-icons/md';

const Stat = ({ icon: Icon, label, value, color = 'violet' }) => (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400`}>
                <Icon size={24} />
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [addressCount, setAddressCount] = useState(0);

    // ✅ FORCE LOGOUT — clears everything and redirects
    const forceLogout = useCallback((reason) => {
        localStorage.clear();
        sessionStorage.clear();
        setUser(null);
        if (reason) toast.info(reason);
        navigate('/signin', { replace: true });
    }, [navigate]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            forceLogout();
            return;
        }

        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try { setUser(JSON.parse(storedUser)); } catch (_) {}
        }

        (async () => {
            try {
                const [profileRes, addrRes] = await Promise.all([
                    axios.get(`${API_URL}/api/auth/profile`, {
                        headers: { Authorization: `Bearer ${token}` },
                        withCredentials: true
                    }),
                    axios.get(`${API_URL}/api/address`, {
                        headers: { Authorization: `Bearer ${token}` },
                        withCredentials: true
                    }).catch(() => ({ data: { addresses: [] } }))
                ]);

                setUser(profileRes.data.user);
                localStorage.setItem('user', JSON.stringify(profileRes.data.user));
                setAddressCount(addrRes.data?.addresses?.length || 0);
            } catch (error) {
                console.error('Profile fetch failed:', error);
                // ✅ 401 (token invalid) or 404 (user deleted) → instant logout, no stale UI
                if (error.response?.status === 401 || error.response?.status === 404) {
                    forceLogout('Your session has ended. Please sign in again.');
                    return;
                }
                toast.error(error.response?.data?.error || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        })();
    }, [forceLogout]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-24 rounded-xl skeleton" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-xl skeleton" />)}
                </div>
                <div className="h-64 rounded-xl skeleton" />
            </div>
        );
    }

    if (!user) return null; // safety — forceLogout should have redirected

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    Welcome back, {user.fullName?.split(' ')[0]} 👋
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Here's an overview of your account.
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Stat icon={MdVerifiedUser} label="Email Status" value={user.isEmailVerified ? 'Verified' : 'Pending'} color="green" />
                <Stat icon={MdSecurity}    label="2-Factor Auth" value={user.twoFactorEnabled ? 'Enabled' : 'Off'} color="violet" />
                <Stat icon={MdLocationOn}  label="Addresses"     value={addressCount} color="blue" />
                <Stat icon={MdPerson}      label="Role"          value={user.role}      color="amber" />
            </div>

            {/* Profile card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-violet-500 to-violet-700" />
                <div className="px-6 pb-6 -mt-12">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div className="flex items-end gap-4">
                            <div className="w-24 h-24 rounded-2xl bg-white dark:bg-gray-900 p-1 shadow-lg">
                                <div className="w-full h-full rounded-xl bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-200 text-3xl font-bold flex items-center justify-center overflow-hidden">
                                    {user.avatar
                                        ? <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-xl" />
                                        : user.fullName?.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className="pb-2">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.fullName}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/profile')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition shadow-sm"
                        >
                            <MdEdit size={18} /> Edit Profile
                        </button>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center">
                                <MdEmail size={18} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center">
                                <MdPhone size={18} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Mobile</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.mobile || 'Not provided'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
