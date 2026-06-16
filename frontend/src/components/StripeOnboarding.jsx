// frontend/src/components/StripeOnboarding.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config/api';
import { toast } from 'react-toastify';
import {
    MdAccountBalance,
    MdAttachMoney,
    MdCheckCircle,
    MdError,
    MdLink,
    MdLinkOff,
    MdPayment,
    MdSchool,
    MdWarning,
} from 'react-icons/md';

const StripeOnboarding = ({ userRole, onComplete }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [accountStatus, setAccountStatus] = useState(null);
    const [formData, setFormData] = useState({
        businessName: '',
        businessType: 'individual',
        taxId: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        phone: '',
        dob: '',
        ssnLast4: '',
    });

    useEffect(() => {
        checkAccountStatus();
    }, []);

    const checkAccountStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/connect/account-status`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            setAccountStatus(res.data);
            
            if (res.data.hasAccount && res.data.detailsSubmitted) {
                setStep(4); // Completed
            } else if (res.data.hasAccount) {
                setStep(3); // Pending
            }
        } catch (error) {
            console.error("Failed to check account status:", error);
        }
    };

    const startOnboarding = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/connect/create-account`, {}, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            
            // Redirect to Stripe onboarding
            window.location.href = res.data.url;
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to start onboarding");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/connect/create-account`, formData, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            
            window.location.href = res.data.url;
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to create account");
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch(step) {
            case 1:
                return renderIntro();
            case 2:
                return renderForm();
            case 3:
                return renderPending();
            case 4:
                return renderComplete();
            default:
                return renderIntro();
        }
    };

    const renderIntro = () => (
        <div className="text-center">
            <div className="w-20 h-20 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <MdPayment size={40} className="text-violet-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {userRole === 'owner' ? 'Accept Payments for Your Restaurant' : 'Receive Your Delivery Earnings'}
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                {userRole === 'owner' 
                    ? "Connect your Stripe account to receive payments from customers directly to your bank account."
                    : "Connect your Stripe account to receive your delivery earnings directly to your bank account."}
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mb-6 text-left">
                <h3 className="font-semibold mb-3">What you'll need:</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                        <MdCheckCircle className="text-green-500" size={16} />
                        Government-issued ID (Driver's license or passport)
                    </li>
                    <li className="flex items-center gap-2">
                        <MdCheckCircle className="text-green-500" size={16} />
                        Bank account details for payouts
                    </li>
                    {userRole === 'owner' && (
                        <li className="flex items-center gap-2">
                            <MdCheckCircle className="text-green-500" size={16} />
                            Business registration (if applicable)
                        </li>
                    )}
                    <li className="flex items-center gap-2">
                        <MdCheckCircle className="text-green-500" size={16} />
                        Tax identification number
                    </li>
                </ul>
            </div>
            
            <div className="flex gap-3">
                <button
                    onClick={() => setStep(2)}
                    className="flex-1 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition"
                >
                    Get Started
                </button>
                <button
                    onClick={() => window.history.back()}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition"
                >
                    Cancel
                </button>
            </div>
        </div>
    );

    const renderForm = () => (
        <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Business Information
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                {userRole === 'owner' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Business Name
                        </label>
                        <input
                            type="text"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleInputChange}
                            required
                            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                        />
                    </div>
                )}
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Business Type
                    </label>
                    <select
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleInputChange}
                        className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                    >
                        <option value="individual">Individual / Sole Proprietor</option>
                        <option value="company">Company / Corporation</option>
                        <option value="non_profit">Non-Profit</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tax ID / CNIC Number
                    </label>
                    <input
                        type="text"
                        name="taxId"
                        value={formData.taxId}
                        onChange={handleInputChange}
                        placeholder="XXXXX-XXXXXXX-X"
                        required
                        className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Business Address
                    </label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            City
                        </label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            required
                            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            State
                        </label>
                        <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            required
                            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Postal Code
                    </label>
                    <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone Number
                    </label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                    />
                </div>
                
                <div className="flex gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                    >
                        {loading ? "Processing..." : "Continue to Stripe"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition"
                    >
                        Back
                    </button>
                </div>
            </form>
        </div>
    );

    const renderPending = () => (
        <div className="text-center">
            <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <MdWarning size={40} className="text-yellow-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Account Setup In Progress
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your Stripe account is being reviewed. Please complete the verification process to start receiving payments.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-6 text-left">
                <h3 className="font-semibold mb-2">Next Steps:</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>✓ Complete identity verification</li>
                    <li>✓ Add bank account for payouts</li>
                    <li>✓ Verify your email address</li>
                </ul>
            </div>
            
            <button
                onClick={startOnboarding}
                disabled={loading}
                className="w-full px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition"
            >
                {loading ? "Loading..." : "Complete Setup"}
            </button>
        </div>
    );

    const renderComplete = () => (
        <div className="text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <MdCheckCircle size={40} className="text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Account Verified!
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your Stripe account is ready. You can now receive payments directly to your bank account.
            </p>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className="text-green-600 font-semibold">Active</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Payout Schedule</span>
                    <span className="font-semibold">Daily ${(`if balance > ₨ 500`)}</span>
                </div>
            </div>
            
            {onComplete && (
                <button
                    onClick={onComplete}
                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
                >
                    Continue to Dashboard
                </button>
            )}
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto py-8">
            {/* Progress Steps */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                step >= s 
                                    ? 'bg-violet-600 text-white' 
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                            }`}>
                                {step > s ? <MdCheckCircle size={18} /> : s}
                            </div>
                            {s < 4 && (
                                <div className={`w-16 h-1 ${
                                    step > s ? 'bg-violet-600' : 'bg-gray-200 dark:bg-gray-700'
                                }`} />
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>Intro</span>
                    <span>Details</span>
                    <span>Verify</span>
                    <span>Complete</span>
                </div>
            </div>
            
            {renderStep()}
        </div>
    );
};

export default StripeOnboarding;