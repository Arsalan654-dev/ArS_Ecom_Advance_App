// models/deliveryZone.model.js

import mongoose from "mongoose";

const foodCategorySchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    isActive: {
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

foodCategorySchema.index({ restaurant: 1 });

async function cascadeDeleteFoodItems(categoryId) {
    try {
        const FoodItem = mongoose.model('FoodItem');
        await FoodItem.deleteMany({ category: categoryId });
        console.log(`✅ Cascade deleted food items for category ${categoryId}`);
    } catch (err) {
        console.error(`❌ Cascade delete failed for category ${categoryId}:`, err);
        throw err;
    }
}

foodCategorySchema.pre('deleteOne', { document: true, query: false }, async function () {
    await cascadeDeleteFoodItems(this._id);
});

foodCategorySchema.pre('deleteOne', { document: false, query: true }, async function () {
    const doc = await this.model.findOne(this.getFilter()).select('_id');
    if (doc) await cascadeDeleteFoodItems(doc._id);
});

foodCategorySchema.pre('findOneAndDelete', async function () {
    const doc = await this.model.findOne(this.getFilter()).select('_id');
    if (doc) await cascadeDeleteFoodItems(doc._id);
});

const FoodCategory = mongoose.model("FoodCategory", foodCategorySchema);
export default FoodCategory;
