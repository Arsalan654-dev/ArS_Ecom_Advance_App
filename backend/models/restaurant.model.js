// models/restaurant.model.js

import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    businessName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ""
    },
    cuisines: [{
        type: String,
        trim: true
    }],
    phone: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    mainAddress: {
        fullAddress: String,
        landmark: String,
        city: String,
        state: String,
        pincode: String,
        latitude: Number,
        longitude: Number,
        placeId: String
    },
    bannerImages: [{
        url: String,
        publicId: String
    }],
    logoImage: {
        url: String,
        publicId: String
        
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "suspended"],
        default: "pending"
    },
    isEnabled: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

restaurantSchema.index({ owner: 1 });
restaurantSchema.index({ status: 1 });

async function cascadeDeleteRestaurantData(restaurantId) {
    try {
        const FoodItem = mongoose.model('FoodItem');
        const FoodCategory = mongoose.model('FoodCategory');
        const PromoCode = mongoose.model('PromoCode');
        const Order = mongoose.model('Order');

        await FoodItem.deleteMany({ restaurant: restaurantId });
        await FoodCategory.deleteMany({ restaurant: restaurantId });
        await PromoCode.deleteMany({ restaurant: restaurantId });
        await Order.deleteMany({ restaurant: restaurantId });

        console.log(`✅ Cascade deleted data for restaurant ${restaurantId}`);
    } catch (err) {
        console.error(`❌ Cascade delete failed for restaurant ${restaurantId}:`, err);
        throw err;
    }
}

restaurantSchema.pre('deleteOne', { document: true, query: false }, async function () {
    await cascadeDeleteRestaurantData(this._id);
});

restaurantSchema.pre('deleteOne', { document: false, query: true }, async function () {
    const doc = await this.model.findOne(this.getFilter()).select('_id');
    if (doc) await cascadeDeleteRestaurantData(doc._id);
});

restaurantSchema.pre('findOneAndDelete', async function () {
    const doc = await this.model.findOne(this.getFilter()).select('_id');
    if (doc) await cascadeDeleteRestaurantData(doc._id);
});

const Restaurant = mongoose.model("Restaurant", restaurantSchema);
export default Restaurant;
