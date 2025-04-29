import mongoose from "mongoose";
const orderSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: { type: Number, required: true, min: 1 }
    }],
    status: {
        type: String,
        enum: ["Order Received", "Order on the Way", "Order Handed Over"],
        default: "Order Received"
    },
    createdAt: { type: Date, default: Date.now }
});
export default mongoose.model("Order", orderSchema);