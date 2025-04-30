import express from 'express';
import { 
  getDeliveryPersons, 
  addDeliveryPerson, 
  getOrders, 
  updateOrderStatus, 
  assignDeliveryPerson 
} from '../controllers/deliveryController.js';
import { protect } from '../middleware/authMiddleware.js';
import { Order } from '../models/orderModel.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Delivery person routes
router.get('/delivery-persons', getDeliveryPersons);
router.post('/delivery-persons', addDeliveryPerson);

// Order routes
router.get('/orders', getOrders);
router.put('/orders/:orderId/status', updateOrderStatus);
router.put('/orders/:orderId/assign', assignDeliveryPerson);

// Send welcome email to new delivery person - temporary mock endpoint
router.post('/send-welcome-email', async (req, res) => {
  try {
    const { email, name, phone } = req.body;
    // Just return success without actually sending email
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

// Send order assignment notification - temporary mock endpoint
router.post('/send-order-assignment', async (req, res) => {
  try {
    const { deliveryPersonEmail, deliveryPersonName, orderDetails } = req.body;
    // Just return success without actually sending email
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

// Get orders for a specific delivery person
router.get('/delivery-persons/:id/orders', async (req, res) => {
  try {
    const orders = await Order.find({ 'deliveryPerson._id': req.params.id })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching delivery person orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

export default router; 