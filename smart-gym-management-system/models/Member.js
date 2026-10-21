const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  photoUrl: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Gender is required']
  },
  dob: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  emergencyContact: {
    type: String,
    required: [true, 'Emergency contact is required'],
    trim: true
  },
  joiningDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  membershipPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MembershipPlan',
    required: [true, 'Membership plan is required']
  },
  membershipStartDate: {
    type: Date,
    required: [true, 'Membership start date is required']
  },
  membershipEndDate: {
    type: Date,
    required: [true, 'Membership end date is required']
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    default: null
  },
  weight: {
    type: Number, // kg
    default: null
  },
  height: {
    type: Number, // cm
    default: null
  },
  bmi: {
    type: Number,
    default: null
  },
  fitnessGoal: {
    type: String,
    enum: ['Weight Loss', 'Muscle Gain', 'General Fitness', 'Strength', 'Endurance'],
    default: 'General Fitness'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Expired'],
    default: 'Active'
  }
}, { timestamps: true });

// Auto-calculate BMI whenever weight or height is set/changed
MemberSchema.pre('save', function (next) {
  if (this.weight && this.height) {
    const heightInMeters = this.height / 100;
    this.bmi = Number((this.weight / (heightInMeters * heightInMeters)).toFixed(1));
  }
  next();
});

MemberSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.weight && update.height) {
    const heightInMeters = update.height / 100;
    update.bmi = Number((update.weight / (heightInMeters * heightInMeters)).toFixed(1));
  }
  next();
});

module.exports = mongoose.model('Member', MemberSchema);
