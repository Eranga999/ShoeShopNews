import mongoose from 'mongoose';

const deliveryPersonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  vehicleNumber: {
    type: String,
    required: [true, 'Vehicle number is required']
  },
  licenseNumber: {
    type: String,
    required: [true, 'License number is required']
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

deliveryPersonSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

deliveryPersonSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

deliveryPersonSchema.index({ email: 1 }, { unique: true });

export const DeliveryPerson = mongoose.models.DeliveryPerson || mongoose.model('DeliveryPerson', deliveryPersonSchema); 