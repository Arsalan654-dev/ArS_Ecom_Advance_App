// backend/models/order.model.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    foodItems: [{
        foodItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FoodItem",
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        }
    }],
    delivery: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Delivery",
        default: null
    },
    deliveryAddress: {
        fullAddress: String,
        landmark: String,
        city: String,
        state: String,
        pincode: String,
        latitude: Number,
        longitude: Number,
        phoneNumber: String,
        receiverName: String
    },
    promoCode: {
        type: String,
        default: null
    },
    discountApplied: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ["online", "cash"],
        default: "cash"
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending"
    },
    paymentIntentId: {
        type: String,
        default: null
    },
    // ✅ FIX: Add payment_pending to status enum
    status: {
        type: String,
        enum: ["payment_pending", "pending", "preparing", "ready", "out-for-delivery", "delivered", "cancelled"],
        default: "pending"
    },
    statusUpdatedAt: {
        type: Date,
        default: Date.now
    },
    ratedByCustomer: {
        type: Boolean,
        default: false
    },
    ratings: {
        type: Number,
        min: 1,
        max: 5,
        default: null
    },
    review: {
        type: String,
        default: null
    },
    restaurantEarnings: {
        type: Number,
        default: 0
    },
    deliveryEarnings: {
        type: Number,
        default: 0
    },
    platformFee: {
        type: Number,
        default: 0
    },
    paidAt: {
        type: Date,
        default: null
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

// Indexes
orderSchema.index({ restaurant: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ delivery: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ paymentIntentId: 1 });

// Cascade delete delivery
async function cascadeDeleteDelivery(orderId) {
    try {
        const Delivery = mongoose.model('Delivery');
        await Delivery.deleteOne({ order: orderId });
        console.log(`✅ Cascade deleted delivery for order ${orderId}`);
    } catch (err) {
        console.error(`❌ Cascade delete failed for order ${orderId}:`, err);
        throw err;
    }
}

orderSchema.pre('deleteOne', { document: true, query: false }, async function () {
    await cascadeDeleteDelivery(this._id);
});

orderSchema.pre('deleteOne', { document: false, query: true }, async function () {
    const doc = await this.model.findOne(this.getFilter()).select('_id');
    if (doc) await cascadeDeleteDelivery(doc._id);
});

orderSchema.pre('findOneAndDelete', async function () {
    const doc = await this.model.findOne(this.getFilter()).select('_id');
    if (doc) await cascadeDeleteDelivery(doc._id);
});

const Order = mongoose.model("Order", orderSchema);
export default Order;