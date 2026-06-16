// frontend/src/components/DeliveryBoyLocationUpdater.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_URL from '../config/api';
import { toast } from 'react-toastify';
import { MdMyLocation, MdLocationSearching } from 'react-icons/md';

const DeliveryBoyLocationUpdater = ({ orderId, onLocationUpdate }) => {
    const [isTracking, setIsTracking] = useState(false);
    const [lastLocation, setLastLocation] = useState(null);
    const [accuracy, setAccuracy] = useState(null);
    const watchIdRef = useRef(null);

    useEffect(() => {
        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    const startTracking = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsTracking(true);
        
        watchIdRef.current = navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude, longitude, accuracy, speed } = position.coords;
                setLastLocation({ latitude, longitude });
                setAccuracy(accuracy);
                
                // Send location to server
                try {
                    const token = localStorage.getItem('token');
                    await axios.post(`${API_URL}/api/location/update`, {
                        orderId,
                        latitude,
                        longitude,
                        accuracy,
                        speed: speed || 0
                    }, {
                        headers: { Authorization: `Bearer ${token}` },
                        withCredentials: true,
                    });
                    
                    onLocationUpdate?.({ latitude, longitude });
                } catch (error) {
                    console.error("Failed to update location:", error);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                toast.error("Failed to get location. Please enable GPS.");
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
        
        toast.success("Location tracking started");
    };

    const stopTracking = () => {
        if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsTracking(false);
        toast.info("Location tracking stopped");
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Live Location Tracking</h3>
                    {lastLocation && (
                        <p className="text-xs text-gray-500 mt-1">
                            Last location: {lastLocation.latitude.toFixed(6)}, {lastLocation.longitude.toFixed(6)}
                            {accuracy && ` (Accuracy: ±${Math.round(accuracy)}m)`}
                        </p>
                    )}
                </div>
                <button
                    onClick={isTracking ? stopTracking : startTracking}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                        isTracking 
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-violet-600 hover:bg-violet-700 text-white'
                    }`}
                >
                    {isTracking ? (
                        <>
                            <MdLocationSearching size={18} />
                            Stop Tracking
                        </>
                    ) : (
                        <>
                            <MdMyLocation size={18} />
                            Start Tracking
                        </>
                    )}
                </button>
            </div>
            {isTracking && (
                <div className="mt-3 text-xs text-green-600 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                    Live location is being shared with customer
                </div>
            )}
        </div>
    );
};

export default DeliveryBoyLocationUpdater;