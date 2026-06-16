// frontend/src/pages/delivery/DeliveryTracking.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DeliveryBoyLocationUpdater from '../../components/DeliveryBoyLocationUpdater';
import axios from 'axios';
import API_URL from '../../config/api';
import { MdArrowBack } from 'react-icons/md';

const DeliveryTracking = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);

    useEffect(() => {
        fetchOrder();
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/delivery/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            setOrder(res.data.order);
        } catch (error) {
            console.error("Failed to fetch order:", error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/delivery/assigned-orders')}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                    <MdArrowBack size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Live Location Tracking</h1>
                    <p className="text-gray-500">Share your live location with customer</p>
                </div>
            </div>
            
            <DeliveryBoyLocationUpdater orderId={orderId} />
            
            {order && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                    <h3 className="font-semibold mb-2">Delivery Address</h3>
                    <p>{order.deliveryAddress?.fullAddress}</p>
                    <p className="text-sm text-gray-500 mt-1">
                        {order.deliveryAddress?.city}, {order.deliveryAddress?.state}
                    </p>
                </div>
            )}
        </div>
    );
};

export default DeliveryTracking;