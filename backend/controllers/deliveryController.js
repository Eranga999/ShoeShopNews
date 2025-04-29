import DeliveryPerson from '../modeles/DeliveryPerson.js';
import Order from '../modeles/order2.js';

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
    const deliveryPerson = new DeliveryPerson({
      name,
      email,
      phone,
      vehicleNumber,
      licenseNumber
    });
    await deliveryPerson.save();
    res.status(201).json({ message: 'Delivery person added successfully', deliveryPerson });
  } catch (error) {
    res.status(400).json({ message: error.message });
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
    
    const order = await Order.findByIdAndUpdate(
      orderId,
      { deliveryPerson: deliveryPersonId },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json({ message: 'Delivery person assigned successfully', order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 