const Trainer = require('../models/Trainer');
const Member = require('../models/Member');
const WorkoutPlan = require('../models/WorkoutPlan');

// GET /api/trainers (supports ?search= & ?status=)
exports.getTrainers = async (req, res) => {
  try {
    const { search, status } = req.query;
    let filter = {};

    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const trainers = await Trainer.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: trainers });
  } catch (err) {
    console.error('Get trainers error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching trainers.' });
  }
};

// GET /api/trainers/:id - includes assigned members and active workout plans
exports.getTrainerById = async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found.' });
    }

    const assignedMembers = await Member.find({ trainer: trainer._id }).select('fullName status photoUrl');
    const activeWorkoutPlans = await WorkoutPlan.countDocuments({ trainer: trainer._id, status: 'Active' });

    return res.status(200).json({ success: true, data: { ...trainer.toObject(), assignedMembers, activeWorkoutPlans } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching trainer.' });
  }
};

// POST /api/trainers
exports.createTrainer = async (req, res) => {
  try {
    const { name, photoUrl, email, phone, gender, specialization, experience, joiningDate, salary, status } = req.body;

    if (!name || !email || !phone || !gender || !specialization || experience === undefined || salary === undefined) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    const trainer = new Trainer({
      name,
      photoUrl: photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2f855a&color=fff&size=256`,
      email, phone, gender, specialization, experience,
      joiningDate: joiningDate || Date.now(),
      salary,
      status: status || 'Active'
    });

    await trainer.save();
    return res.status(201).json({ success: true, message: 'Trainer added successfully.', data: trainer });
  } catch (err) {
    console.error('Create trainer error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Error creating trainer.' });
  }
};

// PUT /api/trainers/:id
exports.updateTrainer = async (req, res) => {
  try {
    const trainer = await Trainer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found.' });
    }
    return res.status(200).json({ success: true, message: 'Trainer updated successfully.', data: trainer });
  } catch (err) {
    console.error('Update trainer error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Error updating trainer.' });
  }
};

// DELETE /api/trainers/:id
exports.deleteTrainer = async (req, res) => {
  try {
    const trainer = await Trainer.findByIdAndDelete(req.params.id);
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found.' });
    }
    return res.status(200).json({ success: true, message: 'Trainer deleted successfully.' });
  } catch (err) {
    console.error('Delete trainer error:', err);
    return res.status(500).json({ success: false, message: 'Error deleting trainer.' });
  }
};
