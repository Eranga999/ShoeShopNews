import mongoose from 'mongoose';

const deliveryDetailsSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required']
  },
  deliveryPersonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryPerson',
    required: [true, 'Delivery Person ID is required']
  },
  deliveryCost: {
    type: Number,
    required: [true, 'Delivery cost is required'],
    min: [0, 'Delivery cost cannot be negative']
  },
  mileage: {
    type: Number,
    required: [true, 'Mileage is required'],
    min: [0, 'Mileage cannot be negative']
  },
  petrolCost: {
    type: Number,
    required: [true, 'Petrol cost is required'],
    min: [0, 'Petrol cost cannot be negative']
  },
  timeSpent: {
    type: Number,
    required: [true, 'Time spent is required'],
    min: [0, 'Time spent cannot be negative']
  },
  additionalNotes: {
    type: String,
    trim: true,
    default: ''
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

deliveryDetailsSchema.index({ orderId: 1, deliveryPersonId: 1 }, { unique: true });

export const DeliveryDetails = mongoose.models.DeliveryDetails || mongoose.model('DeliveryDetails', deliveryDetailsSchema);