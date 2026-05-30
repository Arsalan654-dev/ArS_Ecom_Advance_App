/* frontend/src/pages/SignuP.jsx */

import React, { useState } from 'react';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import GoogleLogin from '../components/GoogleLogin';
import API_URL from '../config/api';

const SignUp = () => {
    const navigate = useNavigate();
    const [showPwd, setShowPwd] = useState(false);
    const [form, setForm] = useState({ fullName: '', email: '', password: '', mobile: '', role: 'user' });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errors, setErrors] = useState({});

    const update = (k, v) => {
        setForm(f => ({ ...f, [k]: v }));
        errors[k] && setErrors(e => ({ ...e, [k]: '' }));
    };

    const validate = () => {
        const e = {};
        if (!form.fullName.trim()) e.fullName = 'Full name is required';
        if (!form.email) e.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
        if (!form.password) e.password = 'Password is required';
        else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
        if (!form.mobile) e.mobile = 'Mobile is required';
        else if (form.mobile.length < 10 || form.mobile.length > 13) e.mobile = 'Mobile must be 10–13 digits';
        setErrors(e);
        return !Object.keys(e).length;
    };

    const submit = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/auth/signup`, form, { withCredentials: true });
            if (res.data.success) {
                localStorage.setItem('user', JSON.stringify(res.data.user));
                setSuccess(true);
                toast.success('Signup successful! Please verify your email.');
                setTimeout(() => navigate('/signin'), 2000);
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Signup failed');
        } finally { setLoading(false); }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
                <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center border border-gray-200 dark:border-gray-800">
                    <div className="text-6xl mb-3">📧</div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Check your email</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        We sent a verification link to <strong>{form.email}</strong>. Redirecting to sign in…
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-violet-600">Vingo</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Create your account</p>
                </div>

                {/* ✅ Wrap in <form> so Enter key submits */}
                <form onSubmit={submit} noValidate className="mt-6 space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                        <input type="text" value={form.fullName} onChange={e => update('fullName', e.target.value)}
                            placeholder="Jane Doe" disabled={loading} autoComplete="name"
                            className={`mt-1 w-full p-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`} />
                        {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                            placeholder="[email protected]" disabled={loading} autoComplete="email"
                            className={`mt-1 w-full p-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`} />
                        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mobile</label>
                        <input type="tel" value={form.mobile} onChange={e => update('mobile', e.target.value.replace(/\D/g, ''))}
                            placeholder="03XXXXXXXXX" disabled={loading} autoComplete="tel"
                            className={`mt-1 w-full p-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.mobile ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`} />
                        {errors.mobile && <p className="mt-1 text-sm text-red-500">{errors.mobile}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                        <div className="relative">
                            <input type={showPwd ? 'text' : 'password'} value={form.password}
                                onChange={e => update('password', e.target.value)}
                                placeholder="At least 6 characters" disabled={loading} autoComplete="new-password"
                                className={`mt-1 w-full p-3 pr-10 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`} />
                            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" tabIndex={-1}>
                                {showPwd ? <FaRegEyeSlash /> : <FaRegEye />}
                            </button>
                        </div>
                        {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                        <select value={form.role} onChange={e => update('role', e.target.value)} disabled={loading}
                            className="mt-1 w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500">
                            <option value="user">User</option>
                            <option value="owner">Restaurant Owner</option>
                            <option value="deliveryBoy">Delivery Boy</option>
                        </select>
                    </div>

                    <button type="submit" disabled={loading}
                        className="w-full p-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg disabled:opacity-50 transition">
                        {loading ? 'Creating account…' : 'Sign Up'}
                    </button>

                    <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-3">
                        Already have an account? <Link to="/signin" className="text-violet-600 hover:text-violet-700 font-medium">Sign In</Link>
                    </p>
                </form>

                <div className="mt-4"><GoogleLogin /></div>
            </div>
        </div>
    );
};

export default SignUp;
