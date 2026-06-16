// frontend/src/components/DeliveryBoyLocationTracker.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_URL from '../config/api';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { toast } from 'react-toastify';
import { MdLocationOn, MdAccessTime, MdPerson, MdPhone } from 'react-icons/md';

// Fix for default marker icons in leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom delivery boy icon
const deliveryIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1995/1995572.png',
    iconRetinaUrl: 'https://cdn-icons-png.flaticon.com/512/1995/1995572.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

// Customer location icon
const customerIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconRetinaUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

const DeliveryBoyLocationTracker = ({ orderId, deliveryAddress }) => {
    const [deliveryBoy, setDeliveryBoy] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [locationHistory, setLocationHistory] = useState([]);
    const [eta, setEta] = useState(null);
    const [remainingDistance, setRemainingDistance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const intervalRef = useRef(null);

    useEffect(() => {
        fetchLocation();
        startPolling();
        
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [orderId]);

    const fetchLocation = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/location/delivery/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            
            if (res.data.success) {
                setDeliveryBoy(res.data.deliveryBoy);
                setCurrentLocation(res.data.location);
                setLocationHistory(res.data.locationHistory || []);
                setEta(res.data.eta);
                setRemainingDistance(res.data.remainingDistance);
                setStatus(res.data.status);
            }
        } catch (error) {
            console.error("Failed to fetch location:", error);
        } finally {
            setLoading(false);
        }
    };

    const startPolling = () => {
        intervalRef.current = setInterval(() => {
            fetchLocation();
        }, 10000); // Update every 10 seconds
    };

    const getStatusText = () => {
        switch(status) {
            case 'assigned': return 'Delivery Boy Assigned';
            case 'picked_up': return 'Order Picked Up';
            case 'delivered': return 'Delivered';
            default: return 'On the Way';
        }
    };

    const getStatusColor = () => {
        switch(status) {
            case 'assigned': return 'bg-blue-500';
            case 'picked_up': return 'bg-orange-500';
            case 'delivered': return 'bg-green-500';
            default: return 'bg-purple-500';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
            </div>
        );
    }

    // Calculate center for map
    const center = currentLocation 
        ? [currentLocation.coordinates[1], currentLocation.coordinates[0]]
        : deliveryAddress 
        ? [deliveryAddress.latitude, deliveryAddress.longitude]
        : [24.8607, 67.0011];

    // Create route line from history
    const routePositions = locationHistory.map(loc => [loc.coordinates[1], loc.coordinates[0]]);
    
    // Add current location to route
    if (currentLocation) {
        routePositions.push([currentLocation.coordinates[1], currentLocation.coordinates[0]]);
    }

    return (
        <div className="space-y-4">
            {/* Delivery Boy Info Card */}
            {deliveryBoy && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                    <div className="flex items-center gap-4">
                        {deliveryBoy.avatar ? (
                            <img src={deliveryBoy.avatar} alt={deliveryBoy.name} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                <MdPerson size={24} className="text-violet-600" />
                            </div>
                        )}
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 dark:text-white">{deliveryBoy.name}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs text-white ${getStatusColor()}`}>
                                    {getStatusText()}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <MdPhone size={14} /> {deliveryBoy.phone}
                                </span>
                                {remainingDistance && (
                                    <span className="flex items-center gap-1">
                                        <MdLocationOn size={14} /> {remainingDistance.toFixed(1)} km away
                                    </span>
                                )}
                                {eta && (
                                    <span className="flex items-center gap-1">
                                        <MdAccessTime size={14} /> Est. {eta} min
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Map Container */}
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800" style={{ height: '500px' }}>
                <MapContainer
                    center={center}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* Delivery Boy Location Marker */}
                    {currentLocation && (
                        <Marker 
                            position={[currentLocation.coordinates[1], currentLocation.coordinates[0]]}
                            icon={deliveryIcon}
                        >
                            <Popup>
                                Delivery Boy: {deliveryBoy?.name}<br />
                                Last update: {new Date(currentLocation.lastUpdate).toLocaleTimeString()}
                            </Popup>
                        </Marker>
                    )}
                    
                    {/* Customer Location Marker */}
                    {deliveryAddress && deliveryAddress.latitude && deliveryAddress.longitude && (
                        <Marker 
                            position={[deliveryAddress.latitude, deliveryAddress.longitude]}
                            icon={customerIcon}
                        >
                            <Popup>
                                Your Delivery Address<br />
                                {deliveryAddress.fullAddress}
                            </Popup>
                        </Marker>
                    )}
                    
                    {/* Route Line */}
                    {routePositions.length > 1 && (
                        <Polyline 
                            positions={routePositions}
                            color="#8B5CF6"
                            weight={3}
                            opacity={0.7}
                        />
                    )}
                </MapContainer>
            </div>

            {/* Status Timeline */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Delivery Status</h3>
                <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                    <div className="space-y-6">
                        <div className="relative flex items-start gap-4">
                            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                                status !== 'assigned' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                            } text-white`}>
                                1
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">Order Assigned</p>
                                <p className="text-sm text-gray-500">Delivery boy assigned to your order</p>
                            </div>
                        </div>
                        
                        <div className="relative flex items-start gap-4">
                            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                                status === 'picked_up' || status === 'delivered' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                            } text-white`}>
                                2
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">Picked Up</p>
                                <p className="text-sm text-gray-500">Delivery boy picked up your order from restaurant</p>
                            </div>
                        </div>
                        
                        <div className="relative flex items-start gap-4">
                            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                                status === 'delivered' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                            } text-white`}>
                                3
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">Delivered</p>
                                <p className="text-sm text-gray-500">Order delivered to your address</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryBoyLocationTracker;