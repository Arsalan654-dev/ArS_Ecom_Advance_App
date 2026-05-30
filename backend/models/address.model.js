// backend\models\address.model.js

import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    label: {
        type: String,
        enum: ["Home", "Office", "Other"],
        default: "Home"
    },
    customLabel: {
        type: String,
        trim: true,
        default: null
    },
    fullAddress: {
        type: String,
        required: true,
        trim: true
    },
    landmark: {
        type: String,
        trim: true,
        default: ""
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
     pincode: {
        type: String,
        required: true,
        trim: true,
        match: [/^\d{5,6}$/, "Pincode must be 5 or 6 digits"]
    },
    country: {
        type: String,
        default: "Pakistan",
        trim: true
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    placeId: {
        type: String,
        default: null
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    phoneNumber: {
        type: String,
        trim: true,
        default: null
    },
    receiverName: {
        type: String,
        trim: true,
        default: null
    },
    instructions: {
        type: String,
        trim: true,
        default: ""
    }
}, {
    timestamps: true
});


// Add this after schema definition
addressSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    try {
        const User = mongoose.model('User');
        await User.updateMany(
            { addresses: this._id },
            { $pull: { addresses: this._id } }
        );
        next();
    } catch (error) {
        next(error);
    }
});


const Address = mongoose.model("Address", addressSchema);
export default Address;