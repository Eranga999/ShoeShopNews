import { DeliveryPerson } from '../modeles/deliveryPersonModel.js';
import { DeliveryDetails } from '../modeles/deliveryDetailModel.js';
import { Order } from '../modeles/orderModel.js';
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
        message: 'Deliveryperson not found'
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
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Submit delivery details
export const submitDeliveryDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryCost, mileage, petrolCost, timeSpent, additionalNotes } = req.body;
    const deliveryPersonId = req.user.id;

    // Validate order exists and is assigned to this delivery person
    const order = await Order.findOne({
      _id: orderId,
      'deliveryPerson._id': deliveryPersonId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not assigned to this delivery person'
      });
    }

    // Check if delivery details already exist
    const existingDetails = await DeliveryDetails.findOne({ orderId, deliveryPersonId });
    if (existingDetails) {
      return res.status(400).json({
        success: false,
        message: 'Delivery details already submitted for this order'
      });
    }

    // Create new delivery details
    const deliveryDetails = new DeliveryDetails({
      orderId,
      deliveryPersonId,
      deliveryCost,
      mileage,
      petrolCost,
      timeSpent,
      additionalNotes
    });

    await deliveryDetails.save();

    res.status(201).json({
      success: true,
      message: 'Delivery details submitted successfully',
      details: deliveryDetails
    });
  } catch (error) {
    console.error('Error in submitDeliveryDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get delivery details for a delivery person
export const getDeliveryDetails = async (req, res) => {
  try {
    const deliveryPersonId = req.user.id;

    const deliveryDetails = await DeliveryDetails.find({ deliveryPersonId })
      .populate('orderId', 'orderNumber')
      .lean();

    // Transform the data to match frontend expectations
    const transformedDetails = deliveryDetails.map(detail => ({
      orderId: detail.orderId?._id?.toString() || detail.orderId,
      deliveryCost: detail.deliveryCost,
      mileage: detail.mileage,
      petrolCost: detail.petrolCost,
      timeSpent: detail.timeSpent,
      additionalNotes: detail.additionalNotes,
      submittedAt: detail.submittedAt
    }));

    res.status(200).json({
      success: true,
      details: transformedDetails
    });
  } catch (error) {
    console.error('Error in getDeliveryDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};