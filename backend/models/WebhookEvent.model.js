// backend/models/WebhookEvent.model.js
import mongoose from 'mongoose';

const webhookEventSchema = new mongoose.Schema({
    eventId: {
        type: String,
        required: true,
        unique: true
    },
    eventType: {
        type: String,
        required: true,
        index: true
    },
    apiVersion: String,
    created: Date,
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    processed: {
        type: Boolean,
        default: false
    },
    processedAt: Date,
    error: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for faster queries
webhookEventSchema.index({ eventType: 1, createdAt: -1 });
webhookEventSchema.index({ processed: 1 });
webhookEventSchema.index({ createdAt: -1 });

const WebhookEvent = mongoose.model("WebhookEvent", webhookEventSchema);
export default WebhookEvent;