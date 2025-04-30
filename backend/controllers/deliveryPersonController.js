import DeliveryPerson from '../modeles/DeliveryPerson.js';
import { validateDeliveryPerson } from '../validation/deliveryPersonValidation.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Create a new delivery person
export const createDeliveryPerson = async (req, res) => {
  try {
    const { name, email, password, phone, vehicleNumber, licenseNumber } = req.body;

    // Check if delivery person already exists
    const existingPerson = await DeliveryPerson.findOne({ email });
    if (existingPerson) {
      return res.status(400).json({
        success: false,
        message: 'A delivery person with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new delivery person
    const newDeliveryPerson = new DeliveryPerson({
      name,
      email,
      password: hashedPassword,
      phone,
      vehicleNumber,
      licenseNumber,
      status: 'active'
    });

    await newDeliveryPerson.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: newDeliveryPerson._id, role: 'delivery_person' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Delivery person created successfully',
      token,
      deliveryPerson: {
        id: newDeliveryPerson._id,
        name: newDeliveryPerson.name,
        email: newDeliveryPerson.email,
        phone: newDeliveryPerson.phone
      }
    });
  } catch (error) {
    console.error('Error in createDeliveryPerson:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Login delivery person
export const loginDeliveryPerson = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find delivery person
    const deliveryPerson = await DeliveryPerson.findOne({ email });
    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        message: 'Delivery person not found'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, deliveryPerson.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: deliveryPerson._id, role: 'delivery_person' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      deliveryPerson: {
        id: deliveryPerson._id,
        name: deliveryPerson.name,
        email: deliveryPerson.email,
        phone: deliveryPerson.phone
      }
    });
  } catch (error) {
    console.error('Error in loginDeliveryPerson:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get delivery person profile
export const getProfile = async (req, res) => {
  try {
    const deliveryPerson = await DeliveryPerson.findById(req.user.id).select('-password');
    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        message: 'Delivery person not found'
      });
    }

    res.json({
      success: true,
      deliveryPerson
    });
  } catch (error) {
    console.error('Error in getProfile:', error);
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