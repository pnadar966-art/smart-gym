const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema({
  equipmentName: {
    type: String,
    required: [true, 'Equipment name is required'],
    trim: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['Cardio', 'Strength', 'Free Weights', 'Other'],
    required: [true, 'Category is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 1
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required']
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price is required'],
    min: [0, 'Price cannot be negative']
  },
  condition: {
    type: String,
    enum: ['New', 'Good', 'Fair', 'Needs Repair'],
    default: 'Good'
  },
  status: {
    type: String,
    enum: ['Available', 'In Use', 'Maintenance Required', 'Damaged'],
    default: 'Available'
  },
  lastMaintenanceDate: {
    type: Date,
    default: null
  },
  nextMaintenanceDate: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Equipment', EquipmentSchema);
