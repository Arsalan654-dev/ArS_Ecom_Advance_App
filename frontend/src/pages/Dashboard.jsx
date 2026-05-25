// pages/Dashboard.jsx - Updated version
import { toast } from 'react-toastify';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import  API_URL  from '../config/api';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

 // First try to get user from localStorage
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        console.log("Stored user:", storedUser);
        console.log("Stored token:", token);
        
        if (!token) {
            console.log("No token, redirecting to login");
            navigate('/signin');
            return;
        }
        
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                console.log("Parsed user from storage:", parsedUser);
                setUser(parsedUser);
            } catch (e) {
                console.error("Error parsing user:", e);
            }
        }




        // Fetch user profile on mount
        const fetchProfile = async () => {
            try {
               

                const response = await axios.get(`${API_URL}/api/auth/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    withCredentials: true
                });
                console.log("Profile response from:", response.data);

                setUser(response.data.user);


                localStorage.setItem('user', JSON.stringify(response.data.user));

            } catch (error) {
                console.error('Error fetching profile:', error);
                // If token is invalid, logout
                if (error.response?.status === 401) {
                    handleSignOut();
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleSignOut = async () => {
        try {
            // Optional: Call backend logout endpoint
            await axios.post(`${API_URL}/api/auth/signout`, {}, {
                withCredentials: true
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Clear any other auth data
            sessionStorage.clear();
            localStorage.clear();

            toast.success("Logged out successfully!");

           window.location.href = '/signin';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto p-8">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h1 className="text-3xl font-bold text-indigo-600 mb-6">Dashboard</h1>
                    
                    {user && (
                        <div className="space-y-4">
                            {/* Avatar Section */}
                            <div className="flex items-center gap-4">
                                {user.avatar ? (
                                    <img 
                                        src={user.avatar} 
                                        alt={user.fullName}
                                        className="w-20 h-20 rounded-full object-cover border-2 border-indigo-600"
                                        onError={(e) => {
                                            console.log("Avatar failed to load:", user.avatar);
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div 
                                    className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold"
                                    style={{ display: user.avatar ? 'none' : 'flex' }}
                                >
                                    {user.fullName?.charAt(0).toUpperCase()}
                                </div>
                                
                                <div>
                                    <p className="text-2xl font-semibold text-gray-800">{user.fullName}</p>
                                    <p className="text-gray-600">{user.email}</p>
                                </div>
                            </div>
                            
                            {/* User Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t">
                                <div>
                                    <label className="block text-gray-600 text-sm">Email</label>
                                    <p className="text-gray-800 font-medium">{user.email}</p>
                                </div>
                                <div>
                                    <label className="block text-gray-600 text-sm">Role</label>
                                    <p className="text-gray-800 font-medium capitalize">{user.role}</p>
                                </div>
                                <div>
                                    <label className="block text-gray-600 text-sm">Mobile</label>
                                    <p className="text-gray-800 font-medium">{user.mobile || 'Not provided'}</p>
                                </div>
                                <div>
                                    <label className="block text-gray-600 text-sm">Google Verified</label>
                                    <p className="text-gray-800 font-medium">{user.isGoogleVerified ? 'Yes ✓' : 'No'}</p>
                                </div>
                            </div>
                            
                            {/* Buttons */}
                            <div className="flex gap-4 mt-6 pt-6 border-t">
                                <button 
                                    className='bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition'
                                    onClick={() => navigate('/profile')}
                                >
                                    Edit Profile
                                </button>
                                
                                <button 
                                    className='bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 transition'
                                    onClick={handleSignOut}
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;