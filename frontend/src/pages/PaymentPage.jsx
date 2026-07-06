import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import { MdArrowBack, MdLock, MdStore, MdCreditCard, MdReceipt } from 'react-icons/md';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const PaymentForm = ({ orderId, amount, onSuccess, onError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) {
            toast.error("Payment system not ready");
            return;
        }
        setLoading(true);
        try {
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/order-tracking/${orderId}`,
                },
                redirect: 'if_required',
            });
            if (error) {
                toast.error(error.message);
                onError?.(error.message);
            } else if (paymentIntent.status === 'succeeded') {
                toast.success('Payment successful!');
                try {
                    const token = localStorage.getItem('token');
                    await axios.post(`${API_URL}/api/payment/confirm-payment`,
                        { paymentIntentId: paymentIntent.id, orderId },
                        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
                    );
                } catch (confirmErr) {
                    console.error("Confirm error:", confirmErr);
                }
                setTimeout(() => onSuccess(), 1000);
            }
        } catch (err) {
            toast.error("Payment failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="p-5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/50">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                    <MdCreditCard className="text-violet-500" size={20} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Card Details</span>
                </div>
                <PaymentElement />
            </div>
            <button
                type="submit"
                disabled={!stripe || loading}
                className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-200 dark:shadow-violet-900/30 flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing...
                    </>
                ) : (
                    <>
                        <MdLock size={18} />
                        Pay ₨ {amount?.toLocaleString()}
                    </>
                )}
            </button>
        </form>
    );
};

const PaymentPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { clearCart, fetchCart } = useCart();
    const [clientSecret, setClientSecret] = useState(null);
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error("Please login to make payment");
            navigate('/signin');
            return;
        }
        fetchOrderAndPaymentIntent();
    }, [orderId]);

    const fetchOrderAndPaymentIntent = async () => {
        try {
            const token = localStorage.getItem('token');
            const orderRes = await axios.get(`${API_URL}/api/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            setOrder(orderRes.data.order);
            const paymentRes = await axios.post(`${API_URL}/api/payment/create-payment-intent`,
                { orderId },
                { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
            );
            setClientSecret(paymentRes.data.clientSecret);
        } catch (error) {
            console.error("Failed to load payment:", error);
            setError(error.response?.data?.error || "Failed to initialize payment");
            toast.error("Failed to initialize payment");
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = async () => {
        try {
            await clearCart();
            await fetchCart();
            toast.success("Payment confirmed! Order placed successfully.");
        } catch (err) {
            console.error("Error clearing cart:", err);
        }
        navigate(`/order-tracking/${orderId}`);
    };

    const handleError = (errorMsg) => {
        console.error("Payment error:", errorMsg);
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-violet-100 dark:border-violet-900"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-600 animate-spin"></div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Preparing Payment Gateway</h3>
                    <p className="text-sm text-gray-500 mt-1">Please wait a moment...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-800/40 flex items-center justify-center mx-auto mb-4">
                        <MdLock size={28} className="text-red-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Payment Error</h3>
                    <p className="text-sm text-red-600 dark:text-red-300 mb-6">{error}</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button onClick={() => navigate('/checkout')} className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 transition font-medium text-sm">
                            Back to Checkout
                        </button>
                        <button onClick={() => { setError(null); setLoading(true); fetchOrderAndPaymentIntent(); }} className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition font-medium text-sm">
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!clientSecret) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">Unable to initialize payment</p>
                    <button onClick={() => navigate('/checkout')} className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium text-sm">
                        Back to Checkout
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[60vh] flex items-start justify-center py-8 px-4">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6 transition text-sm">
                    <MdArrowBack size={18} /> Back
                </button>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {/* Left - Payment Form */}
                    <div className="md:col-span-3">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 md:p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                                    <MdCreditCard className="text-white" size={20} />
                                </div>
                                <div>
                                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Complete Payment</h1>
                                    <p className="text-sm text-gray-500">Enter your card details to proceed</p>
                                </div>
                            </div>

                            <div className="mt-8">
                                <Elements stripe={stripePromise} options={{ clientSecret }}>
                                    <PaymentForm
                                        orderId={orderId}
                                        amount={order?.totalAmount}
                                        onSuccess={handleSuccess}
                                        onError={handleError}
                                    />
                                </Elements>
                            </div>

                            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                                <MdLock size={14} />
                                <span>Secured by Stripe. Your data is encrypted.</span>
                            </div>
                        </div>
                    </div>

                    {/* Right - Order Summary */}
                    <div className="md:col-span-2">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm sticky top-24">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <MdReceipt size={18} className="text-violet-500" />
                                Order Summary
                            </h3>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Order ID</span>
                                    <span className="font-mono text-gray-900 dark:text-gray-200 font-medium">#{orderId?.slice(-8)}</span>
                                </div>

                                {order?.restaurant?.businessName && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Restaurant</span>
                                        <span className="text-gray-900 dark:text-gray-200 font-medium flex items-center gap-1">
                                            <MdStore size={14} className="text-violet-500" /> {order.restaurant.businessName}
                                        </span>
                                    </div>
                                )}

                                <div className="border-t border-gray-100 dark:border-gray-800 my-2"></div>

                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 text-sm">Subtotal</span>
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">₨ {order?.totalAmount?.toLocaleString()}</span>
                                </div>

                                {order?.discountApplied > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-green-600">Discount</span>
                                        <span className="text-green-600">-₨ {order.discountApplied.toLocaleString()}</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 text-sm">Delivery Fee</span>
                                    <span className="text-green-600 font-medium">FREE</span>
                                </div>

                                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                                    <span className="text-xl font-bold text-violet-600">₨ {order?.totalAmount?.toLocaleString()}</span>
                                </div>
                            </div>

                            {order?.foodItems?.length > 0 && (
                                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Items ({order.foodItems.length})</p>
                                    <div className="space-y-1.5 max-h-24 overflow-y-auto">
                                        {order.foodItems.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                                                <span className="truncate">{item.quantity}x {item.foodItem?.name || 'Item'}</span>
                                                <span>₨ {(item.price * item.quantity).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
