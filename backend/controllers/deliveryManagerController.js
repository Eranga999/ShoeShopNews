import DeliveryManager from "../modeles/deliveryManager.js";
import Orders from "../modeles/order2.js";
import jwt from "jsonwebtoken";
import DeliveryPerson from "../modeles/DeliveryPerson.js";

// Register new delivery manager
export const registerDeliveryManager = async (req, res) => {
    try {
        const { name, email, password, phoneNumber, assignedArea } = req.body;

        // Check if manager already exists
        const existingManager = await DeliveryManager.findOne({ email });
        if (existingManager) {
            return res.status(400).json({ message: "Delivery manager already exists" });
        }

        // Create new manager
        const newManager = new DeliveryManager({
            name,
            email,
            password,
            phoneNumber,
            assignedArea
        });

        await newManager.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: newManager._id, role: 'delivery_manager' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: "Delivery manager registered successfully",
            token,
            manager: {
                id: newManager._id,
                name: newManager.name,
                email: newManager.email,
                assignedArea: newManager.assignedArea
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error registering delivery manager", error: error.message });
    }
};

// Login delivery manager
export const loginDeliveryManager = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find manager
        const manager = await DeliveryManager.findOne({ email });
        if (!manager) {
            return res.status(404).json({ message: "Delivery manager not found" });
        }

        // Check password
        const isMatch = await manager.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: manager._id, role: 'delivery_manager' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: "Login successful",
            token,
            manager: {
                id: manager._id,
                name: manager.name,
                email: manager.email,
                assignedArea: manager.assignedArea
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error logging in", error: error.message });
    }
};

// Get assigned orders for delivery manager
export const getAssignedOrders = async (req, res) => {
    try {
        const managerId = req.user.id;
        const manager = await DeliveryManager.findById(managerId);
        
        if (!manager) {
            return res.status(404).json({ message: "Delivery manager not found" });
        }

        const orders = await Orders.find({
            'deliveryStatus': { $in: ['processing', 'pickedup'] },
            'shippingAddress': { $regex: manager.assignedArea, $options: 'i' }
        }).sort({ orderDate: -1 });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders", error: error.message });
    }
};

// Update order delivery status
export const updateDeliveryStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { deliveryStatus } = req.body;

        const order = await Orders.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        order.deliveryStatus = deliveryStatus;
        await order.save();

        res.json({
            message: "Delivery status updated successfully",
            order
        });
    } catch (error) {
        res.status(500).json({ message: "Error updating delivery status", error: error.message });
    }
};

// Get delivery manager profile
export const getProfile = async (req, res) => {
    try {
        const managerId = req.user.id;
        const manager = await DeliveryManager.findById(managerId).select('-password');
        
        if (!manager) {
            return res.status(404).json({ message: "Delivery manager not found" });
        }

        res.json(manager);
    } catch (error) {
        res.status(500).json({ message: "Error fetching profile", error: error.message });
    }
};

// Assign delivery person to order
export const assignDeliveryPerson = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { deliveryPersonId } = req.body;

        console.log('Assignment request received:', { orderId, deliveryPersonId });

        if (!orderId || !deliveryPersonId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID and Delivery Person ID are required'
            });
        }

        // Find the order
        const order = await Orders.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Find the delivery person
        const deliveryPerson = await DeliveryPerson.findById(deliveryPersonId);
        if (!deliveryPerson) {
            return res.status(404).json({
                success: false,
                message: 'Delivery person not found'
            });
        }

        console.log('Found order and delivery person:', {
            orderId: order._id,
            orderStatus: order.deliveryStatus,
            deliveryPersonId: deliveryPerson._id,
            deliveryPersonName: deliveryPerson.name
        });

        try {
            // Update order with delivery person details
            order.deliveryPerson = {
                _id: deliveryPerson._id,
                name: deliveryPerson.name,
                email: deliveryPerson.email,
                phone: deliveryPerson.phone
            };
            order.deliveryStatus = 'processing';

            // Save the updated order
            await order.save();

            console.log('Order updated successfully');

            res.json({
                success: true,
                message: 'Delivery person assigned successfully',
                order
            });
        } catch (saveError) {
            console.error('Error saving order:', saveError);
            return res.status(500).json({
                success: false,
                message: 'Error saving order with delivery person details',
                error: saveError.message
            });
        }

    } catch (error) {
        console.error('Error in assignDeliveryPerson:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to assign delivery person'
        });
    }
}; 