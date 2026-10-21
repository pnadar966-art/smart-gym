const mongoose = require('mongoose');

const FitnessProgressSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: [true, 'Member is required']
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  weight: {
    type: Number, // kg
    required: [true, 'Weight is required']
  },
  height: {
    type: Number, // cm
    required: [true, 'Height is required']
  },
  bmi: {
    type: Number,
    default: null
  },
  chest: {
    type: Number, // cm, optional body measurement
    default: null
  },
  waist: {
    type: Number,
    default: null
  },
  arms: {
    type: Number,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

FitnessProgressSchema.pre('save', function (next) {
  if (this.weight && this.height) {
    const heightInMeters = this.height / 100;
    this.bmi = Number((this.weight / (heightInMeters * heightInMeters)).toFixed(1));
  }
  next();
});

module.exports = mongoose.model('FitnessProgress', FitnessProgressSchema);
