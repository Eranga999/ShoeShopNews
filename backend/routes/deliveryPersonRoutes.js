import express from 'express';
import {
  createDeliveryPerson,
  getAllDeliveryPersons,
  updateDeliveryPerson,
  deleteDeliveryPerson,
  submitDeliveryDetails,
  getDeliveryDetails
} from '../controllers/deliveryPersonController.js';
import { deliveryPersonAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// CREATE: Add a new delivery person
router.post('/', createDeliveryPerson);

// READ: Get all delivery persons
router.get('/', getAllDeliveryPersons);

// UPDATE: Update a delivery person
router.put('/:id', deliveryPersonAuth, updateDeliveryPerson);

// DELETE: Delete a delivery person
router.delete('/:id', deliveryPersonAuth, deleteDeliveryPerson);

// SUBMIT: Delivery details
router.post('/orders/:orderId/details', deliveryPersonAuth, submitDeliveryDetails);

// GET: Delivery details
router.get('/delivery-details', deliveryPersonAuth, getDeliveryDetails);

export default router;