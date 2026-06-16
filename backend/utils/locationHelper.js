// backend/utils/locationHelper.js
import User from '../models/user.model.js';
import Delivery from '../models/delivery.model.js';

const EARTH_RADIUS_KM = 6371;



export const findNearestDeliveryBoy = async (latitude, longitude, radiusKm = 50) => {
    try {
        console.log(`🔍 Finding nearest delivery boy near: (${latitude}, ${longitude}) within ${radiusKm}km`);
        
        const radiusInMeters = radiusKm * 1000;
        
        const deliveryBoys = await User.find({
            role: 'deliveryBoy',
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude]  // [lng, lat]
                    },
                    $maxDistance: radiusInMeters
                }
            }
        }).select('_id fullName email mobile location');
        
        console.log(`📦 Found ${deliveryBoys.length} delivery boys`);
        
        // Log each delivery boy's distance
        for (const boy of deliveryBoys) {
            const distance = calculateDistance(
                latitude, longitude,
                boy.location.coordinates[1], boy.location.coordinates[0]
            );
            console.log(`   - ${boy.fullName}: ${distance.toFixed(2)}km away`);
        }
        
        return deliveryBoys;
        
    } catch (error) {
        console.error('Error finding nearest delivery boys:', error);
        throw error;
    }
};
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const deg2rad = (deg) => deg * (Math.PI / 180);
    
    const deltaLat = deg2rad(lat2 - lat1);
    const deltaLon = deg2rad(lon2 - lon1);
    
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = EARTH_RADIUS_KM * c;
    
    return distance;
};

export const assignDeliveryBoy = async (orderId, deliveryBoyId, restaurantId, estimatedTime = 30, distanceKm = 0) => {
    try {
        const delivery = await Delivery.create({
            order: orderId,
            deliveryBoy: deliveryBoyId,
            restaurant: restaurantId,
            estimatedTime: estimatedTime,
            distanceKm: distanceKm,  // ✅ Add this
            earnings: Math.round(distanceKm * 10), // 10 rupees per km
            assignedAt: new Date(),
            status: 'assigned'
        });
        
        console.log(`✅ Delivery assigned for order ${orderId} to delivery boy ${deliveryBoyId}`);
        console.log(`   Distance: ${distanceKm}km, Earnings: ₨ ${delivery.earnings}`);
        return delivery;
    } catch (error) {
        console.error('Error assigning delivery:', error);
        throw error;
    }
};
export const updateDeliveryBoyLocation = async (deliveryBoyId, latitude, longitude) => {
    try {
        await User.findByIdAndUpdate(
            deliveryBoyId,
            {
                location: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                }
            },
            { new: true }
        );
        
        console.log(`✅ Updated location for delivery boy ${deliveryBoyId}`);
    } catch (error) {
        console.error('❌ Error updating delivery boy location:', error);
        throw error;
    }
};