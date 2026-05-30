/* frontend/src/pages/ForgotPassword.jsx */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoMdArrowBack, IoMdArrowForward } from 'react-icons/io';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../config/api';

const STORAGE_KEYS = {
    EMAIL: 'vingo_reset_email',
    EXPIRES: 'vingo_reset_expires',
    STEP: 'vingo_reset_step'
};

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [expiresAt, setExpiresAt] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [errors, setErrors] = useState({});
    const [hasValidSession, setHasValidSession] = useState(false);

    useEffect(() => {
        const storedEmail = sessionStorage.getItem(STORAGE_KEYS.EMAIL);
        const storedExpires = sessionStorage.getItem(STORAGE_KEYS.EXPIRES);
        const storedStep = sessionStorage.getItem(STORAGE_KEYS.STEP);
        if (storedEmail && storedExpires) {
            const expTime = new Date(storedExpires).getTime();
            if (expTime > Date.now()) {
                setEmail(storedEmail);
                setExpiresAt(storedExpires);
                setHasValidSession(true);
                if (storedStep === '2') setStep(2);
            } else { clearSession(); }
        }
    }, []);

    useEffect(() => {
        if (!expiresAt) return;
        const tick = () => {
            const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
            setTimeLeft(diff);
            if (diff <= 0) { setHasValidSession(false); clearSession(); }
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [expiresAt]);

    const clearSession = () => {
        sessionStorage.removeItem(STORAGE_KEYS.EMAIL);
        sessionStorage.removeItem(STORAGE_KEYS.EXPIRES);
        sessionStorage.removeItem(STORAGE_KEYS.STEP);
    };

    const formatTime = (secs) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;

    const handleSendOtp = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (!email) return setErrors({ email: 'Email is required' });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErrors({ email: 'Please enter a valid email' });

        setLoading(true); setErrors({});
        try {
            const res = await axios.post(`${API_URL}/api/auth/send-otp`, { email });
            const exp = res.data.expiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString();
            sessionStorage.setItem(STORAGE_KEYS.EMAIL, email);
            sessionStorage.setItem(STORAGE_KEYS.EXPIRES, exp);
            sessionStorage.setItem(STORAGE_KEYS.STEP, '2');
            setExpiresAt(exp); setHasValidSession(true); setStep(2);
            toast.success('OTP sent to your email!');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to send OTP');
        } finally { setLoading(false); }
    };

    const handleVerifyOtp = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (!otp || otp.length !== 6) return setErrors({ otp: 'Enter the 6-digit code' });
        setLoading(true); setErrors({});
        try {
            await axios.post(`${API_URL}/api/auth/verify-otp`, { email, otp });
            sessionStorage.setItem(STORAGE_KEYS.STEP, '3');
            setStep(3);
            toast.success('OTP verified! Set your new password.');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Invalid or expired OTP');
        } finally { setLoading(false); }
    };

    const handleResetPassword = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (!newPassword || newPassword.length < 6) return setErrors({ password: 'Password must be at least 6 characters' });
        setLoading(true); setErrors({});
        try {
            await axios.post(`${API_URL}/api/auth/reset-password`, { email, newPassword });
            clearSession();
            toast.success('Password reset successfully! Please sign in.');
            setTimeout(() => navigate('/signin'), 1200);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to reset password');
        } finally { setLoading(false); }
    };

    const handleBack = () => {
        if (step === 1) navigate('/signin');
        else if (step === 2) { sessionStorage.setItem(STORAGE_KEYS.STEP, '1'); setStep(1); }
        else if (step === 3) { sessionStorage.setItem(STORAGE_KEYS.STEP, '2'); setStep(2); }
    };

    const handleForwardToOtp = useCallback(() => {
        if (hasValidSession) {
            sessionStorage.setItem(STORAGE_KEYS.STEP, '2');
            setStep(2);
            toast.info('Your previous OTP is still valid — enter it below.');
        }
    }, [hasValidSession]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 relative border border-gray-200 dark:border-gray-800">
                <button type="button" onClick={handleBack}
                    className="absolute left-4 top-4 p-2 rounded-lg text-gray-500 hover:text-violet-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition" aria-label="Go back">
                    <IoMdArrowBack size={22} />
                </button>

                {step === 1 && hasValidSession && (
                    <button type="button" onClick={handleForwardToOtp}
                        className="absolute right-4 top-4 p-2 rounded-lg text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition flex items-center gap-1 text-sm font-medium"
                        title="Continue with existing OTP">
                        Continue <IoMdArrowForward size={20} />
                    </button>
                )}

                <div className="text-center mt-6">
                    <h1 className="text-3xl font-bold text-violet-600">Vingo</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        {step === 1 && 'Reset your password'}
                        {step === 2 && 'Enter verification code'}
                        {step === 3 && 'Create a new password'}
                    </p>
                    <div className="flex justify-center gap-2 mt-4">
                        {[1,2,3].map(n => (
                            <div key={n} className={`h-1.5 w-10 rounded-full transition ${step >= n ? 'bg-violet-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                        ))}
                    </div>
                </div>

                {step === 1 && (
                    <form onSubmit={handleSendOtp} noValidate className="mt-8 space-y-4">
                        {hasValidSession && (
                            <div className="rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 p-3 text-sm text-violet-800 dark:text-violet-200">
                                💡 You have an unfinished verification for <strong>{email}</strong>. OTP valid for <strong>{formatTime(timeLeft)}</strong>. Tap <strong>Continue →</strong>.
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors({}); }}
                                placeholder="[email protected]" disabled={loading} autoFocus autoComplete="email"
                                className={`mt-1 w-full p-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`} />
                            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full p-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg disabled:opacity-50 transition">
                            {loading ? 'Sending…' : 'Send OTP'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOtp} noValidate className="mt-8 space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                            Code sent to <strong className="text-gray-900 dark:text-gray-100">{email}</strong>
                        </p>
                        <input type="text" inputMode="numeric" maxLength={6} value={otp}
                            onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrors({}); }}
                            placeholder="______" disabled={loading} autoFocus autoComplete="one-time-code"
                            className={`w-full p-3 text-center text-2xl tracking-[0.5em] rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.otp ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`} />
                        {errors.otp && <p className="text-sm text-red-500 text-center">{errors.otp}</p>}
                        {timeLeft > 0 ? (
                            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                                Expires in <span className="font-mono font-semibold text-violet-600">{formatTime(timeLeft)}</span>
                            </p>
                        ) : (
                            <p className="text-xs text-center text-red-500">OTP expired. Please request a new one.</p>
                        )}
                        <button type="submit" disabled={loading || timeLeft <= 0}
                            className="w-full p-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg disabled:opacity-50 transition">
                            {loading ? 'Verifying…' : 'Verify OTP'}
                        </button>
                        <button type="button" onClick={handleSendOtp} disabled={loading || timeLeft > 0}
                            className="w-full p-2 text-sm text-violet-600 hover:text-violet-700 disabled:text-gray-400 transition">
                            Resend OTP {timeLeft > 0 && `(${formatTime(timeLeft)})`}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleResetPassword} noValidate className="mt-8 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                            <div className="relative">
                                <input type={showPassword ? 'text' : 'password'} value={newPassword}
                                    onChange={e => { setNewPassword(e.target.value); setErrors({}); }}
                                    placeholder="At least 6 characters" disabled={loading} autoFocus autoComplete="new-password"
                                    className={`mt-1 w-full p-3 pr-10 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`} />
                                <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" tabIndex={-1}>
                                    {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                                </button>
                            </div>
                            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full p-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg disabled:opacity-50 transition">
                            {loading ? 'Resetting…' : 'Reset Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
