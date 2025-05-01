const Refund = require('../modeles/refund.model');
const Order = require('../modeles/order.model');

// Create a new refund request
exports.createRefundRequest = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId, reason, description, contactPreference, contactDetails } = req.body;

    // Find the order to get the order number
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Create new refund request
    const refund = new Refund({
      userId,
      orderId,
      orderNumber: order.orderNumber || order._id.toString().substring(0, 8).toUpperCase(),
      reason,
      description,
      contactPreference,
      contactDetails,
      images: req.files ? req.files.map(file => file.path) : []
    });

    await refund.save();
    res.status(201).json(refund);
  } catch (error) {
    console.error('Error creating refund request:', error);
    res.status(500).json({ message: 'Error creating refund request' });
  }
};

// Get all refund requests for a user
exports.getUserRefundRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    const refunds = await Refund.find({ userId })
      .sort({ createdAt: -1 });
    res.json(refunds);
  } catch (error) {
    console.error('Error fetching refund requests:', error);
    res.status(500).json({ message: 'Error fetching refund requests' });
  }
};

// Update a refund request
exports.updateRefundRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, description, contactPreference, contactDetails } = req.body;

    const refund = await Refund.findById(id);
    if (!refund) {
      return res.status(404).json({ message: 'Refund request not found' });
    }

    // Only allow updates if status is pending
    if (refund.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot update processed refund request' });
    }

    const updatedRefund = await Refund.findByIdAndUpdate(
      id,
      {
        reason,
        description,
        contactPreference,
        contactDetails,
        images: req.files ? req.files.map(file => file.path) : refund.images
      },
      { new: true }
    );

    res.json(updatedRefund);
  } catch (error) {
    console.error('Error updating refund request:', error);
    res.status(500).json({ message: 'Error updating refund request' });
  }
};

// Delete a refund request
exports.deleteRefundRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const refund = await Refund.findById(id);
    
    if (!refund) {
      return res.status(404).json({ message: 'Refund request not found' });
    }

    // Only allow deletion if status is pending
    if (refund.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot delete processed refund request' });
    }

    await Refund.findByIdAndDelete(id);
    res.json({ message: 'Refund request deleted successfully' });
  } catch (error) {
    console.error('Error deleting refund request:', error);
    res.status(500).json({ message: 'Error deleting refund request' });
  }
};

// Get a single refund request
exports.getRefundRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const refund = await Refund.findById(id);
    
    if (!refund) {
      return res.status(404).json({ message: 'Refund request not found' });
    }

    res.json(refund);
  } catch (error) {
    console.error('Error fetching refund request:', error);
    res.status(500).json({ message: 'Error fetching refund request' });
  }
}; 