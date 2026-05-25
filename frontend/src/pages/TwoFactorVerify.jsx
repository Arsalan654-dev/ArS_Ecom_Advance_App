import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../config/api';

const TwoFactorVerify = () => {
    const navigate = useNavigate();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [expiresAt, setExpiresAt] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [resendDisabled, setResendDisabled] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(0);
    const [email, setEmail] = useState('');
    const [challengeToken, setChallengeToken] = useState('');

    useEffect(() => {
        const token = sessionStorage.getItem('twoFactorChallengeToken');
        const storedEmail = sessionStorage.getItem('twoFactorEmail');
        const expiry = sessionStorage.getItem('twoFactorExpiresAt');
        
        if (!token || !storedEmail) {
            toast.error('Session expired. Please login again.');
            navigate('/signin');
            return;
        }
        
        setChallengeToken(token);
        setEmail(storedEmail);
        setExpiresAt(expiry);
        
        // Timer for OTP expiry
        const interval = setInterval(() => {
            if (expiry) {
                const remaining = Math.max(0, Math.floor((new Date(expiry) - new Date()) / 1000));
                setTimeLeft(remaining);
                if (remaining <= 0) {
                    setResendDisabled(false);
                }
            }
        }, 1000);
        
        return () => clearInterval(interval);
    }, [navigate]);

    const handleVerify = async () => {
        if (!otp || otp.length !== 6) {
            toast.error('Please enter valid 6-digit code');
            return;
        }
        
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/auth/two-factor/login/verify`, {
                challengeToken: challengeToken,
                otp: otp
            }, { withCredentials: true });
            
            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                
                // Clear 2FA session
                sessionStorage.removeItem('twoFactorChallengeToken');
                sessionStorage.removeItem('twoFactorEmail');
                sessionStorage.removeItem('twoFactorExpiresAt');
                sessionStorage.removeItem('isGoogleTwoFactor');
                
                toast.success('Login successful!');
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('2FA Verify Error:', error);
            const errorMsg = error.response?.data?.error || 'Invalid code';
            if (error.response?.data?.expired) {
                toast.warning('Code expired. Please resend.');
                setResendDisabled(false);
            } else {
                toast.error(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResendDisabled(true);
        setResendCountdown(60);
        
        try {
            const response = await axios.post(`${API_URL}/api/auth/two-factor/login/resend`, {
                challengeToken: challengeToken
            }, { withCredentials: true });
            
            if (response.data.success) {
                sessionStorage.setItem('twoFactorExpiresAt', response.data.expiresAt);
                setExpiresAt(response.data.expiresAt);
                toast.success('New code sent to your email');
                
                // Countdown timer
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
            }
        } catch (error) {
            console.error('Resend error:', error);
            toast.error(error.response?.data?.error || 'Failed to resend code');
            setResendDisabled(false);
            setResendCountdown(0);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                <h1 className="text-2xl font-bold text-center text-indigo-600 mb-6">
                    Two-Factor Authentication
                </h1>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800">
                        A verification code has been sent to your email:
                    </p>
                    <p className="text-sm font-medium text-blue-900 mt-1">
                        {email}
                    </p>
                    {timeLeft > 0 && (
                        <p className="text-xs text-blue-600 mt-2">
                            Code expires in: <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                        </p>
                    )}
                </div>
                
                <div className="mb-6">
                    <label className="block text-gray-700 mb-2">Verification Code</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit code"
                        className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-2xl tracking-widest"
                        disabled={loading}
                    />
                </div>
                
                <button
                    onClick={handleVerify}
                    disabled={loading || !otp || otp.length !== 6}
                    className="w-full bg-indigo-600 text-white p-3 rounded-md hover:bg-indigo-700 disabled:opacity-50 mb-4"
                >
                    {loading ? 'Verifying...' : 'Verify & Login'}
                </button>
                
                <div className="flex justify-between items-center text-sm">
                    <button
                        onClick={handleResend}
                        disabled={resendDisabled}
                        className="text-indigo-600 hover:text-indigo-800 disabled:text-gray-400"
                    >
                        {resendDisabled ? `Resend in ${resendCountdown}s` : 'Resend Code'}
                    </button>
                    
                    <button
                        onClick={() => navigate('/signin')}
                        className="text-gray-600 hover:text-gray-800"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TwoFactorVerify;