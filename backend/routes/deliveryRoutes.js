import express from 'express';
import { 
  getDeliveryPersons, 
  addDeliveryPerson, 
  getOrders, 
  updateOrderStatus, 
  assignDeliveryPerson 
} from '../controllers/deliveryController.js';
import {
  createDeliveryPerson,
  loginDeliveryPerson,
  getProfile
} from '../controllers/deliveryPersonController.js';
import { protect, authMiddleware, deliveryPersonAuth } from '../middleware/authMiddleware.js';
import { Order } from '../models/orderModel.js';
import mongoose from 'mongoose';

const router = express.Router();

// Public routes
router.post('/delivery-person/signup', createDeliveryPerson);
router.post('/delivery-person/login', loginDeliveryPerson);

// Protected delivery person routes
router.get('/delivery-person/profile', deliveryPersonAuth, getProfile);
router.get('/delivery-person/orders', deliveryPersonAuth, async (req, res) => {
  try {
    console.log('Fetching orders for delivery person:', req.user.id);

    // Convert string ID to ObjectId
    const deliveryPersonId = new mongoose.Types.ObjectId(req.user.id);

    const orders = await Order.find({ 
      'deliveryPerson._id': deliveryPersonId
    })
    .sort({ createdAt: -1 })
    .lean();

    console.log('Found orders:', orders.length);
    console.log('Query:', { 'deliveryPerson._id': deliveryPersonId });

    if (!orders || orders.length === 0) {
      return res.json([]);
    }

    // Transform orders to include all necessary details
    const transformedOrders = orders.map(order => ({
      _id: order._id,
      firstName: order.firstName,
      lastName: order.lastName,
      email: order.email,
      shippingAddress: order.shippingAddress,
      totalAmount: order.totalAmount,
      items: order.items,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      deliveryStatus: order.deliveryStatus || 'processing',
      deliveryPerson: order.deliveryPerson,
      createdAt: order.createdAt
    }));

    res.json(transformedOrders);
  } catch (error) {
    console.error('Error fetching delivery person orders:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch orders',
      error: error.message 
    });
  }
});

// Protected delivery manager routes
router.use('/manager', authMiddleware);
router.get('/manager/delivery-persons', getDeliveryPersons);
router.post('/manager/delivery-persons', addDeliveryPerson);
router.get('/manager/orders', getOrders);
router.put('/manager/orders/:orderId', updateOrderStatus);
router.put('/manager/orders/:orderId/assign', assignDeliveryPerson);

// Protected order status update route for delivery persons
router.put('/delivery-person/orders/:orderId/status', deliveryPersonAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryStatus } = req.body;

    // Convert string ID to ObjectId
    const deliveryPersonId = new mongoose.Types.ObjectId(req.user.id);

    // Verify the order belongs to this delivery person
    const order = await Order.findOne({
      _id: orderId,
      'deliveryPerson._id': deliveryPersonId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found or not assigned to you' });
    }

    order.deliveryStatus = deliveryStatus;
    await order.save();

    res.json({ success: true, message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

// Notification endpoints (protected by delivery manager auth)
router.post('/manager/send-welcome-email', authMiddleware, async (req, res) => {
  try {
    const { email, name, phone } = req.body;
    res.status(200).json({ 
      message: 'Welcome notification handled successfully',
      mock: true,
      details: { email, name, phone }
    });
  } catch (error) {
    console.error('Error in send-welcome-email:', error);
    res.status(500).json({ 
      message: 'Failed to handle welcome notification',
      error: error.message 
    });
  }
});

router.post('/manager/send-order-assignment', authMiddleware, async (req, res) => {
  try {
    const { deliveryPersonEmail, deliveryPersonName, orderDetails } = req.body;
    res.status(200).json({ 
      message: 'Order assignment notification handled successfully',
      mock: true,
      details: { deliveryPersonEmail, deliveryPersonName, orderDetails }
    });
  } catch (error) {
    console.error('Error in send-order-assignment:', error);
    res.status(500).json({ 
      message: 'Failed to handle order assignment notification',
      error: error.message 
    });
  }
});

export default router; 