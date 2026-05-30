/* frontend/src/components/layout/Topbar.jsx */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import API_URL from '../../config/api';
import { useTheme } from '../../context/ThemeContext';
import {
    MdMenu, MdSearch, MdNotificationsNone, MdSettings,
    MdLightMode, MdDarkMode, MdLogout, MdPerson
} from 'react-icons/md';

const Topbar = ({ onToggleSidebar, onOpenMobile }) => {
    const navigate = useNavigate();
    const { theme, toggleTheme, isDark } = useTheme();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    const initials = (user?.fullName || 'U').charAt(0).toUpperCase();

    useEffect(() => {
        const onClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    const handleSignOut = async () => {
        try {
            await axios.post(`${API_URL}/api/auth/signout`, {}, { withCredentials: true });
        } catch (_) {}
        localStorage.clear();
        sessionStorage.clear();
        toast.success('Logged out successfully!');
        navigate('/signin', { replace: true });
    };

    return (
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 md:px-6 h-16 gap-3">
            {/* Mobile hamburger */}
            <button
                onClick={onOpenMobile}
                className="lg:hidden p-2 -ml-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Open menu"
            >
                <MdMenu size={24} />
            </button>

            {/* Desktop sidebar toggle */}
            <button
                onClick={onToggleSidebar}
                className="hidden lg:block p-2 -ml-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Toggle sidebar"
            >
                <MdMenu size={22} />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-xl">
                <div className="relative">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 md:gap-2">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {isDark ? <MdLightMode size={20} /> : <MdDarkMode size={20} />}
                </button>

                <button
                    className="relative p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Notifications"
                >
                    <MdNotificationsNone size={22} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
                </button>

                <button
                    onClick={() => navigate('/settings')}
                    className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Settings"
                >
                    <MdSettings size={20} />
                </button>

                {/* Avatar dropdown */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setMenuOpen(o => !o)}
                        className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-200 font-semibold flex items-center justify-center overflow-hidden ring-2 ring-transparent hover:ring-violet-300 transition"
                    >
                        {user?.avatar ? (
                            <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : initials}
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-fade-in">
                            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {user?.fullName || 'User'}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {user?.email}
                                </div>
                            </div>
                            <button
                                onClick={() => { setMenuOpen(false); navigate('/profile'); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                                <MdPerson size={16} /> My Profile
                            </button>
                            <button
                                onClick={() => { setMenuOpen(false); navigate('/settings'); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                                <MdSettings size={16} /> Settings
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 border-t border-gray-200 dark:border-gray-700"
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

export default Topbar;
