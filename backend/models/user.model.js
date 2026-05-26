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

// Add pre-hook for cascade delete
userSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    try {
        // Delete all addresses associated with this user
        const Address = mongoose.model('Address');
        await Address.deleteMany({ user: this._id });
        console.log(`✅ Deleted all addresses for user: ${this._id}`);
        next();
    } catch (error) {
        console.error("Error deleting user addresses:", error);
        next(error);
    }
});

// Also handle findOneAndDelete
userSchema.pre('findOneAndDelete', async function(next) {
    try {
        const user = await this.model.findOne(this.getFilter());
        if (user) {
            const Address = mongoose.model('Address');
            await Address.deleteMany({ user: user._id });
            console.log(`✅ Deleted all addresses for user: ${user._id}`);
        }
        next();
    } catch (error) {
        console.error("Error deleting user addresses:", error);
        next(error);
    }
});



const User = mongoose.model("User", userSchema);
export default User;
