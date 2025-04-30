import mongoose from 'mongoose';

const deliveryDetailSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  deliveryPerson: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    name: String,
    email: String,
    phone: String
  },
  deliveryCost: {
    type: Number,
    required: true
  },
  mileage: {
    type: Number,
    required: true
  },
  petrolCost: {
    type: Number,
    required: true
  },
  timeSpent: {
    type: Number,
    required: true
  },
  additionalNotes: {
    type: String,
    default: ''
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled'],
    default: 'completed'
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: null
  }
});

export const DeliveryDetail = mongoose.model('DeliveryDetail', deliveryDetailSchema); 