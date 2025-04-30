import DeliveryPerson from '../modeles/DeliveryPerson.js';
import { Order } from '../models/orderModel.js';
import axios from 'axios';

// Get all delivery persons
export const getDeliveryPersons = async (req, res) => {
  try {
    const deliveryPersons = await DeliveryPerson.find();
    res.json({ deliveryPersons });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add new delivery person
export const addDeliveryPerson = async (req, res) => {
  try {
    const { name, email, phone, vehicleNumber, licenseNumber } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !vehicleNumber || !licenseNumber) {
      return res.status(400).json({ 
        message: 'All fields are required: name, email, phone, vehicleNumber, licenseNumber' 
      });
    }

    // Check if delivery person with same email exists
    const existingPerson = await DeliveryPerson.findOne({ email });
    if (existingPerson) {
      return res.status(400).json({ 
        message: 'A delivery person with this email already exists' 
      });
    }

    // Create new delivery person
    const deliveryPerson = new DeliveryPerson({
      name,
      email,
      phone,
      vehicleNumber,
      licenseNumber,
      status: 'active'
    });

    // Save to database
    const savedPerson = await deliveryPerson.save();

    // Send response
    res.status(201).json({ 
      message: 'Delivery person added successfully', 
      deliveryPerson: savedPerson 
    });

  } catch (error) {
    console.error('Error in addDeliveryPerson:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'A delivery person with this email already exists' 
      });
    }
    res.status(500).json({ 
      message: 'Failed to add delivery person', 
      error: error.message 
    });
  }
};

// Get all orders
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    
    const stats = {
      pendingDeliveries: await Order.countDocuments({ deliveryStatus: 'processing' }),
      inTransit: await Order.countDocuments({ deliveryStatus: 'pickedup' }),
      completed: await Order.countDocuments({ deliveryStatus: 'delivered' }),
      cancelled: 0,
      totalDrivers: await DeliveryPerson.countDocuments()
    };

    res.json({ orders, stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      orderId,
      { deliveryStatus: status },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Assign delivery person to order
export const assignDeliveryPerson = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryPersonId } = req.body;

    if (!orderId || !deliveryPersonId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and Delivery Person ID are required'
      });
    }

    console.log('Starting assignment process:', {
      orderId,
      deliveryPersonId
    });

    // First, get the delivery person details
    const deliveryPerson = await DeliveryPerson.findById(deliveryPersonId);
    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        message: 'Delivery person not found'
      });
    }

    console.log('Found delivery person:', {
      id: deliveryPerson._id,
      name: deliveryPerson.name
    });

    // Update order with delivery person details using findByIdAndUpdate
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          deliveryPerson: {
            _id: deliveryPerson._id,
            name: deliveryPerson.name,
            email: deliveryPerson.email,
            phone: deliveryPerson.phone
          },
          deliveryStatus: 'processing'
        }
      },
      { 
        new: true, // Return the updated document
        runValidators: false // Disable validation for this update
      }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('Order updated successfully:', {
      orderId: updatedOrder._id,
      deliveryPersonId: updatedOrder.deliveryPerson?._id,
      status: updatedOrder.deliveryStatus
    });

    res.json({
      success: true,
      message: 'Delivery person assigned successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Error in assignDeliveryPerson:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to assign delivery person'
    });
  }
}; 