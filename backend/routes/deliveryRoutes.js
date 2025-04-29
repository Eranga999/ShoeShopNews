import express from 'express';
import { 
  getDeliveryPersons, 
  addDeliveryPerson, 
  getOrders, 
  updateOrderStatus, 
  assignDeliveryPerson 
} from '../controllers/deliveryController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Delivery person routes
router.get('/delivery-persons', getDeliveryPersons);
router.post('/delivery-persons', addDeliveryPerson);

// Order routes
router.get('/orders', getOrders);
router.put('/orders/:orderId/status', updateOrderStatus);
router.put('/orders/:orderId/assign', assignDeliveryPerson);

export default router; 