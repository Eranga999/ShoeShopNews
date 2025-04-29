import express from 'express';
import {
  createDeliveryPerson,
  getAllDeliveryPersons,
  updateDeliveryPerson,
  deleteDeliveryPerson
} from '../controllers/deliveryPersonController.js';

const router = express.Router();

// CREATE: Add a new delivery person
router.post('/', createDeliveryPerson);

// READ: Get all delivery persons
router.get('/', getAllDeliveryPersons);

// UPDATE: Update a specific delivery person
router.put('/:id', updateDeliveryPerson);

// DELETE: Remove a specific delivery person
router.delete('/:id', deleteDeliveryPerson);

export default router;