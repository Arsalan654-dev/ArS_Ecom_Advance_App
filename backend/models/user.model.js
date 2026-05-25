// D:\Vingo\backend\models\user.model.js

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        default: null
    },
    mobile: {
        type: String,
        default: undefined,
        index: { unique: true, sparse: true }  // This ensures sparse
    },
    role: {
        type: String,
        enum: ["user", "owner", "deliveryBoy"],
        default: "user"
    },
    googleId: {
        type: String,
        default:undefined,
        index: { unique: true, sparse: true }
    },
    isGoogleVerified: {
        type: Boolean,
        default: false
    },
    avatar: {
        type: String,
        default: null
    },
    avatarPublicId: {
        type: String,
        default: null
    },
     addresses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address"
    }],
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String,
        default: null
    },
    emailVerificationExpires: {
        type: Date,
        default: null
    },
    resetOtp: {
        type: String,
        default: null
    },
    isOtpVerified: {
        type: Boolean,
        default: false
    },
    otpExpires: {
        type: Date,
        default: null
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorPhone: {
        type: String,
        default: null
    },
    twoFactorOtp: {
        type: String,
        default: null
    },
    twoFactorOtpExpires: {
        type: Date,
        default: null
    },
    twoFactorOtpPurpose: {
        type: String,
        enum: ['enable', 'login'],
        default: null
    },
    twoFactorOtpAttempts: {
        type: Number,
        default: 0
    },
    twoFactorLastSentAt: {
        type: Date,
        default: null
    },
}, {
    timestamps: true
});



const User = mongoose.model("User", userSchema);
export default User;
