import express from 'express';
import {
  createDeliveryPerson,
  getAllDeliveryPersons,
  updateDeliveryPerson,
  deleteDeliveryPerson
} from '../controllers/deliveryPersonController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// CREATE: Add a new delivery person
router.post('/', createDeliveryPerson);

// READ: Get all delivery persons
router.get('/', getAllDeliveryPersons);

// UPDATE: Update a delivery person
router.put('/:id', authMiddleware, updateDeliveryPerson);

// DELETE: Delete a delivery person
router.delete('/:id', authMiddleware, deleteDeliveryPerson);

export default router;