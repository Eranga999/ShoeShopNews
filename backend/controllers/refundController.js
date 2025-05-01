import Refund from '../modeles/refund.js';
import Orders from '../modeles/order2.js';
import mongoose from 'mongoose';

// Create a new refund request
export const createRefundRequest = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason, description, contactPreference, contactDetails } = req.body;

        // Get userId from token/session (set by verifyToken middleware)
        const userId = req.userId || req.user?._id || req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        // Validate orderId format
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ 
                success: false,
                message: "Invalid order ID format" 
            });
        }

        // Get file paths from multer
        const images = req.files ? req.files.map(file => file.path.replace(/\\/g, '/')) : [];

        // Validate required fields
        if (!reason || !description || !contactDetails) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        // Validate order exists and belongs to user
        const order = await Orders.findOne({ 
            _id: orderId,
            userId: userId.toString()
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found or does not belong to user"
            });
        }

        // Check if order is eligible for refund
        if (order.status === 'Refunded' || order.paymentStatus !== 'Paid') {
            return res.status(400).json({
                success: false,
                message: "Order is not eligible for refund"
            });
        }

        // Check if a refund request already exists
        const existingRefund = await Refund.findOne({ orderId });
        if (existingRefund) {
            return res.status(400).json({
                success: false,
                message: "A refund request already exists for this order"
            });
        }

        // Create new refund request
        const refundRequest = new Refund({
            orderId,
            userId: userId.toString(),
            orderNumber: order._id.toString().substring(0, 8).toUpperCase(),
            reason,
            description,
            images,
            contactPreference,
            contactDetails,
            status: 'pending'
        });

        await refundRequest.save();

        // Update order status
        order.status = 'RefundRequested';
        await order.save();

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
        // Get userId from params or from token
        const userId = req.params.userId || req.userId || req.user?._id || req.user?.userId;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        console.log('Fetching refunds for user:', userId);

        const refunds = await Refund.find({ userId: userId.toString() })
            .populate('orderId')
            .sort({ createdAt: -1 });

        console.log('Found refunds:', refunds.length);

        // Transform refunds to match frontend expectations
        const transformedRefunds = refunds.map(refund => ({
            _id: refund._id,
            orderId: refund.orderId?._id || refund.orderId,
            orderNumber: refund.orderNumber,
            reason: refund.reason,
            description: refund.description,
            images: refund.images,
            contactPreference: refund.contactPreference,
            contactDetails: refund.contactDetails,
            status: refund.status,
            createdAt: refund.createdAt
        }));

        res.json({
            success: true,
            refunds: transformedRefunds
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

// Update a refund request
export const updateRefundRequest = async (req, res) => {
    try {
        const { refundId } = req.params;
        const { reason, description, contactPreference, contactDetails } = req.body;
        
        // Get userId from token/session
        const userId = req.userId || req.user?._id || req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        // Find the refund request
        const refund = await Refund.findOne({ _id: refundId, userId: userId.toString() });
        
        if (!refund) {
            return res.status(404).json({
                success: false,
                message: "Refund request not found or does not belong to user"
            });
        }

        // Only allow updates if status is pending
        if (refund.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: "Cannot update processed refund request"
            });
        }

        // Get new image paths if files were uploaded
        const images = req.files ? req.files.map(file => file.path.replace(/\\/g, '/')) : undefined;

        // Update the refund request
        const updates = {
            reason,
            description,
            contactPreference,
            contactDetails,
            ...(images && { images }) // Only update images if new files were uploaded
        };

        const updatedRefund = await Refund.findByIdAndUpdate(
            refundId,
            updates,
            { new: true }
        ).populate('orderId');

        res.json({
            success: true,
            message: "Refund request updated successfully",
            refund: updatedRefund
        });
    } catch (error) {
        console.error('Error updating refund request:', error);
        res.status(500).json({
            success: false,
            message: "Failed to update refund request",
            error: error.message
        });
    }
};

// Delete a refund request
export const deleteRefundRequest = async (req, res) => {
    try {
        const { refundId } = req.params;
        
        // Get userId from token/session
        const userId = req.userId || req.user?._id || req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        // Find the refund request
        const refund = await Refund.findOne({ _id: refundId, userId: userId.toString() });
        
        if (!refund) {
            return res.status(404).json({
                success: false,
                message: "Refund request not found or does not belong to user"
            });
        }

        // Only allow deletion if status is pending
        if (refund.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: "Cannot delete processed refund request"
            });
        }

        // Delete the refund request
        await Refund.findByIdAndDelete(refundId);

        // Update the associated order if needed
        if (refund.orderId) {
            const order = await Orders.findById(refund.orderId);
            if (order && order.status === 'RefundRequested') {
                order.status = 'Delivered'; // or whatever the previous status was
                await order.save();
            }
        }

        res.json({
            success: true,
            message: "Refund request deleted successfully"
        });
    } catch (error) {
        console.error('Error deleting refund request:', error);
        res.status(500).json({
            success: false,
            message: "Failed to delete refund request",
            error: error.message
        });
    }
}; 