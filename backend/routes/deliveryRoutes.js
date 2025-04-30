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
import { Order } from '../modeles/orderModel.js';
import mongoose from 'mongoose';
import { DeliveryPerson } from '../modeles/deliveryPersonModel.js';
import { DeliveryDetails } from '../modeles/deliveryDetailModel.js'

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

// Add delivery details endpoint
router.post('/delivery-person/orders/:orderId/details', deliveryPersonAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryCost, mileage, petrolCost, timeSpent, additionalNotes } = req.body;
    const deliveryPersonId = new mongoose.Types.ObjectId(req.user.id);

    console.log('Submitting delivery details:', {
      orderId,
      deliveryPersonId: deliveryPersonId.toString(),
      details: { deliveryCost, mileage, petrolCost, timeSpent }
    });

    // Validate required fields
    if (!deliveryCost || !mileage || !petrolCost || !timeSpent) {
      return res.status(400).json({
        success: false,
        message: 'All fields (deliveryCost, mileage, petrolCost, timeSpent) are required'
      });
    }

    // Validate numeric values
    const numericFields = { deliveryCost, mileage, petrolCost, timeSpent };
    for (const [field, value] of Object.entries(numericFields)) {
      if (isNaN(value) || Number(value) <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${field}: must be a positive number`
        });
      }
    }

    // Verify the order belongs to this delivery person
    const order = await Order.findOne({
      _id: orderId,
      'deliveryPerson._id': deliveryPersonId
    });

    if (!order) {
      console.log('Order not found or not assigned to delivery person:', {
        orderId,
        deliveryPersonId: deliveryPersonId.toString()
      });
      return res.status(404).json({ 
        success: false,
        message: 'Order not found or not assigned to you' 
      });
    }

    // Save delivery details as a new document in the deliverydetails collection
    const deliveryDetailsDoc = new DeliveryDetails({
      orderId,
      deliveryPersonId,
      deliveryCost: Number(deliveryCost),
      mileage: Number(mileage),
      petrolCost: Number(petrolCost),
      timeSpent: Number(timeSpent),
      additionalNotes: additionalNotes || '',
      submittedAt: new Date()
    });
    await deliveryDetailsDoc.save();

    console.log('Delivery details saved successfully for order:', orderId);

    res.json({
      success: true,
      message: 'Delivery details submitted successfully',
      details: deliveryDetailsDoc
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Delivery details already exist for this order. Please update instead.'
      });
    }
    console.error('Error submitting delivery details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit delivery details',
      error: error.message
    });
  }
});

// Add GET endpoint to fetch delivery details
router.get('/delivery-person/orders/:orderId/details', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const deliveryPersonId = req.user.id;

    // Find the delivery details document
    const deliveryDetails = await DeliveryDetails.findOne({ orderId, deliveryPersonId });
    if (!deliveryDetails) {
      return res.status(404).json({
        success: false,
        message: 'No delivery details found for this order'
      });
    }

    res.json({
      success: true,
      details: deliveryDetails
    });
  } catch (error) {
    console.error('Error fetching delivery details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery details',
      error: error.message
    });
  }
});

// Add PUT endpoint to update delivery details
router.put('/delivery-person/orders/:orderId/details', deliveryPersonAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const deliveryPersonId = req.user.id;
    const update = req.body;

    // Convert to ObjectId
    const orderObjectId = new mongoose.Types.ObjectId(orderId);
    const deliveryPersonObjectId = new mongoose.Types.ObjectId(deliveryPersonId);

    // Check if the document exists
    const exists = await DeliveryDetails.findOne({ orderId: orderObjectId, deliveryPersonId: deliveryPersonObjectId });
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Detail not found' });
    }

    // Update
    const detail = await DeliveryDetails.findOneAndUpdate(
      { orderId: orderObjectId, deliveryPersonId: deliveryPersonObjectId },
      update,
      { new: true }
    );
    res.json({ success: true, details: detail });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add DELETE endpoint to delete delivery details
router.delete('/delivery-person/orders/:orderId/details', deliveryPersonAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const deliveryPersonId = req.user.id;

    const result = await DeliveryDetails.findOneAndDelete({ orderId, deliveryPersonId });
    if (!result) return res.status(404).json({ success: false, message: 'Detail not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Protected delivery manager routes
router.use('/manager', authMiddleware);
router.get('/manager/delivery-persons', getDeliveryPersons);
router.post('/manager/delivery-persons', addDeliveryPerson);
router.delete('/manager/delivery-persons/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if delivery person exists
    const deliveryPerson = await DeliveryPerson.findById(id);
    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        message: 'Delivery person not found'
      });
    }

    // Check for active orders
    const activeOrders = await Order.find({
      'deliveryPerson._id': id,
      deliveryStatus: { 
        $nin: ['delivered', 'cancelled'] 
      }
    });

    if (activeOrders.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete delivery person with active orders'
      });
    }

    // Delete the delivery person
    await DeliveryPerson.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Delivery person deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting delivery person:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});
router.get('/manager/orders', getOrders);
router.put('/manager/orders/:orderId', updateOrderStatus);
router.put('/manager/orders/:orderId/assign', assignDeliveryPerson);

// Add manager endpoint to get delivery details
router.get('/manager/orders/:orderId/details', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    if (!order.deliveryDetails) {
      return res.status(404).json({
        success: false,
        message: 'No delivery details found for this order'
      });
    }

    res.json({
      success: true,
      details: order.deliveryDetails
    });
  } catch (error) {
    console.error('Error fetching delivery details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery details',
      error: error.message
    });
  }
});

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

// Add GET endpoint to fetch all delivery details for manager
router.get('/manager/delivery-details', authMiddleware, async (req, res) => {
  try {
    const deliveryDetails = await DeliveryDetails.find()
      .populate('orderId', 'orderNumber')
      .populate('deliveryPersonId', 'name email phone')
      .sort({ submittedAt: -1 })
      .lean();

    res.json(deliveryDetails);
  } catch (error) {
    console.error('Error fetching delivery details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery details',
      error: error.message
    });
  }
});

// Get delivery details for a specific delivery person
router.get('/person/delivery-details', deliveryPersonAuth, async (req, res) => {
  try {
    const deliveryPersonId = req.user.id;

    // Find all delivery details for this delivery person
    const deliveryDetails = await DeliveryDetails.find({
      deliveryPersonId
    }).sort({ submittedAt: -1 });

    res.json({
      success: true,
      details: deliveryDetails
    });
  } catch (error) {
    console.error('Error fetching delivery details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery details',
      error: error.message
    });
  }
});

export default router; 