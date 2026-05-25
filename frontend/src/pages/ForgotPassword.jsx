import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { IoMdArrowBack, IoMdArrowRoundBack } from "react-icons/io";
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../config/api';

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [expiresAt, setExpiresAt] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [resendDisabled, setResendDisabled] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(0);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    // Check for existing OTP session on mount
    useEffect(() => {
        const savedEmail = sessionStorage.getItem('resetEmail');
        const savedExpiry = sessionStorage.getItem('resetExpiresAt');
        const savedStep = sessionStorage.getItem('resetStep');

        if (savedEmail && savedExpiry && savedStep === '2') {
            const expiry = new Date(savedExpiry);
            if (expiry > new Date()) {
                setEmail(savedEmail);
                setExpiresAt(savedExpiry);
                setStep(2);
                toast.info('Continue with your existing OTP');
            } else {
                // OTP expired, clear session
                sessionStorage.removeItem('resetEmail');
                sessionStorage.removeItem('resetExpiresAt');
                sessionStorage.removeItem('resetStep');
            }
        }
    }, []);

    // Timer for OTP expiry and resend
    useEffect(() => {
        if (step === 2 && expiresAt) {
            const interval = setInterval(() => {
                const remaining = Math.max(0, Math.floor((new Date(expiresAt) - new Date()) / 1000));
                setTimeLeft(remaining);

                if (remaining <= 0) {
                    setResendDisabled(false);
                    clearInterval(interval);
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [step, expiresAt]);

    const validateEmail = () => {
        const newErrors = {};
        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateOtp = () => {
        const newErrors = {};
        if (!otp) {
            newErrors.otp = 'OTP is required';
        } else if (otp.length !== 6) {
            newErrors.otp = 'OTP must be 6 digits';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validatePassword = () => {
        const newErrors = {};
        if (!newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (newPassword.length < 6) {
            newErrors.newPassword = 'Password must be at least 6 characters';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSendOtp = async () => {
        if (!validateEmail()) return;

        setLoading(true);

        try {
            const response = await axios.post(`${API_URL}/api/auth/send-otp`,
                { email },
                { withCredentials: true }
            );

            // Store in sessionStorage to resume later
            sessionStorage.setItem('resetEmail', email);
            sessionStorage.setItem('resetExpiresAt', response.data.expiresAt);
            sessionStorage.setItem('resetStep', '2');

            setExpiresAt(response.data.expiresAt);
            setResendDisabled(true);
            setResendCountdown(60);

            toast.success("OTP sent to your email!");
            setStep(2);

            // Resend countdown timer
            const timer = setInterval(() => {
                setResendCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setResendDisabled(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

        } catch (error) {
            console.error('Error sending OTP:', error);
            const errorMsg = error.response?.data?.error || "Failed to send OTP. Please try again.";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!validateOtp()) return;

        setLoading(true);

        try {
            const response = await axios.post(`${API_URL}/api/auth/verify-otp`,
                { email, otp },
                { withCredentials: true }
            );

            console.log('OTP verified:', response.data);
            toast.success("OTP verified successfully!");
            setStep(3);

        } catch (error) {
            console.error('Error verifying OTP:', error);
            const errorMsg = error.response?.data?.error || "Invalid OTP. Please try again.";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!validatePassword()) return;

        setLoading(true);

        try {
            const response = await axios.post(`${API_URL}/api/auth/reset-password`,
                { email, newPassword },
                { withCredentials: true }
            );

            console.log('Password reset:', response.data);
            toast.success("Password reset successful! Please login with your new password.");

            // Clear session storage
            sessionStorage.removeItem('resetEmail');
            sessionStorage.removeItem('resetExpiresAt');
            sessionStorage.removeItem('resetStep');

            navigate('/signin');

        } catch (error) {
            console.error('Error resetting password:', error);
            const errorMsg = error.response?.data?.error || "Failed to reset password. Please try again.";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendDisabled) {
            toast.info(`Please wait ${resendCountdown} seconds before resending`);
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/auth/send-otp`,
                { email },
                { withCredentials: true }
            );

            sessionStorage.setItem('resetExpiresAt', response.data.expiresAt);
            setExpiresAt(response.data.expiresAt);
            setResendDisabled(true);
            setResendCountdown(60);

            toast.success("New OTP sent to your email!");

            // Reset countdown timer
            const timer = setInterval(() => {
                setResendCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setResendDisabled(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

        } catch (error) {
            console.error('Resend OTP error:', error);
            toast.error(error.response?.data?.error || "Failed to resend OTP");
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className='min-h-screen flex items-center justify-center p-4' style={{ backgroundColor: '#e3e5eb' }}>
            <div className='w-full max-w-md bg-white rounded-xl shadow-lg p-8 relative' style={{ border: `1px solid #5e6063` }}>
                <button
                    onClick={() => {
                        if (step === 1) {
                            navigate('/signin');
                        } else if (step === 2) {
                            setStep(1);
                            // Don't clear email, keep it for resend
                        } else if (step === 3) {
                            setStep(2);
                        }
                    }}
                    className='absolute left-4 top-4 text-gray-600 hover:text-gray-800 transition duration-300'
                >
                    <IoMdArrowBack size={24} />
                </button>

                <h1 className='text-3xl font-bold text-center' style={{ color: '#4F46E5' }}>Vingo</h1>
                <p className='text-gray-600 text-center mt-4'>
                    {step === 1 && 'Reset your password'}
                    {step === 2 && 'Enter verification code'}
                    {step === 3 && 'Create new password'}
                </p>

                {step === 1 && (
                    <div className='mt-6'>
                        <label htmlFor='email' className='block text-gray-700'>Email</label>
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
                        {errors.email && (
                            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                        )}
                        <button
                            className='w-full mt-6 p-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-300 disabled:opacity-50'
                            onClick={handleSendOtp}
                            disabled={loading}
                        >
                            {loading ? "Sending..." : "Send OTP"}
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className='mt-6'>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">

                            

                            <p className="text-sm text-blue-800">
                                OTP sent to: <strong>{email}</strong>
                            </p>
                            {timeLeft > 0 && (
                                <p className="text-xs text-blue-600 mt-1">
                                    Code expires in: <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                                </p>
                            )}
                            {timeLeft <= 0 && (
                                <p className="text-xs text-red-600 mt-1">
                                    Code expired. Please resend.
                                </p>
                            )}
                        </div>

                        <label htmlFor='otp' className='block text-gray-700'>OTP</label>
                        <input
                            type='text'
                            className={`w-full mt-2 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-2xl tracking-widest ${errors.otp ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder='______'
                            value={otp}
                            onChange={(e) => {
                                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                                if (errors.otp) setErrors({ ...errors, otp: '' });
                            }}
                            disabled={loading}
                        />
                        {errors.otp && (
                            <p className="text-red-500 text-sm mt-1">{errors.otp}</p>
                        )}

                        <div className="flex justify-between items-center mt-4">
                            <button
                                onClick={handleResendOtp}
                                disabled={loading || (timeLeft > 0 && !resendDisabled) || (resendDisabled && resendCountdown > 0)}
                                className="text-indigo-600 hover:text-indigo-800 text-sm disabled:text-gray-400"
                            >
                                {resendDisabled && resendCountdown > 0
                                    ? `Resend in ${resendCountdown}s`
                                    : timeLeft > 0
                                        ? `Resend after expiry`
                                        : 'Resend Code'}
                            </button>
                        </div>

                        <button
                            className='w-full mt-6 p-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-300 disabled:opacity-50'
                            onClick={handleVerifyOtp}
                            disabled={loading || !otp || otp.length !== 6 || timeLeft <= 0}
                        >
                            {loading ? "Verifying..." : "Verify OTP"}
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className='mt-6'>
                        <label htmlFor='newPassword' className='block text-gray-700'>New Password</label>
                        <input
                            type='password'
                            className={`w-full mt-2 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.newPassword ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder='Enter your new password (min 6 characters)'
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                if (errors.newPassword) setErrors({ ...errors, newPassword: '' });
                            }}
                            disabled={loading}
                        />
                        {errors.newPassword && (
                            <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
                        )}
                        <button
                            className='w-full mt-6 p-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-300 disabled:opacity-50'
                            onClick={handleResetPassword}
                            disabled={loading || !newPassword || newPassword.length < 6}
                        >
                            {loading ? "Resetting..." : "Reset Password"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ForgotPassword