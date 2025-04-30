import mongoose from 'mongoose';

const deliveryPersonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters long'],
    validate: {
      validator: function(v) {
        return /^[A-Za-z\s]{3,}$/.test(v);
      },
      message: 'Name must contain only letters'
    }
  },
  nic: {
    type: String,
    required: [true, 'NIC is required'],
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d{12}$/.test(v);
      },
      message: 'NIC must be exactly 12 digits'
    }
  },
  totalTrips: {
    type: Number,
    required: [true, 'Total trips is required'],
    min: [0, 'Total trips must be positive']
  },
  mileage: {
    type: Number,
    required: [true, 'Mileage is required'],
    min: [0, 'Mileage must be positive']
  },
  deliveryCost: {
    type: Number,
    required: [true, 'Delivery cost is required'],
    min: [0, 'Delivery cost must be positive']
  }
}, { timestamps: true });

export default mongoose.model('DeliveryPerson', deliveryPersonSchema);