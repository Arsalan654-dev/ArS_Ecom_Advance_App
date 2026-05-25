import React, { useEffect, useMemo, useState } from 'react';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import GoogleLogin from '../components/GoogleLogin';
import API_URL from '../config/api';

const OTP_RESEND_SECONDS = 60;

const formatSeconds = (seconds) => `${String(Math.max(0, seconds)).padStart(2, '0')}s`;

const SignIn = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState('credentials');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [twoFactorOtp, setTwoFactorOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailNotVerifiedMessage, setEmailNotVerifiedMessage] = useState('');
    const [errors, setErrors] = useState({});
    const [twoFactorState, setTwoFactorState] = useState({
        challengeToken: '',
        email: '',
        expiresAt: null,
        resendAt: null,
        resendSecondsLeft: OTP_RESEND_SECONDS
    });

    const navigate = useNavigate();

    useEffect(() => {
        if (step !== 'two-factor') {
            return undefined;
        }

        const timer = setInterval(() => {
            setTwoFactorState((current) => {
                if (!current.resendAt) {
                    return current;
                }

                const secondsLeft = Math.max(
                    0,
                    Math.ceil((new Date(current.resendAt).getTime() - Date.now()) / 1000)
                );

                return {
                    ...current,
                    resendSecondsLeft: secondsLeft
                };
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [step]);

    const isResendDisabled = useMemo(() => twoFactorState.resendSecondsLeft > 0, [twoFactorState.resendSecondsLeft]);

    const validateCredentials = () => {
        const newErrors = {};
        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        if (!password) {
            newErrors.password = 'Password is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const storeSession = (responseData) => {
        if (responseData?.token) {
            localStorage.setItem('token', responseData.token);
            localStorage.setItem('user', JSON.stringify(responseData.user));
        }
    };

    const handleCredentialsSubmit = async () => {
        if (!validateCredentials()) return;

        setLoading(true);
        setEmailNotVerifiedMessage('');

        try {
            const response = await axios.post(
                `${API_URL}/api/auth/signin`,
                { email, password },
                { withCredentials: true }
            );

            if (response.data.twoFactorRequired) {
                setTwoFactorState({
                    challengeToken: response.data.challengeToken,
                    email: response.data.email || '',
                    expiresAt: response.data.expiresAt || null,
                    resendAt: response.data.expiresAt || null,
                    resendSecondsLeft: OTP_RESEND_SECONDS
                });
                setStep('two-factor');
                setTwoFactorOtp('');
                toast.info(response.data.message || 'Verification code sent to your email');
                return;
            }

            storeSession(response.data);
            toast.success('Login successful!');
            navigate('/dashboard');
        } catch (error) {
            console.error('Signin Error:', error);

            if (error.response?.status === 403 && error.response?.data?.requiresEmailVerification) {
                setEmailNotVerifiedMessage(error.response.data.message || 'Email verification required');
                toast.warning(error.response.data.message || 'Email verification required');
            } else {
                const errorMsg = error.response?.data?.error || 'Signin failed';
                toast.error(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTwoFactorVerify = async () => {
        if (!twoFactorOtp || twoFactorOtp.length !== 6) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(
                `${API_URL}/api/auth/two-factor/login/verify`,
                {
                    challengeToken: twoFactorState.challengeToken,
                    otp: twoFactorOtp
                },
                { withCredentials: true }
            );

            storeSession(response.data);
            toast.success('Login successful!');
            navigate('/dashboard');
        } catch (error) {
            console.error('Two-factor verify error:', error);
            const errorMsg = error.response?.data?.error || 'Invalid code';
            if (error.response?.data?.expired) {
                toast.warning(errorMsg);
            } else {
                toast.error(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendTwoFactor = async () => {
        if (isResendDisabled) {
            toast.info(`Please wait ${formatSeconds(twoFactorState.resendSecondsLeft)} before resending`);
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(
                `${API_URL}/api/auth/two-factor/login/resend`,
                { challengeToken: twoFactorState.challengeToken },
                { withCredentials: true }
            );

            setTwoFactorState((current) => ({
                ...current,
                email: response.data.email || current.email,
                expiresAt: response.data.expiresAt || current.expiresAt,
                resendAt: response.data.expiresAt || new Date(Date.now() + OTP_RESEND_SECONDS * 1000),
                resendSecondsLeft: OTP_RESEND_SECONDS
            }));
            toast.success('New verification code sent');
        } catch (error) {
            console.error('Two-factor resend error:', error);
            toast.error(error.response?.data?.error || 'Failed to resend code');
        } finally {
            setLoading(false);
        }
    };

    const renderCredentialsStep = () => (
        <>
            <div className='mt-6'>
                <label className='block text-gray-700'>Email</label>
                <input
                    type='email'
                    className={`w-full mt-2 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder='Enter your email'
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    disabled={loading}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div className='mt-6'>
                <label className='block text-gray-700'>Password</label>
                <div className='relative'>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        className={`w-full mt-2 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder='Enter your password'
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (errors.password) setErrors({ ...errors, password: '' });
                        }}
                        disabled={loading}
                    />
                    <button
                        type='button'
                        className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600'
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {!showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
                    </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div className='mt-4 flex justify-end'>
                <Link to='/forgot-password' className='text-indigo-600 hover:text-indigo-800'>
                    Forgot password?
                </Link>
            </div>

            <button
                className='w-full mt-6 p-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50'
                onClick={handleCredentialsSubmit}
                disabled={loading}
            >
                {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className='text-gray-600 text-center mt-4'>
                Don't have an account?{' '}
                <Link to='/signup' className='text-indigo-600 hover:text-indigo-800'>
                    Sign Up
                </Link>
            </p>

            <div className='mt-4'>
                <GoogleLogin />
            </div>
        </>
    );

    const renderTwoFactorStep = () => (
        <>
            <div className='mt-6 rounded-lg border border-indigo-200 bg-indigo-50 p-4'>
                <p className='text-sm text-indigo-800 font-medium'>✅ Two-step verification enabled</p>
                <p className='text-sm text-indigo-700 mt-1'>
                    We sent a 6-digit code to your email {twoFactorState.email ? `(${twoFactorState.email})` : ''}.
                </p>
                {twoFactorState.expiresAt && (
                    <p className='text-xs text-indigo-600 mt-2'>
                        Code expires at {new Date(twoFactorState.expiresAt).toLocaleTimeString()}
                    </p>
                )}
            </div>

            <div className='mt-6'>
                <label className='block text-gray-700'>Verification Code</label>
                <input
                    type='text'
                    inputMode='numeric'
                    maxLength={6}
                    className='w-full mt-2 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 tracking-[0.3em] text-center text-lg'
                    placeholder='______'
                    value={twoFactorOtp}
                    onChange={(e) => setTwoFactorOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    disabled={loading}
                />
            </div>

            <div className='mt-4 flex items-center justify-between text-sm'>
                <button
                    type='button'
                    onClick={handleResendTwoFactor}
                    disabled={loading || isResendDisabled}
                    className='text-indigo-600 hover:text-indigo-800 disabled:text-gray-400'
                >
                    {isResendDisabled ? `Resend in ${formatSeconds(twoFactorState.resendSecondsLeft)}` : 'Resend code'}
                </button>

                <button
                    type='button'
                    onClick={() => {
                        setStep('credentials');
                        setTwoFactorOtp('');
                    }}
                    className='text-gray-600 hover:text-gray-800'
                    disabled={loading}
                >
                    Back
                </button>
            </div>

            <button
                className='w-full mt-6 p-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50'
                onClick={handleTwoFactorVerify}
                disabled={loading}
            >
                {loading ? 'Verifying...' : 'Verify and Continue'}
            </button>
        </>
    );

    return (
        <div className='min-h-screen flex items-center justify-center p-4 bg-gray-200'>
            <div className='w-full max-w-md bg-white rounded-xl shadow-lg p-8'>
                <h1 className='text-3xl font-bold text-center text-indigo-600'>Vingo</h1>
                <p className='text-gray-600 text-center mt-4'>Sign in to your account</p>

                {emailNotVerifiedMessage && (
                    <div className='mt-4 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800'>
                        {emailNotVerifiedMessage}
                    </div>
                )}

                {step === 'credentials' ? renderCredentialsStep() : renderTwoFactorStep()}
            </div>
        </div>
    );
};

export default SignIn;