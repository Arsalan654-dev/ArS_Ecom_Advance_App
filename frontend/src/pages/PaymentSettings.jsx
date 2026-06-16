// frontend/src/pages/PaymentSettings.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config/api';
import { toast } from 'react-toastify';
import StripeOnboarding from '../components/StripeOnboarding';
import {
    MdAccountBalance,
    MdAttachMoney,
    MdHistory,
    MdLink,
    MdLinkOff,
    MdPayment,
    MdRefresh,
    MdTrendingUp,
    MdWarning,
} from 'react-icons/md';

const PaymentSettings = () => {
    const [accountStatus, setAccountStatus] = useState(null);
    const [balance, setBalance] = useState(null);
    const [payoutHistory, setPayoutHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payoutAmount, setPayoutAmount] = useState('');
    const [requesting, setRequesting] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [showOnboarding, setShowOnboarding] = useState(false);
    
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    const userRole = user?.role || 'user';
    
    useEffect(() => {
        fetchData();
    }, []);
    
    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const [statusRes, balanceRes, historyRes] = await Promise.all([
                axios.get(`${API_URL}/api/connect/account-status`, {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                }),
                axios.get(`${API_URL}/api/connect/balance`, {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                }),
                axios.get(`${API_URL}/api/connect/payout-history`, {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                })
            ]);
            
            setAccountStatus(statusRes.data);
            setBalance(balanceRes.data);
            setPayoutHistory(historyRes.data.history || []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast.error("Failed to load payment settings");
        } finally {
            setLoading(false);
        }
    };
    
    const refreshData = () => {
        fetchData();
        toast.info("Refreshing payment data...");
    };
    
    const disconnectStripe = async () => {
        if (!window.confirm("Are you sure you want to disconnect your Stripe account? This will stop future payouts.")) return;
        
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/connect/disconnect`, {}, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            toast.success("Stripe account disconnected");
            setAccountStatus({ hasAccount: false });
            setShowOnboarding(true);
        } catch (error) {
            toast.error("Failed to disconnect account");
        }
    };
    
    const requestPayout = async () => {
        const amount = parseFloat(payoutAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }
        
        const maxAmount = balance?.pendingBalance || 0;
        if (amount > maxAmount) {
            toast.error(`Maximum payout amount is ₨ ${maxAmount.toLocaleString()}`);
            return;
        }
        
        if (amount < 500) {
            toast.error("Minimum payout amount is ₨ 500");
            return;
        }
        
        setRequesting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/connect/request-payout`, 
                { amount },
                { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
            );
            toast.success(`Payout request of ₨ ${amount.toLocaleString()} submitted successfully!`);
            setPayoutAmount('');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to request payout");
        } finally {
            setRequesting(false);
        }
    };
    
    if (showOnboarding) {
        return <StripeOnboarding userRole={userRole} onComplete={() => {
            setShowOnboarding(false);
            fetchData();
        }} />;
    }
    
    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-8 w-40 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
            </div>
        );
    }
    
    // Only show for owners and delivery boys
    if (userRole !== 'owner' && userRole !== 'deliveryBoy') {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Payment settings are only available for restaurant owners and delivery partners.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Payment Settings
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        {userRole === 'owner' 
                            ? "Manage your restaurant earnings and payout methods"
                            : "Manage your delivery earnings and payout methods"}
                    </p>
                </div>
                <button
                    onClick={refreshData}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    title="Refresh"
                >
                    <MdRefresh size={20} />
                </button>
            </div>
            
            {/* Stripe Connect Status Banner */}
            {!accountStatus?.hasAccount && (
                <div className="bg-gradient-to-r from-violet-500 to-violet-600 rounded-xl p-6 text-white">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-bold mb-2">Get Paid Faster</h2>
                            <p className="text-violet-100 mb-4">
                                Connect your Stripe account to receive payments directly to your bank account.
                            </p>
                            <button
                                onClick={() => setShowOnboarding(true)}
                                className="px-4 py-2 bg-white text-violet-600 rounded-lg font-semibold hover:bg-gray-100 transition"
                            >
                                Connect Stripe Account
                            </button>
                        </div>
                        <MdPayment size={48} className="text-violet-200" />
                    </div>
                </div>
            )}
            
            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 text-sm font-medium transition ${
                        activeTab === 'overview'
                            ? 'text-violet-600 border-b-2 border-violet-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 text-sm font-medium transition ${
                        activeTab === 'history'
                            ? 'text-violet-600 border-b-2 border-violet-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Payout History
                </button>
                {accountStatus?.hasAccount && (
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 text-sm font-medium transition ${
                            activeTab === 'settings'
                                ? 'text-violet-600 border-b-2 border-violet-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Account Settings
                    </button>
                )}
            </div>
            
            {activeTab === 'overview' && (
                <>
                    {/* Earnings Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-gray-400">Total Earnings</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        ₨ {balance?.totalEarnings?.toLocaleString() || 0}
                                    </p>
                                </div>
                                <MdAttachMoney size={32} className="text-green-500" />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-gray-400">Available Balance</p>
                                    <p className="text-2xl font-bold text-violet-600">
                                        ₨ {balance?.pendingBalance?.toLocaleString() || 0}
                                    </p>
                                </div>
                                <MdAccountBalance size={32} className="text-violet-500" />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-gray-400">Total Deliveries</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {balance?.totalDeliveries || 0}
                                    </p>
                                </div>
                                <MdTrendingUp size={32} className="text-blue-500" />
                            </div>
                        </div>
                    </div>
                    
                    {/* Payout Request Section */}
                    {accountStatus?.hasAccount && accountStatus?.payoutsEnabled && balance?.pendingBalance > 0 && (
                        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Request Payout
                            </h2>
                            <div className="flex gap-3">
                                <input
                                    type="number"
                                    placeholder="Enter amount (PKR)"
                                    value={payoutAmount}
                                    onChange={(e) => setPayoutAmount(e.target.value)}
                                    className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                                />
                                <button
                                    onClick={requestPayout}
                                    disabled={requesting}
                                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                                >
                                    {requesting ? "Processing..." : "Request Payout"}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Minimum payout: ₨ 500 | Maximum: {balance?.pendingBalance?.toLocaleString()}
                            </p>
                        </div>
                    )}
                    
                    {/* Account Status */}
                    {accountStatus?.hasAccount && (
                        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Account Status
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Stripe Connect</span>
                                    <span className={`flex items-center gap-2 ${
                                        accountStatus.isEnabled ? 'text-green-600' : 'text-yellow-600'
                                    }`}>
                                        {accountStatus.isEnabled ? (
                                            <><MdCheckCircle /> Active</>
                                        ) : (
                                            <><MdWarning /> Pending Verification</>
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Payouts Enabled</span>
                                    <span className={accountStatus.payoutsEnabled ? 'text-green-600' : 'text-red-600'}>
                                        {accountStatus.payoutsEnabled ? 'Yes' : 'No'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Details Submitted</span>
                                    <span className={accountStatus.detailsSubmitted ? 'text-green-600' : 'text-yellow-600'}>
                                        {accountStatus.detailsSubmitted ? 'Complete' : 'Incomplete'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
            
            {activeTab === 'history' && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <MdHistory size={20} /> Payout History
                        </h2>
                    </div>
                    {payoutHistory.length === 0 ? (
                        <div className="px-6 py-12 text-center text-gray-500">
                            No payout requests yet
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Reference</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {payoutHistory.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-6 py-4 text-sm">
                                                {new Date(item.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-green-600">
                                                ₨ {item.amount?.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    item.status === 'paid' 
                                                        ? 'bg-green-100 text-green-700'
                                                        : item.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono text-gray-500">
                                                {item.stripePayoutId?.slice(-8) || 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
            
            {activeTab === 'settings' && accountStatus?.hasAccount && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Account Management
                        </h2>
                        <button
                            onClick={disconnectStripe}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                        >
                            <MdLinkOff size={18} />
                            Disconnect Stripe Account
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                            Disconnecting will stop future payouts. You can reconnect anytime.
                        </p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Support
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Having issues with your payments? Contact our support team.
                        </p>
                        <button
                            onClick={() => window.location.href = "mailto:support@vingo.com"}
                            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg"
                        >
                            Contact Support
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentSettings;