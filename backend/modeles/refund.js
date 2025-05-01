import mongoose from "mongoose";

const refundSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    images: [{
        type: String
    }],
    contactPreference: {
        type: String,
        enum: ['email', 'phone'],
        default: 'email'
    },
    contactDetails: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Refund = mongoose.model("Refund", refundSchema);
export default Refund; 