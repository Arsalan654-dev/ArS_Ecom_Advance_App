import React, { useState, useEffect, useRef } from "react";
import { MapContainer as OriginalMapContainer, TileLayer as OriginalTileLayer, Marker as OriginalMarker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { toast } from "react-toastify";
import axios from "axios";
import { MdMyLocation } from "react-icons/md";

const MapContainer = OriginalMapContainer;
const TileLayer = OriginalTileLayer;
const Marker = OriginalMarker;

// Config default pins
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function LocationMarker({ position, setPosition, onLocationSelect }) {
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
          const marker = e.target;
          const { lat, lng } = marker.getLatLng();
          setPosition({ lat, lng });
          onLocationSelect({ lat, lng });
        },
      }}
    />
  );
}

export const FreeMapPicker = ({
  onLocationSelect,
  initialLat = 24.8607,
  initialLng = 67.0011,
  initialAddress = "",
  height = "300px",
}) => {
  const [position, setPosition] = useState({ lat: initialLat, lng: initialLng });
  const [address, setAddress] = useState(initialAddress || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapRef, setMapRef] = useState(null);
  const searchTimeoutRef = useRef(null);

  const getAddressFromCoords = async (lat, lng) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`
      );

      if (response.data) {
        const data = response.data;
        const formattedAddress = data.display_name;
        const addressDetails = data.address;

        setAddress(formattedAddress);

        let pincode = addressDetails?.postcode || "";
        if (pincode && pincode.length === 5) {
          pincode = "0" + pincode; // enforce 6 digits logic
        }

        const addressComponents = {
          city:
            addressDetails?.city ||
            addressDetails?.town ||
            addressDetails?.village ||
            addressDetails?.state_district ||
            "",
          state: addressDetails?.state || "",
          pincode: pincode,
          country: addressDetails?.country || "Pakistan",
        };

        onLocationSelect({
          lat,
          lng,
          address: formattedAddress,
          addressComponents,
          placeId: data.place_id,
        });
      }
    } catch (error) {
      console.error("Osm reverse error:", error);
      onLocationSelect({
        lat,
        lng,
        address: `Latitude: ${lat.toFixed(4)}, Longitude: ${lng.toFixed(4)}`,
        addressComponents: {
          city: "Karachi",
          state: "Sindh",
          pincode: "",
          country: "Pakistan",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const searchLocation = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}, Pakistan&limit=5&addressdetails=1`
      );

      if (response.data && response.data.length > 0) {
        setSearchResults(response.data);
      } else {
        const fallback = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
        );
        setSearchResults(fallback.data || []);
      }
    } catch (error) {
      console.error("OSM nominatim search failed:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery && searchQuery.length > 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchLocation(searchQuery);
      }, 700);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    setPosition({ lat, lng });
    setAddress(result.display_name);
    setSearchResults([]);
    setSearchQuery("");

    if (mapRef) {
      mapRef.flyTo([lat, lng], 15);
    }

    let pincode = result.address?.postcode || "";
    if (pincode && pincode.length === 5) {
      pincode = "0" + pincode;
    }

    const addressComponents = {
      city: result.address?.city || result.address?.town || result.address?.village || "",
      state: result.address?.state || "",
      pincode,
      country: result.address?.country || "Pakistan",
    };

    onLocationSelect({
      lat,
      lng,
      address: result.display_name,
      addressComponents,
      placeId: result.place_id,
    });
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition({ lat: latitude, lng: longitude });
        if (mapRef) {
          mapRef.flyTo([latitude, longitude], 15);
        }
        getAddressFromCoords(latitude, longitude);
        toast.success("Geocoded your current location!");
      },
      (error) => {
        setLoading(false);
        console.error("Geolocation error:", error);
        toast.error("Could not obtain location. Please ensure you have granted GPS permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Run on mount
  useEffect(() => {
    getAddressFromCoords(position.lat, position.lng);
  }, []);

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Type to search area / city (DHA, Karachi, etc)..."
          className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 pr-10"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-violet-600 border-t-transparent"></div>
          </div>
        )}

        {/* Dropdown Suggestions list */}
        {searchResults.length > 0 && (
          <div className="absolute z-40 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
            {searchResults.map((res) => (
              <button
                type="button"
                key={res.place_id}
                onClick={() => handleSelectSearchResult(res)}
                className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition text-xs text-gray-800 dark:text-gray-200 cursor-pointer"
              >
                {res.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Content Holder */}
      <div style={{ height }} className="rounded-xl overflow-hidden shadow border border-gray-200 dark:border-gray-800 relative z-0">
        <MapContainer
          center={[initialLat, initialLng]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          ref={setMapRef}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker
            position={position}
            setPosition={(pos) => {
              setPosition(pos);
              getAddressFromCoords(pos.lat, pos.lng);
            }}
            onLocationSelect={(coords) => {
              getAddressFromCoords(coords.lat, coords.lng);
            }}
          />
        </MapContainer>
      </div>

      {/* Get Current Location Button */}
      <button
        type="button"
        onClick={handleGetCurrentLocation}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition shadow-sm cursor-pointer border border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500"
      >
        <MdMyLocation size={14} /> Get Current Location
      </button>

      {address && !loading && (
        <div className="bg-gray-100 dark:bg-gray-800/60 p-3 rounded-lg text-xs leading-relaxed text-gray-700 dark:text-gray-300">
          <span className="font-semibold text-gray-900 dark:text-gray-100 block mb-1">📍 Selected Address components:</span>
          {address}
        </div>
      )}
    </div>
  );
};

export default FreeMapPicker;
