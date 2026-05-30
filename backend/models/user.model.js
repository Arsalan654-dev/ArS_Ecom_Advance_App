// backend\models\user.model.js

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


// ════════════════════════════════════════════════════════════
// Helper: cascade-delete all addresses for a user
// ════════════════════════════════════════════════════════════
async function cascadeDeleteAddresses(userId) {
    try {
        const Address = mongoose.model('Address');
        const result = await Address.deleteMany({ user: userId });
        console.log(`✅ [Hook] Cascade-deleted ${result.deletedCount} address(es) for user ${userId}`);
    } catch (err) {
        console.error(`❌ [Hook] Cascade delete failed for user ${userId}:`, err);
        throw err;
    }
}

// 1. Document middleware (when calling user.deleteOne() on an instance)
userSchema.pre('deleteOne', { document: true, query: false }, async function () {
    
        await cascadeDeleteAddresses(this._id);
      
   
});

// 2. Query middleware (when calling User.deleteOne({ _id: ... }))
userSchema.pre('deleteOne', { document: false, query: true }, async function () {

        const doc = await this.model.findOne(this.getFilter()).select('_id');
        if (doc) await cascadeDeleteAddresses(doc._id);
    
});

// 3. findOneAndDelete / findByIdAndDelete
userSchema.pre('findOneAndDelete', async function () {
    
        const doc = await this.model.findOne(this.getFilter()).select('_id');
        if (doc) await cascadeDeleteAddresses(doc._id);
       
});

// 4. deleteMany — bulk delete users
userSchema.pre('deleteMany', async function () {
  
        const docs = await this.model.find(this.getFilter()).select('_id');
        const ids = docs.map(d => d._id);
        if (ids.length) {
            const Address = mongoose.model('Address');
            const result = await Address.deleteMany({ user: { $in: ids } });
            console.log(`✅ [Hook] Bulk cascade-deleted ${result.deletedCount} addresses for ${ids.length} users`);
        }
    
});



const User = mongoose.model("User", userSchema);
export default User;
