import DeliveryPerson from '../models/deliveryPerson.js';
import { validateDeliveryPerson } from '../validation/deliveryPersonValidation.js';

// Create a new delivery person
export const createDeliveryPerson = async (req, res) => {
  try {
    // Validate request body
    const { error } = validateDeliveryPerson(req.body);
    if (error) {
      // Format validation errors
      const errors = error.details.reduce((acc, curr) => {
        acc[curr.path[0]] = curr.message;
        return acc;
      }, {});
      
      return res.status(400).json({
        success: false,
        errors
      });
    }

    // Create new delivery person
    const newDeliveryPerson = new DeliveryPerson(req.body);
    await newDeliveryPerson.save();

    res.status(201).json({
      success: true,
      message: 'Delivery person created successfully',
      data: newDeliveryPerson
    });
  } catch (error) {
    // Handle potential mongoose validation errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'NIC already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all delivery persons
export const getAllDeliveryPersons = async (req, res) => {
  try {
    const deliveryPersons = await DeliveryPerson.find();
    
    res.status(200).json({
      success: true,
      count: deliveryPersons.length,
      data: deliveryPersons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update a delivery person
export const updateDeliveryPerson = async (req, res) => {
  try {
    // Validate request body
    const { error } = validateDeliveryPerson(req.body);
    if (error) {
      // Format validation errors
      const errors = error.details.reduce((acc, curr) => {
        acc[curr.path[0]] = curr.message;
        return acc;
      }, {});
      
      return res.status(400).json({
        success: false,
        errors
      });
    }

    // Find and update delivery person
    const updatedDeliveryPerson = await DeliveryPerson.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );

    if (!updatedDeliveryPerson) {
      return res.status(404).json({
        success: false,
        message: 'Delivery person not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Delivery person updated successfully',
      data: updatedDeliveryPerson
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete a delivery person
export const deleteDeliveryPerson = async (req, res) => {
  try {
    const deletedDeliveryPerson = await DeliveryPerson.findByIdAndDelete(req.params.id);

    if (!deletedDeliveryPerson) {
      return res.status(404).json({
        success: false,
        message: 'Delivery person not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Delivery person deleted successfully',
      data: deletedDeliveryPerson
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};