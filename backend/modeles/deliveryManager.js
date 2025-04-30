import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const deliveryManagerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    assignedArea: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
deliveryManagerSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to compare password
deliveryManagerSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const DeliveryManager = mongoose.model("DeliveryManager", deliveryManagerSchema);
export default DeliveryManager; 