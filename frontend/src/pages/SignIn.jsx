/* frontend/src/pages/SignIn.jsx */

import React, { useEffect, useMemo, useState } from 'react';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import GoogleLogin from '../components/GoogleLogin';
import API_URL from '../config/api';

const OTP_RESEND_SECONDS = 60;
const fmt = s => `${String(Math.max(0, s)).padStart(2, '0')}s`;

const SignIn = () => {
    const navigate = useNavigate();
    const [showPwd, setShowPwd] = useState(false);
    const [step, setStep] = useState('credentials');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [unverifiedMsg, setUnverifiedMsg] = useState('');
    const [errors, setErrors] = useState({});

    const [tfState, setTfState] = useState({
        challengeToken: '', email: '', expiresAt: null,
        resendAt: null, resendSecondsLeft: OTP_RESEND_SECONDS
    });

    useEffect(() => {
        if (step !== 'two-factor') return;
        const id = setInterval(() => {
            setTfState(cur => {
                if (!cur.resendAt) return cur;
                const left = Math.max(0, Math.ceil((new Date(cur.resendAt).getTime() - Date.now()) / 1000));
                return { ...cur, resendSecondsLeft: left };
            });
        }, 1000);
        return () => clearInterval(id);
    }, [step]);

    const resendDisabled = useMemo(() => tfState.resendSecondsLeft > 0, [tfState.resendSecondsLeft]);

    const validate = () => {
        const e = {};
        if (!email) e.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email';
        if (!password) e.password = 'Password is required';
        setErrors(e);
        return !Object.keys(e).length;
    };

    const persist = (data) => {
        if (data?.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
    };

    // ✅ Form onSubmit — triggered by Enter key OR button click
    const submitCreds = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (!validate()) return;
        setLoading(true); setUnverifiedMsg('');
        try {
            const res = await axios.post(`${API_URL}/api/auth/signin`, { email, password }, { withCredentials: true });

            if (res.data.twoFactorRequired) {
                setTfState({
                    challengeToken: res.data.challengeToken,
                    email: res.data.email || '',
                    expiresAt: res.data.expiresAt || null,
                    resendAt: res.data.expiresAt || null,
                    resendSecondsLeft: OTP_RESEND_SECONDS
                });
                setStep('two-factor'); setOtp('');
                toast.info(res.data.message || 'Verification code sent to your email');
                return;
            }
            persist(res.data);
            toast.success('Login successful!');
            navigate('/dashboard');
        } catch (err) {
            // ✨ NEW: Google user trying password login
            if (err.response?.status === 403 && err.response?.data?.requiresPasswordSetup) {
                toast.warning(err.response.data.message || 'Set a password to enable email login.');
                navigate('/set-password', { state: { email: err.response.data.email || email } });
                return;
            }
            if (err.response?.status === 403 && err.response?.data?.requiresEmailVerification) {
                setUnverifiedMsg(err.response.data.message || 'Email verification required');
                toast.warning(err.response.data.message || 'Email verification required');
            } else {
                toast.error(err.response?.data?.error || 'Signin failed');
            }
        } finally { setLoading(false); }
    };

    const submitOtp = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (otp.length !== 6) return toast.error('Enter the 6-digit code');
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/auth/two-factor/login/verify`, {
                challengeToken: tfState.challengeToken, otp
            }, { withCredentials: true });
            persist(res.data);
            toast.success('Login successful!');
            navigate('/dashboard');
        } catch (err) {
            const msg = err.response?.data?.error || 'Invalid code';
            err.response?.data?.expired ? toast.warning(msg) : toast.error(msg);
        } finally { setLoading(false); }
    };

    const resend = async () => {
        if (resendDisabled) return toast.info(`Wait ${fmt(tfState.resendSecondsLeft)} before resending`);
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/auth/two-factor/login/resend`, {
                challengeToken: tfState.challengeToken
            }, { withCredentials: true });
            setTfState(cur => ({
                ...cur,
                email: res.data.email || cur.email,
                expiresAt: res.data.expiresAt || cur.expiresAt,
                resendAt: res.data.expiresAt || new Date(Date.now() + OTP_RESEND_SECONDS * 1000),
                resendSecondsLeft: OTP_RESEND_SECONDS
            }));
            toast.success('New code sent');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to resend');
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-violet-600">Vingo</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Sign in to your account</p>
                </div>

                {unverifiedMsg && (
                    <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-300">
                        {unverifiedMsg}
                    </div>
                )}

                {step === 'credentials' ? (
                    // ✅ Wrap in <form> so Enter key submits
                    <form onSubmit={submitCreds} noValidate>
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input
                                type="email" value={email}
                                onChange={e => { setEmail(e.target.value); errors.email && setErrors({ ...errors, email: '' }); }}
                                placeholder="[email protected]"
                                disabled={loading}
                                autoComplete="email"
                                className={`mt-1 w-full p-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                            />
                            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                            <div className="relative">
                                <input
                                    type={showPwd ? 'text' : 'password'} value={password}
                                    onChange={e => { setPassword(e.target.value); errors.password && setErrors({ ...errors, password: '' }); }}
                                    placeholder="••••••••"
                                    disabled={loading}
                                    autoComplete="current-password"
                                    className={`mt-1 w-full p-3 pr-10 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                                />
                                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" tabIndex={-1}>
                                    {showPwd ? <FaRegEyeSlash /> : <FaRegEye />}
                                </button>
                            </div>
                            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                        </div>
                        <div className="mt-2 flex justify-end">
                            <Link to="/forgot-password" className="text-sm text-violet-600 hover:text-violet-700">Forgot password?</Link>
                        </div>
                        <button
                            type="submit" disabled={loading}
                            className="w-full mt-5 p-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg disabled:opacity-50 transition"
                        >{loading ? 'Signing in…' : 'Sign In'}</button>

                        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                            Don't have an account? <Link to="/signup" className="text-violet-600 hover:text-violet-700 font-medium">Sign Up</Link>
                        </p>
                        <div className="mt-4"><GoogleLogin /></div>
                    </form>
                ) : (
                    <form onSubmit={submitOtp} noValidate>
                        <div className="mt-6 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 p-3 text-sm text-violet-800 dark:text-violet-200">
                            ✅ A 6-digit verification code was sent to <strong>{tfState.email}</strong>.
                            {tfState.expiresAt && <div className="mt-1 text-xs">Expires at {new Date(tfState.expiresAt).toLocaleTimeString()}</div>}
                        </div>
                        <input
                            type="text" inputMode="numeric" maxLength={6} value={otp}
                            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            disabled={loading}
                            placeholder="______"
                            autoFocus
                            autoComplete="one-time-code"
                            className="mt-4 w-full p-3 text-center text-2xl tracking-[0.5em] rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <div className="mt-3 flex justify-between text-sm">
                            <button type="button"
                                onClick={resend} disabled={loading || resendDisabled}
                                className="text-violet-600 hover:text-violet-700 disabled:text-gray-400"
                            >{resendDisabled ? `Resend in ${fmt(tfState.resendSecondsLeft)}` : 'Resend code'}</button>
                            <button type="button"
                                onClick={() => { setStep('credentials'); setOtp(''); }}
                                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                                disabled={loading}
                            >Back</button>
                        </div>
                        <button
                            type="submit" disabled={loading}
                            className="w-full mt-5 p-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg disabled:opacity-50 transition"
                        >{loading ? 'Verifying…' : 'Verify and Continue'}</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default SignIn;
