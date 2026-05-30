/* frontend/src/pages/SetPassword.jsx */

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';
import { IoMdArrowBack } from 'react-icons/io';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../config/api';

const SetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const preEmail = location.state?.email || '';

    const [step, setStep] = useState(preEmail ? 2 : 1); // 1: email, 2: otp+pwd
    const [email, setEmail] = useState(preEmail);
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [otpRequested, setOtpRequested] = useState(false);
    const [expiresAt, setExpiresAt] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);

    // Auto-request OTP if email was pre-filled
    useEffect(() => {
        if (preEmail && !otpRequested) {
            handleRequestOtp({ preventDefault: () => {} });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Countdown
    useEffect(() => {
        if (!expiresAt) return;
        const tick = () => {
            const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
            setTimeLeft(diff);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [expiresAt]);

    const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    const handleRequestOtp = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return toast.error('Enter a valid email');
        }
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/auth/set-password/request-otp`, { email });
            setOtpRequested(true);
            setStep(2);
            setExpiresAt(res.data.expiresAt || new Date(Date.now() + 10 * 60 * 1000).toISOString());
            toast.success(res.data.message || 'Verification code sent to your email');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to send verification code');
        } finally { setLoading(false); }
    };

    const handleVerifyAndSet = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (otp.length !== 6) return toast.error('Enter the 6-digit code');
        if (!newPassword || newPassword.length < 6) {
            return toast.error('Password must be at least 6 characters');
        }
        setLoading(true);
        try {
            await axios.post(`${API_URL}/api/auth/set-password/verify`, {
                email, otp, newPassword
            });
            toast.success('Password set successfully! Please sign in.');
            setTimeout(() => navigate('/signin'), 1200);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to set password');
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800 relative">

                <button
                    type="button"
                    onClick={() => step === 2 && otpRequested && !preEmail ? setStep(1) : navigate('/signin')}
                    className="absolute left-4 top-4 p-2 rounded-lg text-gray-500 hover:text-violet-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    aria-label="Go back"
                >
                    <IoMdArrowBack size={22} />
                </button>

                <div className="text-center mt-6">
                    <h1 className="text-3xl font-bold text-violet-600">Vingo</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Set up password login</p>
                </div>

                <div className="mt-4 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 p-3 text-sm text-violet-800 dark:text-violet-200">
                    💡 You signed up with Google. To also log in with email & password, set one here.
                </div>

                {step === 1 && (
                    <form onSubmit={handleRequestOtp} noValidate className="mt-6 space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input
                                type="email" value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="[email protected]" disabled={loading}
                                autoFocus autoComplete="email"
                                className="mt-1 w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full p-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg disabled:opacity-50 transition">
                            {loading ? 'Sending…' : 'Send Verification Code'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyAndSet} noValidate className="mt-6 space-y-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                            Code sent to <strong className="text-gray-900 dark:text-gray-100">{email}</strong>
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Verification Code</label>
                            <input
                                type="text" inputMode="numeric" maxLength={6} value={otp}
                                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="______" disabled={loading}
                                autoFocus autoComplete="one-time-code"
                                className="mt-1 w-full p-3 text-center text-2xl tracking-[0.5em] rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            {timeLeft > 0 ? (
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-center">
                                    Expires in <span className="font-mono text-violet-600">{formatTime(timeLeft)}</span>
                                </p>
                            ) : (
                                <p className="mt-1 text-xs text-red-500 text-center">Code expired — request a new one.</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPwd ? 'text' : 'password'} value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="At least 6 characters" disabled={loading}
                                    autoComplete="new-password"
                                    className="mt-1 w-full p-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" tabIndex={-1}>
                                    {showPwd ? <FaRegEyeSlash /> : <FaRegEye />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={loading || timeLeft <= 0}
                            className="w-full p-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg disabled:opacity-50 transition">
                            {loading ? 'Setting password…' : 'Set Password'}
                        </button>
                        <button type="button" onClick={handleRequestOtp} disabled={loading || timeLeft > 0}
                            className="w-full p-2 text-sm text-violet-600 hover:text-violet-700 disabled:text-gray-400 transition">
                            Resend code {timeLeft > 0 && `(${formatTime(timeLeft)})`}
                        </button>
                    </form>
                )}

                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                    Remembered? <Link to="/signin" className="text-violet-600 hover:text-violet-700 font-medium">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default SetPassword;
