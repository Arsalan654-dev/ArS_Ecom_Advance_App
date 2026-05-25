import React, { useState } from 'react'
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import GoogleLogin from '../components/GoogleLogin';
import API_URL from '../config/api';

const SignUp = () => {
    const primaryColor = '#4F46E5'
    const bgColor = '#e3e5eb'
    const borderColor = '#5e6063'
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState('user');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mobile, setMobile] = useState('');
    const [loading, setLoading] = useState(false);
    const [signupSuccess, setSignupSuccess] = useState(false);
    const [signupEmail, setSignupEmail] = useState('');
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const validateForm = () => {
        const newErrors = {};
        
        if (!fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }
        
        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        
        if (!mobile) {
            newErrors.mobile = 'Mobile number is required';
        } else if (mobile.length < 10 || mobile.length > 13) {
            newErrors.mobile = 'Mobile number must be 10-13 digits long';
        }
        
        if (!role) {
            newErrors.role = 'Role is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignUp = async () => {
        if (!validateForm()) return;
        
        setLoading(true);
        
        try {
            const response = await axios.post(`${API_URL}/api/auth/signup`, {
                fullName,
                email,
                password,
                mobile,
                role,
            }, { withCredentials: true });
            
            console.log('Signup Response:', response.data);
            
            if (response.data.success) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
                
                setSignupSuccess(true);
                setSignupEmail(email);
                toast.success("Signup successful! Please verify your email.");
                
                setTimeout(() => {
                    navigate('/signin', { replace: true });
                }, 4000);
            } else {
                const errorMsg = response.data.message || "Signup failed";
                toast.error(errorMsg);
            }
            
        } catch (error) {
            console.error('Signup Error:', error);
            
            let errorMessage = "Signup failed. Please try again.";
            
            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message === 'Network Error') {
                errorMessage = "Network error. Please check if server is running.";
            }
            
            toast.error(errorMessage);
            
        } finally {
            setLoading(false);
        }
    };

    if (signupSuccess) {
        return (
            <div className='min-h-screen flex items-center justify-center p-4' style={{ backgroundColor: bgColor }}>
                <div className='w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center' style={{ border: `1px solid ${borderColor}` }}>
                    <div className="text-green-500 text-5xl mb-4">✓</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Signup Successful!</h2>
                    <p className='text-gray-600 mb-4'>
                        A verification link has been sent to <strong>{signupEmail}</strong>
                    </p>
                    <p className='text-gray-600 mb-2'>
                        Please check your email and click the verification link to complete your signup.
                    </p>
                    <p className='text-gray-500 text-sm mt-4'>Redirecting to login in a moment...</p>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen flex items-center justify-center p-4' style={{ backgroundColor: bgColor }}>
            <div className='w-full max-w-md bg-white rounded-xl shadow-lg p-8' style={{ border: `1px solid ${borderColor}` }}>
                <h1 className='text-3xl font-bold text-center' style={{ color: primaryColor }}>Vingo</h1>
                <p className='text-gray-600 text-center mt-4'>Sign up for a new account</p>
                
                {/* Full Name */}
                <div className='mt-6'>
                    <label htmlFor='fullName' className='block text-gray-700'>Full Name</label>
                    <input 
                        type='text' 
                        className={`w-full mt-2 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder='Enter your full name' 
                        value={fullName} 
                        onChange={(e) => {
                            setFullName(e.target.value);
                            if (errors.fullName) setErrors({ ...errors, fullName: '' });
                        }}
                        disabled={loading}
                    />
                    {errors.fullName && (
                        <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                    )}
                </div>
                
                {/* Email */}
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
                </div>
                
                {/* Password */}
                <div className='mt-6'>
                    <label htmlFor='password' className='block text-gray-700'>Password</label>
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
                            className='absolute right-3 cursor-pointer top-1/2 transform -translate-y-1/2 text-gray-600' 
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={loading}
                        >
                            {!showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                    )}
                </div>
                
                {/* Mobile */}
                <div className='mt-6'>
                    <label htmlFor='mobile' className='block text-gray-700'>Mobile</label>
                    <input 
                        type='tel' 
                        className={`w-full mt-2 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.mobile ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder='Enter your mobile number (10-13 digits)' 
                        value={mobile} 
                        onChange={(e) => {
                            setMobile(e.target.value.replace(/\D/g, ''));
                            if (errors.mobile) setErrors({ ...errors, mobile: '' });
                        }}
                        disabled={loading}
                    />
                    {errors.mobile && (
                        <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
                    )}
                </div>
                
                {/* Role */}
                <div className='mt-6'>
                    <label className='block text-gray-700'>Role</label>
                    <select 
                        className={`w-full mt-2 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.role ? 'border-red-500' : 'border-gray-300'}`}
                        value={role} 
                        onChange={(e) => {
                            setRole(e.target.value);
                            if (errors.role) setErrors({ ...errors, role: '' });
                        }}
                        disabled={loading}
                    >
                        <option value="user">User</option>
                        <option value="owner">Owner</option>
                        <option value="deliveryBoy">Delivery Partner</option>
                    </select>
                    {errors.role && (
                        <p className="text-red-500 text-sm mt-1">{errors.role}</p>
                    )}
                </div>
                
                {/* Sign Up Button */}
                <button 
                    className='w-full mt-6 p-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed' 
                    onClick={handleSignUp}
                    disabled={loading}
                >
                    {loading ? "Signing up..." : "Sign Up"}
                </button>
                
                {/* Divider */}
                <div className='mt-6 flex items-center'>
                    <div className='flex-1 border-t' style={{ borderColor: borderColor }}></div>
                    <span className='px-3 text-gray-500 text-sm'>Or</span>
                    <div className='flex-1 border-t' style={{ borderColor: borderColor }}></div>
                </div>
                
                {/* Google Sign Up */}
                <GoogleLogin />
                
                {/* Sign In Link */}
                <p className='text-gray-600 text-center mt-4'>
                    Already have an account? <Link to='/signin' className='text-indigo-600 hover:text-indigo-800'>Sign In</Link>
                </p>
            </div>
        </div>
    )
}

export default SignUp