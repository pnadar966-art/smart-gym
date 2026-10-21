const mongoose = require('mongoose');

const MembershipPlanSchema = new mongoose.Schema({
  planName: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true
  },
  duration: {
    type: String, // e.g. "1 Month", "3 Months", "6 Months", "12 Months"
    required: [true, 'Duration is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  features: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, { timestamps: true });

module.exports = mongoose.model('MembershipPlan', MembershipPlanSchema);
