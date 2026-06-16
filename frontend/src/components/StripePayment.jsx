// frontend/src/components/StripePayment.jsx
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
    EmbeddedCheckoutProvider,
    EmbeddedCheckout
} from '@stripe/react-stripe-js';
import axios from 'axios';
import API_URL from '../config/api';

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Checkout form component
const CheckoutForm = ({ orderId, onSuccess, onError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (!stripe || !elements) return;
        
        setLoading(true);
        
        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/payment-success`,
            },
            redirect: 'if_required',
        });
        
        if (error) {
            console.error("Payment error:", error);
            onError(error.message);
        } else if (paymentIntent.status === 'succeeded') {
            onSuccess(paymentIntent);
        }
        
        setLoading(false);
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            <button
                type="submit"
                disabled={!stripe || loading}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg disabled:opacity-50"
            >
                {loading ? "Processing..." : "Pay Now"}
            </button>
        </form>
    );
};

// Main payment component
export const StripePayment = ({ orderId, amount, onSuccess, onError }) => {
    const [clientSecret, setClientSecret] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const createPaymentIntent = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.post(
                    `${API_URL}/api/payment/create-payment-intent`,
                    { orderId },
                    { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
                );
                setClientSecret(res.data.clientSecret);
            } catch (error) {
                console.error("Failed to create payment intent:", error);
                onError?.(error.response?.data?.error || "Payment setup failed");
            } finally {
                setLoading(false);
            }
        };
        
        if (orderId) {
            createPaymentIntent();
        }
    }, [orderId]);
    
    if (loading) {
        return <div className="text-center py-4">Loading payment gateway...</div>;
    }
    
    if (!clientSecret) {
        return <div className="text-center py-4 text-red-500">Failed to initialize payment</div>;
    }
    
    return (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm 
                orderId={orderId} 
                onSuccess={onSuccess} 
                onError={onError} 
            />
        </Elements>
    );
};