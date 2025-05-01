import Refund from '../modeles/refund.js';
import Orders from '../modeles/order2.js';
import mongoose from 'mongoose';

// Create a new refund request
export const createRefundRequest = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason, description, contactPreference, contactDetails } = req.body;
        const images = req.files ? req.files.map(file => file.path) : [];

        // Validate order exists
        const order = await Orders.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Check if a refund request already exists for this order
        const existingRefund = await Refund.findOne({ orderId });
        if (existingRefund) {
            return res.status(400).json({ message: "A refund request already exists for this order" });
        }

        // Create new refund request
        const refundRequest = new Refund({
            orderId,
            userId: order.userId,
            reason,
            description,
            images,
            contactPreference,
            contactDetails
        });

        await refundRequest.save();

        res.status(201).json({
            success: true,
            message: "Refund request created successfully",
            refund: refundRequest
        });
    } catch (error) {
        console.error('Error creating refund request:', error);
        res.status(500).json({
            success: false,
            message: "Failed to create refund request",
            error: error.message
        });
    }
};

// Get all refund requests for a user
export const getUserRefundRequests = async (req, res) => {
    try {
        const { userId } = req.params;
        const refunds = await Refund.find({ userId })
            .populate('orderId')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            refunds
        });
    } catch (error) {
        console.error('Error fetching refund requests:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch refund requests",
            error: error.message
        });
    }
};

// Get a specific refund request
export const getRefundRequest = async (req, res) => {
    try {
        const { refundId } = req.params;
        const refund = await Refund.findById(refundId).populate('orderId');

        if (!refund) {
            return res.status(404).json({
                success: false,
                message: "Refund request not found"
            });
        }

        res.json({
            success: true,
            refund
        });
    } catch (error) {
        console.error('Error fetching refund request:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch refund request",
            error: error.message
        });
    }
};

// Update refund request status (for admin/manager)
export const updateRefundStatus = async (req, res) => {
    try {
        const { refundId } = req.params;
        const { status } = req.body;

        const refund = await Refund.findByIdAndUpdate(
            refundId,
            { status },
            { new: true }
        ).populate('orderId');

        if (!refund) {
            return res.status(404).json({
                success: false,
                message: "Refund request not found"
            });
        }

        res.json({
            success: true,
            message: "Refund status updated successfully",
            refund
        });
    } catch (error) {
        console.error('Error updating refund status:', error);
        res.status(500).json({
            success: false,
            message: "Failed to update refund status",
            error: error.message
        });
    }
}; 