import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  shippingAddress: {
    type: String,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  items: [{
    BrandName: String,
    ModelName: String,
    quantity: Number,
    price: Number,
    totalAmount: Number,
    imageUrl: String
  }],
  paymentMethod: {
    type: String,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  deliveryStatus: {
    type: String,
    enum: ['processing', 'pickedup', 'delivered', 'cancelled'],
    default: 'processing'
  },
  deliveryPerson: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryPerson'
    },
    name: String,
    email: String,
    phone: String
  },
  deliveryDetails: {
    deliveryCost: {
      type: Number,
      min: 0
    },
    mileage: {
      type: Number,
      min: 0
    },
    petrolCost: {
      type: Number,
      min: 0
    },
    timeSpent: {
      type: Number,
      min: 0
    },
    additionalNotes: String,
    submittedAt: Date
  }
}, {
  timestamps: true
});

// Add index for faster queries
orderSchema.index({ 'deliveryPerson._id': 1 });

// Check if the model exists before compiling it
export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema); 