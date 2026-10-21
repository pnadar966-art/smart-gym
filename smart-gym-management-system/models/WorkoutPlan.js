const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
  exerciseName: {
    type: String,
    required: [true, 'Exercise name is required'],
    trim: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  targetMuscle: {
    type: String,
    required: [true, 'Target muscle is required'],
    trim: true
  },
  sets: {
    type: Number,
    required: [true, 'Sets are required'],
    min: [1, 'Sets must be at least 1']
  },
  reps: {
    type: Number,
    required: [true, 'Reps are required'],
    min: [1, 'Reps must be at least 1']
  },
  durationMinutes: {
    type: Number,
    default: 0
  },
  restSeconds: {
    type: Number,
    default: 60
  },
  notes: {
    type: String,
    default: ''
  }
}, { _id: true });

const WorkoutPlanSchema = new mongoose.Schema({
  planName: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: [true, 'Member is required']
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: [true, 'Trainer is required']
  },
  goal: {
    type: String,
    enum: ['Weight Loss', 'Muscle Gain', 'General Fitness', 'Strength', 'Endurance'],
    required: [true, 'Goal is required']
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  exercises: {
    type: [ExerciseSchema],
    default: []
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Cancelled'],
    default: 'Active'
  }
}, { timestamps: true });

module.exports = mongoose.model('WorkoutPlan', WorkoutPlanSchema);
