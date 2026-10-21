const WorkoutPlan = require('../models/WorkoutPlan');

const exerciseImageMap = {
  chest: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
  back: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400',
  legs: 'https://images.unsplash.com/photo-1434682772747-f16d3ea162c3?w=400',
  shoulders: 'https://images.unsplash.com/photo-1522898467493-49726bf28798?w=400',
  arms: 'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=400',
  core: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
  cardio: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400',
  default: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400'
};

function getExerciseImage(targetMuscle) {
  const key = (targetMuscle || '').toLowerCase();
  for (const muscle in exerciseImageMap) {
    if (key.includes(muscle)) return exerciseImageMap[muscle];
  }
  return exerciseImageMap.default;
}

// GET /api/workouts (supports ?member= & ?trainer= & ?status=)
exports.getWorkoutPlans = async (req, res) => {
  try {
    const { member, trainer, status } = req.query;
    let filter = {};

    if (member) filter.member = member;
    if (trainer) filter.trainer = trainer;
    if (status) filter.status = status;

    const plans = await WorkoutPlan.find(filter)
      .populate('member', 'fullName photoUrl')
      .populate('trainer', 'name specialization')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: plans });
  } catch (err) {
    console.error('Get workout plans error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching workout plans.' });
  }
};

// GET /api/workouts/:id
exports.getWorkoutPlanById = async (req, res) => {
  try {
    const plan = await WorkoutPlan.findById(req.params.id)
      .populate('member', 'fullName photoUrl')
      .populate('trainer', 'name specialization');

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Workout plan not found.' });
    }
    return res.status(200).json({ success: true, data: plan });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching workout plan.' });
  }
};

// POST /api/workouts
exports.createWorkoutPlan = async (req, res) => {
  try {
    const { planName, member, trainer, goal, difficulty, startDate, endDate, exercises } = req.body;

    if (!planName || !member || !trainer || !goal || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    const processedExercises = (exercises || []).map(ex => ({
      ...ex,
      imageUrl: ex.imageUrl || getExerciseImage(ex.targetMuscle)
    }));

    const plan = new WorkoutPlan({
      planName, member, trainer, goal,
      difficulty: difficulty || 'Beginner',
      startDate, endDate,
      exercises: processedExercises,
      status: 'Active'
    });

    await plan.save();
    return res.status(201).json({ success: true, message: 'Workout plan created successfully.', data: plan });
  } catch (err) {
    console.error('Create workout plan error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Error creating workout plan.' });
  }
};

// PUT /api/workouts/:id
exports.updateWorkoutPlan = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.exercises) {
      body.exercises = body.exercises.map(ex => ({
        ...ex,
        imageUrl: ex.imageUrl || getExerciseImage(ex.targetMuscle)
      }));
    }

    const plan = await WorkoutPlan.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Workout plan not found.' });
    }
    return res.status(200).json({ success: true, message: 'Workout plan updated successfully.', data: plan });
  } catch (err) {
    console.error('Update workout plan error:', err);
    return res.status(500).json({ success: false, message: 'Error updating workout plan.' });
  }
};

// DELETE /api/workouts/:id
exports.deleteWorkoutPlan = async (req, res) => {
  try {
    const plan = await WorkoutPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Workout plan not found.' });
    }
    return res.status(200).json({ success: true, message: 'Workout plan deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error deleting workout plan.' });
  }
};
