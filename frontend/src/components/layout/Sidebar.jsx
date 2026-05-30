// frontend\src\components\layout\Sidebar.jsx 

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import API_URL from '../../config/api';
import {
    MdDashboard, MdPerson, MdLocationOn, MdSecurity,
    MdSettings, MdNotifications, MdLogout, MdClose
} from 'react-icons/md';

const navItems = [
    { to: '/dashboard',     label: 'Dashboard',      icon: MdDashboard },
    { to: '/profile',       label: 'Profile',        icon: MdPerson },
    { to: '/address-book',  label: 'Address Book',   icon: MdLocationOn },
    { to: '/settings?tab=security',      label: 'Security',       icon: MdSecurity },
    { to: '/settings',      label: 'Settings',       icon: MdSettings },
    { to: '/settings?tab=notifications', label: 'Notifications',  icon: MdNotifications },
];

const Sidebar = ({ collapsed = false, mobileOpen = false, onMobileClose }) => {
    const navigate = useNavigate();

    const handleSignOut = async () => {
        try {
            await axios.post(`${API_URL}/api/auth/signout`, {}, { withCredentials: true });
        } catch (_) { /* ignore */ }
        localStorage.clear();
        sessionStorage.clear();
        toast.success('Logged out successfully!');
        navigate('/signin', { replace: true });
    };

    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    const initials = (user?.fullName || 'V').charAt(0).toUpperCase();

    const baseLink = "flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors";
    const inactive = "text-white/80 hover:bg-white/10 hover:text-white";
    const active   = "bg-white text-violet-700 shadow-sm";

    const SidebarBody = (
        <aside
            className={`bg-linear-to-b from-violet-600 to-violet-700 dark:from-violet-800 dark:to-violet-900 flex flex-col h-full transition-all duration-200
                ${collapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}
        >
            {/* Logo */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white text-violet-700 font-extrabold flex items-center justify-center shadow">
                        V
                    </div>
                    {!collapsed && (
                        <div>
                            <div className="text-white font-bold text-lg leading-none">Vingo</div>
                            <div className="text-violet-200 text-xs mt-0.5">{initials}</div>
                        </div>
                    )}
                </div>
                <button
                    className="lg:hidden text-white/80 hover:text-white"
                    onClick={onMobileClose}
                    aria-label="Close menu"
                >
                    <MdClose size={22} />
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to + label}
                        to={to}
                        end={to === '/dashboard'}
                        onClick={onMobileClose}
                        className={({ isActive }) =>
                            `${baseLink} ${isActive && !to.includes('?') ? active : inactive}`
                        }
                        title={collapsed ? label : ''}
                    >
                        <Icon size={20} />
                        {!collapsed && <span className="text-sm">{label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Sign out */}
            <div className="p-3 border-t border-white/10">
                <button
                    onClick={handleSignOut}
                    className={`${baseLink} ${inactive} w-full`}
                    title="Sign out"
                >
                    <MdLogout size={20} />
                    {!collapsed && <span className="text-sm">Sign Out</span>}
                </button>
                {!collapsed && (
                    <div className="mt-3 p-3 rounded-lg bg-white/10 text-violet-50 text-xs">
                        Control your account with ease.
                    </div>
                )}
            </div>
        </aside>
    );

    return (
        <>
            {/* Desktop */}
            <div className="hidden lg:block shrink-0">{SidebarBody}</div>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-50">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={onMobileClose}
                    />
                    <div className="absolute left-0 top-0 bottom-0">{SidebarBody}</div>
                </div>
            )}
        </>
    );
};

export default Sidebar;
