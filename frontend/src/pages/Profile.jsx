import React, { useEffect, useRef, useState } from 'react';
import { IoMdArrowBack } from 'react-icons/io';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../config/api';

const OTP_RESEND_SECONDS = 60;

const formatSeconds = (seconds) => `${String(Math.max(0, seconds)).padStart(2, '0')}s`;

const Profile = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    const [profileSaving, setProfileSaving] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);


    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: ''
    });

    const [formData, setFormData] = useState({
        fullName: '',
        mobile: '',
        role: ''
    });

    const [twoFactorForm, setTwoFactorForm] = useState({
        phoneNumber: '',
        otp: ''
    });

    const [twoFactorChallenge, setTwoFactorChallenge] = useState({
        expiresAt: null,
        resendAt: null,
        resendSecondsLeft: OTP_RESEND_SECONDS
    });

    const [twoFactorLoading, setTwoFactorLoading] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (!twoFactorChallenge.resendAt) {
            return undefined;
        }

        const timer = setInterval(() => {
            setTwoFactorChallenge((current) => {
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
    }, [twoFactorChallenge.resendAt]);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
            });

            setUser(response.data.user);
            setFormData({
                fullName: response.data.user.fullName || '',
                mobile: response.data.user.mobile || '',
                role: response.data.user.role || 'user'
            });
            setImagePreview(response.data.user.avatar || null);

            if (response.data.user.twoFactorPhone) {
                setTwoFactorForm((current) => ({
                    ...current,
                    phoneNumber: response.data.user.twoFactorPhone
                }));
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            if (error.response?.status === 401) {
                navigate('/signin');
            }
            toast.error(error.response?.data?.error || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);

        setUploading(true);
        const uploadData = new FormData();
        uploadData.append('avatar', file);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/api/auth/upload-avatar`,
                uploadData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    },
                    withCredentials: true
                }
            );

            setUser((current) => ({ ...current, avatar: response.data.avatar }));
            localStorage.setItem('user', JSON.stringify({ ...user, avatar: response.data.avatar }));
            toast.success('Profile picture updated!');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error.response?.data?.error || 'Upload failed');
            setImagePreview(user?.avatar || null);
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    const handleUpdateProfile = async () => {
        if (!formData.fullName.trim()) {
            toast.error('Full name is required');
            return;
        }

        if (formData.mobile && !/^\d{10,13}$/.test(formData.mobile)) {
            toast.error('Mobile number must be 10-13 digits');
            return;
        }

        setProfileSaving(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${API_URL}/api/auth/profile`,
                formData,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true
                }
            );

            setUser(response.data.user);
            setEditing(false);
            toast.success('Profile updated successfully!');
            localStorage.setItem('user', JSON.stringify(response.data.user));
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.error || 'Failed to update profile');
        } finally {
            setProfileSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword) {
            toast.error('Please fill both password fields');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setPasswordSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/api/auth/change-password`,
                {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true
                }
            );

            toast.success('Password changed successfully!');
            setPasswordData({ currentPassword: '', newPassword: '' });
        } catch (error) {
            console.error('Error changing password:', error);
            toast.error(error.response?.data?.error || 'Failed to change password');
        } finally {
            setPasswordSaving(false);
        }
    };

    const handleRequestTwoFactorCode = async () => {
        setTwoFactorLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/api/auth/two-factor/setup/request`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true
                }
            );

            setTwoFactorChallenge({
                expiresAt: response.data.expiresAt || null,
                resendAt: new Date(Date.now() + OTP_RESEND_SECONDS * 1000) || null,
                resendSecondsLeft: OTP_RESEND_SECONDS
            });

            toast.success(response.data.message || 'Verification code sent');
        } catch (error) {
            console.error('Two-factor request error:', error);
            toast.error(error.response?.data?.error || 'Failed to send verification code');
        } finally {
            setTwoFactorLoading(false);
        }
    };

    const handleVerifyTwoFactorCode = async () => {
        if (!twoFactorForm.otp || twoFactorForm.otp.length !== 6) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }

        setTwoFactorLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/api/auth/two-factor/setup/verify`,
                { otp: twoFactorForm.otp },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true
                }
            );

            setUser((current) => ({ ...current, twoFactorEnabled: true }));
            localStorage.setItem('user', JSON.stringify({ ...user, twoFactorEnabled: true }));
            setTwoFactorForm((current) => ({ ...current, otp: '' }));
            toast.success(response.data.message || 'Two-factor authentication enabled');
        } catch (error) {
            console.error('Two-factor verify error:', error);
            const errorMsg = error.response?.data?.error || 'Invalid code';
            if (error.response?.data?.expired) {
                toast.warning(errorMsg);
            } else {
                toast.error(errorMsg);
            }
        } finally {
            setTwoFactorLoading(false);
        }
    };

    const handleResendTwoFactorCode = async () => {
        if (twoFactorChallenge.resendSecondsLeft > 0) {
            toast.info(`Please wait ${formatSeconds(twoFactorChallenge.resendSecondsLeft)} before resending`);
            return;
        }

        setTwoFactorLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/api/auth/two-factor/setup/resend`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true
                }
            );

            setTwoFactorChallenge({
                expiresAt: response.data.expiresAt || null,
                resendAt: new Date(Date.now() + OTP_RESEND_SECONDS * 1000) || null,
                resendSecondsLeft: OTP_RESEND_SECONDS
            });

            toast.success(response.data.message || 'Verification code resent');
        } catch (error) {
            console.error('Two-factor resend error:', error);
            toast.error(error.response?.data?.error || 'Failed to resend code');
        } finally {
            setTwoFactorLoading(false);
        }
    };

    const handleDisableTwoFactor = async () => {
        setTwoFactorLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/api/auth/two-factor/disable`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true
                }
            );

            setUser((current) => ({ ...current, twoFactorEnabled: false }));
            localStorage.setItem('user', JSON.stringify({ ...user, twoFactorEnabled: false }));
            setTwoFactorChallenge({
                expiresAt: null,
                resendAt: null,
                resendSecondsLeft: OTP_RESEND_SECONDS
            });
            setTwoFactorForm((current) => ({ ...current, otp: '' }));
            toast.success(response.data.message || 'Two-factor authentication disabled');
        } catch (error) {
            console.error('Two-factor disable error:', error);
            toast.error(error.response?.data?.error || 'Failed to disable two-factor authentication');
        } finally {
            setTwoFactorLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        setDownloadingPdf(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_URL}/api/auth/download-pdf`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                    responseType: 'blob'
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const fileName = `Vingo_Profile_${user?.fullName?.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentChild.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Profile downloaded as PDF!');
        } catch (error) {
            console.error('PDF download error:', error);
            toast.error(error.response?.data?.error || 'Failed to download PDF');
        } finally {
            setDownloadingPdf(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword.trim()) {
            toast.error('Please enter your password');
            return;
        }

        setDeleting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `${API_URL}/api/auth/delete-account`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                    data: { password: deletePassword }
                }
            );

            toast.success('Account deleted successfully');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setTimeout(() => {
                navigate('/signin');
            }, 1500);
        } catch (error) {
            console.error('Delete account error:', error);
            toast.error(error.response?.data?.error || 'Failed to delete account');
            setDeletePassword('');
        } finally {
            setDeleting(false);
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
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="container mx-auto max-w-4xl px-4 relative">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="absolute left-4 top-0 text-gray-600 hover:text-gray-800 transition duration-300"
                >
                    <IoMdArrowBack size={24} />
                </button>

                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex flex-col items-center">
                        <h3 className="text-lg font-semibold mb-4">Profile Picture</h3>

                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                            onChange={handleImageUpload}
                            disabled={uploading}
                        />

                        <div className="relative group cursor-pointer" onClick={triggerFileInput}>
                            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-indigo-500">
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold bg-indigo-100 text-indigo-600">
                                        {user?.fullName?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {uploading ? (
                                    <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </div>
                        </div>

                        <p className="text-sm text-gray-500 mt-4">
                            {uploading ? 'Uploading...' : 'Click on the camera icon to upload photo'}
                        </p>
                        <p className="text-xs text-gray-400">
                            JPG, PNG, GIF, WebP (Max 5MB)
                        </p>

                        <h2 className="text-2xl font-bold mt-4">{user?.fullName}</h2>
                        <p className="text-gray-600">{user?.email}</p>
                        {!user?.isEmailVerified && (
                            <p className="text-yellow-600 text-sm mt-2">
                                ⚠️ Email not verified. Check your inbox.
                            </p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Profile Information</h3>
                        {!editing && (
                            <button
                                onClick={() => setEditing(true)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                            >
                                Edit Profile
                            </button>
                        )}
                        <button
                            className='bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition'
                            onClick={() => navigate('/address-book')}
                        >
                            📍 My Addresses
                        </button>
                    </div>

                    {!editing ? (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-gray-600">Full Name</label>
                                <p className="text-gray-800">{user?.fullName}</p>
                            </div>
                            <div>
                                <label className="block text-gray-600">Email</label>
                                <p className="text-gray-800">{user?.email}</p>
                            </div>
                            <div>
                                <label className="block text-gray-600">Mobile</label>
                                <p className="text-gray-800">{user?.mobile || 'Not provided'}</p>
                            </div>
                            <div>
                                <label className="block text-gray-600">Role</label>
                                <p className="text-gray-800 capitalize">{user?.role}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-700 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">Mobile Number</label>
                                <input
                                    type="tel"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                                    placeholder="Enter 10-13 digit mobile number"
                                    className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={handleUpdateProfile}
                                    disabled={profileSaving}
                                    className="flex-1 bg-indigo-600 text-white p-3 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {profileSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    onClick={() => setEditing(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 p-3 rounded-md hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Two-Step Verification</h3>
                        <span className={`text-sm px-3 py-1 rounded-full ${user?.twoFactorEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                    </div>

                    <div className="space-y-4">
                        {user?.twoFactorEnabled ? (
                            <>
                                <p className="text-sm text-gray-600">
                                    ✅ Email code verification is active for {user?.email || 'your email'}.
                                </p>
                                <button
                                    onClick={handleDisableTwoFactor}
                                    disabled={twoFactorLoading}
                                    className="w-full bg-red-600 text-white p-3 rounded-md hover:bg-red-700 disabled:opacity-50"
                                >
                                    {twoFactorLoading ? 'Disabling...' : 'Disable Two-Step Verification'}
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-gray-600 mb-4">
                                    📧 A verification code will be sent to your email <strong>{user?.email}</strong>
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button
                                        onClick={handleRequestTwoFactorCode}
                                        disabled={twoFactorLoading}
                                        className="bg-indigo-600 text-white p-3 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {twoFactorLoading ? 'Sending...' : 'Send Code'}
                                    </button>

                                    <button
                                        onClick={handleResendTwoFactorCode}
                                        disabled={twoFactorLoading || twoFactorChallenge.resendSecondsLeft > 0}
                                        className="bg-gray-800 text-white p-3 rounded-md hover:bg-gray-900 disabled:opacity-50"
                                    >
                                        {twoFactorChallenge.resendSecondsLeft > 0
                                            ? `Resend in ${formatSeconds(twoFactorChallenge.resendSecondsLeft)}`
                                            : 'Resend Code'}
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-gray-700 mb-2">Enter 6-digit Code from Email</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={twoFactorForm.otp}
                                        onChange={(e) => setTwoFactorForm({ ...twoFactorForm, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                        placeholder="______"
                                        className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 tracking-[0.3em] text-center text-lg"
                                    />
                                </div>

                                {twoFactorChallenge.expiresAt && (
                                    <p className="text-sm text-gray-500">
                                        Code expires at {new Date(twoFactorChallenge.expiresAt).toLocaleTimeString()}
                                    </p>
                                )}

                                <button
                                    onClick={handleVerifyTwoFactorCode}
                                    disabled={twoFactorLoading}
                                    className="w-full bg-green-600 text-white p-3 rounded-md hover:bg-green-700 disabled:opacity-50"
                                >
                                    {twoFactorLoading ? 'Verifying...' : 'Verify and Enable'}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {!user?.googleId && (
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <h3 className="text-xl font-bold mb-4">Change Password</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-700 mb-2">Current Password</label>
                                <input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <button
                                onClick={handleChangePassword}
                                disabled={passwordSaving}
                                className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {passwordSaving ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h3 className="text-xl font-bold mb-4">Download & Account</h3>
                    <div className="space-y-4">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={downloadingPdf}
                            className="w-full bg-green-600 text-white p-3 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            📄 {downloadingPdf ? 'Downloading...' : 'Download Profile as PDF'}
                        </button>
                        <p className="text-sm text-gray-600">
                            Download your profile information and addresses as a PDF file
                        </p>
                    </div>
                </div>

                <div className="bg-red-50 rounded-lg shadow-lg p-6 border-2 border-red-200">
                    <h3 className="text-xl font-bold mb-2 text-red-700">Danger Zone</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        ⚠️ Permanently delete your account. This action cannot be undone. All your data and addresses will be removed.
                    </p>
                    <button
                        onClick={() => setDeleteModalOpen(true)}
                        className="w-full bg-red-600 text-white p-3 rounded-md hover:bg-red-700"
                    >
                        🗑️ Delete Account
                    </button>
                </div>

                {deleteModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                            <h2 className="text-2xl font-bold text-red-600 mb-4">Delete Account?</h2>
                            <div className="space-y-4">
                                <div className="bg-red-50 border-l-4 border-red-600 p-4">
                                    <p className="text-red-700 text-sm">
                                        <strong>WARNING:</strong> This is permanent! Your account and all associated data (addresses, preferences) will be permanently deleted. This action cannot be undone.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-gray-700 mb-2">
                                        Enter your password to confirm deletion
                                    </label>
                                    <input
                                        type="password"
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        placeholder="Your password"
                                        className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                        disabled={deleting}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => {
                                            setDeleteModalOpen(false);
                                            setDeletePassword('');
                                        }}
                                        disabled={deleting}
                                        className="bg-gray-300 text-gray-700 p-3 rounded-md hover:bg-gray-400 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={deleting || !deletePassword.trim()}
                                        className="bg-red-600 text-white p-3 rounded-md hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {deleting ? 'Deleting...' : 'Yes, Delete'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
