/* frontend/src/components/FreeMapPicker.jsx */

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { toast } from 'react-toastify';
import axios from 'axios';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition, onLocationSelect, map }) {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            setPosition({ lat, lng });
            onLocationSelect({ lat, lng });
        },
    });
    
    return position === null ? null : (
        <Marker 
            position={position} 
            draggable={true} 
            eventHandlers={{
                dragend(e) {
                    const { lat, lng } = e.target.getLatLng();
                    setPosition({ lat, lng });
                    onLocationSelect({ lat, lng });
                }
            }} 
        />
    );
}

const FreeMapPicker = ({ 
    onLocationSelect, 
    initialLat = 24.8607, 
    initialLng = 67.0011,
    initialAddress = null,
    height = "400px"
}) => {
    const [position, setPosition] = useState({ lat: initialLat, lng: initialLng });
    const [address, setAddress] = useState(initialAddress || "");
    const [searchQuery, setSearchQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mapRef, setMapRef] = useState(null);
    const searchTimeoutRef = useRef(null);

    // Get address from coordinates
    const getAddressFromCoords = async (lat, lng) => {
        setLoading(true);
        try {
            // Using better endpoint for Pakistan
            const response = await axios.get(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`
            );
            
            if (response.data) {
                const data = response.data;
                const formattedAddress = data.display_name;
                const addressDetails = data.address;
                
                setAddress(formattedAddress);
                
                // Handle Pakistan pincode (5 digits)
                let pincode = addressDetails?.postcode || "";
                // If pincode is 5 digits, pad with leading zero if needed
                if (pincode && pincode.length === 5) {
                    pincode = "0" + pincode; // Convert 5 digit to 6 digit for validation
                }
                
                const addressComponents = {
                    city: addressDetails?.city || addressDetails?.town || addressDetails?.village || addressDetails?.state_district || "",
                    state: addressDetails?.state || "",
                    pincode: pincode,
                    country: addressDetails?.country || "Pakistan"
                };
                
                onLocationSelect({
                    lat,
                    lng,
                    address: formattedAddress,
                    addressComponents,
                    placeId: data.place_id
                });
            }
        } catch (error) {
            console.error("Geocoding error:", error);
            // Fallback: try to get address without API on error
            onLocationSelect({
                lat,
                lng,
                address: `Lat: ${lat}, Lng: ${lng}`,
                addressComponents: {
                    city: "",
                    state: "",
                    pincode: "",
                    country: "Pakistan"
                }
            });
        } finally {
            setLoading(false);
        }
    };

    // Search location - FIXED VERSION
    const searchLocation = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        
        setSearching(true);
        try {
            // Better search for Pakistan locations
            const response = await axios.get(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}, Pakistan&limit=10&addressdetails=1`
            );
            
            console.log("Search results:", response.data);
            
            if (response.data && response.data.length > 0) {
                setSearchResults(response.data);
            } else {
                // Try without Pakistan filter
                const fallbackResponse = await axios.get(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1`
                );
                setSearchResults(fallbackResponse.data || []);
            }
        } catch (error) {
            console.error("Search error:", error);
            toast.error("Search failed. Please try again.");
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    // Debounced search
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        if (searchQuery && searchQuery.length > 2) { // Only search if more than 2 characters
            searchTimeoutRef.current = setTimeout(() => {
                searchLocation(searchQuery);
            }, 800);
        } else {
            setSearchResults([]);
        }
        
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery]);

    // Handle search result selection with map flyTo
    const handleSelectSearchResult = (result) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        setPosition({ lat, lng });
        setAddress(result.display_name);
        setSearchResults([]);
        setSearchQuery("");
        
        // Fly to location on map
        if (mapRef) {
            mapRef.flyTo([lat, lng], 16);
        }
        
        // Extract address components
        let pincode = result.address?.postcode || "";
        if (pincode && pincode.length === 5) {
            pincode = "0" + pincode;
        }
        
        const addressComponents = {
            city: result.address?.city || result.address?.town || result.address?.village || "",
            state: result.address?.state || "",
            pincode: pincode,
            country: result.address?.country || "Pakistan"
        };
        
        onLocationSelect({
            lat,
            lng,
            address: result.display_name,
            addressComponents,
            placeId: result.place_id
        });
    };

    // Get address when marker is moved
    useEffect(() => {
        if (position) {
            getAddressFromCoords(position.lat, position.lng);
        }
    }, [position]);

    // Get initial address on mount
    useEffect(() => {
        getAddressFromCoords(initialLat, initialLng);
    }, []);

    return (
        <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for city, area, landmark (e.g., Karachi, DHA, Gulshan)..."
                    className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                />
                {searching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                    </div>
                )}
                
                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-80 overflow-y-auto">
                        {searchResults.map((result) => (
                            <button
                                key={result.place_id}
                                onClick={() => handleSelectSearchResult(result)}
                                className="w-full text-left p-3 hover:bg-gray-100 border-b last:border-b-0 transition"
                            >
                                <p className="text-sm font-medium">{result.display_name}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {result.type} • {result.category}
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Map */}
            <div style={{ height }} className="rounded-lg overflow-hidden shadow-md z-0">
                <MapContainer
                    center={[initialLat, initialLng]}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                    className="z-0"
                    ref={setMapRef}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker 
                        position={position} 
                        setPosition={setPosition}
                        onLocationSelect={(coords) => {
                            getAddressFromCoords(coords.lat, coords.lng);
                        }}
                    />
                </MapContainer>
            </div>
            
            {/* Loading Indicator */}
            {loading && (
                <div className="relative">
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-600">Getting address...</p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Selected Address Display */}
            {address && !loading && (
                <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-600 font-medium">📍 Selected Location:</p>
                    <p className="text-sm text-gray-800 break-word">{address}</p>
                </div>
            )}
        </div>
    );
};

export default FreeMapPicker;