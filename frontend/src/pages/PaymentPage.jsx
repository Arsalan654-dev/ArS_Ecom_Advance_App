// frontend/src/pages/PaymentPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';

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
                console.error("Payment error:", error);
                toast.error(error.message);
                onError?.(error.message);
            } else if (paymentIntent.status === 'succeeded') {
                toast.success('Payment successful!');
                
                // Wait a moment for webhook to process
                setTimeout(() => {
                    onSuccess();
                }, 2000);
            }
        } catch (err) {
            console.error("Payment confirmation error:", err);
            toast.error("Payment failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <PaymentElement />
            </div>
            <button
                type="submit"
                disabled={!stripe || loading}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg disabled:opacity-50 transition"
            >
                {loading ? "Processing..." : `Pay ₨ ${amount}`}
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
        fetchOrderAndPaymentIntent();
    }, [orderId]);

    const fetchOrderAndPaymentIntent = async () => {
        try {
            const token = localStorage.getItem('token');
            
            // Fetch order details
            const orderRes = await axios.get(`${API_URL}/api/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            setOrder(orderRes.data.order);
            
            // Create payment intent
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
        // Clear cart after successful payment
        try {
            await clearCart();
            await fetchCart();
            toast.success("Cart cleared!");
        } catch (err) {
            console.error("Error clearing cart:", err);
        }
        
        // Navigate to order tracking
        navigate(`/order-tracking/${orderId}`);
    };

    const handleError = (errorMsg) => {
        console.error("Payment error:", errorMsg);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading payment gateway...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-md mx-auto py-12">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/checkout')}
                        className="px-4 py-2 bg-violet-600 text-white rounded-lg"
                    >
                        Back to Checkout
                    </button>
                </div>
            </div>
        );
    }

    if (!clientSecret) {
        return (
            <div className="max-w-md mx-auto py-12">
                <div className="text-center">
                    <p className="text-gray-500">Unable to initialize payment</p>
                    <button
                        onClick={() => navigate('/checkout')}
                        className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg"
                    >
                        Back to Checkout
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto py-12 px-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Complete Payment</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Enter your card details to complete the payment</p>
                
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Order #{orderId?.slice(-8)}</p>
                    <p className="text-2xl font-bold text-violet-600">Total: ₨ {order?.totalAmount?.toLocaleString()}</p>
                </div>
                
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <PaymentForm 
                        orderId={orderId} 
                        amount={order?.totalAmount} 
                        onSuccess={handleSuccess}
                        onError={handleError}
                    />
                </Elements>
                
                <p className="text-xs text-gray-400 text-center mt-4">
                    Your payment is secure. We don't store your card details.
                </p>
            </div>
        </div>
    );
};

export default PaymentPage;