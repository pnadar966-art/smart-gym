const FitnessProgress = require('../models/FitnessProgress');
const Member = require('../models/Member');

// GET /api/fitness-progress (supports ?member=)
exports.getProgress = async (req, res) => {
  try {
    const { member } = req.query;
    let filter = {};
    if (member) filter.member = member;

    const records = await FitnessProgress.find(filter)
      .populate('member', 'fullName photoUrl')
      .sort({ date: 1 });

    return res.status(200).json({ success: true, data: records });
  } catch (err) {
    console.error('Get fitness progress error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching fitness progress.' });
  }
};

// POST /api/fitness-progress - also updates the member's current weight/height/bmi
exports.addProgress = async (req, res) => {
  try {
    const { member, date, weight, height, chest, waist, arms, notes } = req.body;

    if (!member || weight === undefined || height === undefined) {
      return res.status(400).json({ success: false, message: 'Member, weight and height are required.' });
    }

    const memberExists = await Member.findById(member);
    if (!memberExists) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const progress = new FitnessProgress({
      member, date: date || Date.now(), weight, height,
      chest: chest || null, waist: waist || null, arms: arms || null,
      notes: notes || ''
    });

    await progress.save();

    // Keep the member's latest weight/height/BMI in sync
    memberExists.weight = weight;
    memberExists.height = height;
    await memberExists.save();

    const populated = await progress.populate('member', 'fullName photoUrl');

    return res.status(201).json({ success: true, message: 'Fitness progress recorded successfully.', data: populated });
  } catch (err) {
    console.error('Add fitness progress error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Error recording fitness progress.' });
  }
};

// DELETE /api/fitness-progress/:id
exports.deleteProgress = async (req, res) => {
  try {
    const progress = await FitnessProgress.findByIdAndDelete(req.params.id);
    if (!progress) {
      return res.status(404).json({ success: false, message: 'Progress record not found.' });
    }
    return res.status(200).json({ success: true, message: 'Progress record deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error deleting progress record.' });
  }
};
