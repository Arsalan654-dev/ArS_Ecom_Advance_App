import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { FaGoogle } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../config/api';

const GoogleLogin = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);

    const isSignupPage = location.pathname === '/signup';

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            console.log('Google Success:', tokenResponse);
            setLoading(true);

            try {
                // Get user info using access token
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: {
                        Authorization: `Bearer ${tokenResponse.access_token}`
                    }
                });

                const userInfo = await userInfoResponse.json();
                console.log('User Info:', userInfo);

                // Send user info to backend
                const res = await axios.post(
                    `${API_URL}/api/auth/google`,
                    {
                        email: userInfo.email,
                        name: userInfo.name,
                        password: null, // No password for Google users
                        role: 'user',
                        picture: userInfo.picture,
                        googleId: userInfo.sub,
                        isGoogleVerified: true,
                        avatar: userInfo.picture || null
                    },
                    { withCredentials: true }
                );

                console.log('Backend Response:', res.data);


                // YEH CHECK ADD KARO - 2FA Required case handle
                if (res.data.twoFactorRequired) {
                    // Store challenge token for 2FA
                    sessionStorage.setItem('twoFactorChallengeToken', res.data.challengeToken);
                    sessionStorage.setItem('twoFactorEmail', res.data.email);
                    sessionStorage.setItem('twoFactorExpiresAt', res.data.expiresAt);
                    sessionStorage.setItem('isGoogleTwoFactor', 'true');

                    // Redirect to 2FA page
                    window.location.href = '/two-factor-verify';
                    return;
                }



                if (res.data.success) {

                    localStorage.clear();

                    const token = res.data.token;
                    console.log("Storing token:", token);

                    localStorage.setItem('token', token);
                    localStorage.setItem('user', JSON.stringify(res.data.user));


                    console.log("Token stored:", res.data.token);
                    console.log("User stored:", res.data.user);

                    const successMsg = isSignupPage ? 'Google signup successful!' : 'Google login successful!';
                    toast.success(successMsg);
                    navigate('/dashboard');
                }
            } catch (error) {
                console.error('Backend error:', error);
                const errorMsg = error.response?.data?.error || `Google ${isSignupPage ? 'signup' : 'login'} failed`;
                toast.error(errorMsg);
            } finally {
                setLoading(false);
            }
        },
        onError: (error) => {
            console.error('Google Error:', error);
            const errorMsg = `Google ${isSignupPage ? 'signup' : 'login'} failed`;
            toast.error(errorMsg);
            setLoading(false);
        }
    });

    return (
        <button
            onClick={() => login()}
            disabled={loading}
            className="w-full mt-4 p-3 border rounded-md flex items-center justify-center gap-2 hover:bg-gray-100 transition duration-300 disabled:opacity-50"
        >
            <FaGoogle />
            {loading ? 'Connecting...' : `${isSignupPage ? 'Sign up' : 'Sign in'} with Google`}
        </button>
    );
};

export default GoogleLogin;