// D:\Vingo\frontend\src\pages\VerifyEmail.jsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import  API_URL  from '../config/api';

const VerifyEmail = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/auth/verify-email/${token}`);
                setStatus('success');
                setMessage(response.data.message);
                
                setTimeout(() => {
                    navigate('/signin');
                }, 3000);
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.error || 'Verification failed');
            }
        };
        
        verifyEmail();
    }, [token, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
                {status === 'verifying' && (
                    <>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Verifying your email...</p>
                    </>
                )}
                
                {status === 'success' && (
                    <>
                        <div className="text-green-500 text-5xl mb-4">✓</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Email Verified!</h2>
                        <p className="text-gray-600">{message}</p>
                        <p className="text-gray-500 mt-4">Redirecting to login...</p>
                    </>
                )}
                
                {status === 'error' && (
                    <>
                        <div className="text-red-500 text-5xl mb-4">✗</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h2>
                        <p className="text-gray-600">{message}</p>
                        <button
                            onClick={() => navigate('/signin')}
                            className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
                        >
                            Go to Login
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;