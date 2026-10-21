const Member = require('../models/Member');

// GET /api/members (supports ?search= & ?status= & ?plan= & ?trainer=)
exports.getMembers = async (req, res) => {
  try {
    const { search, status, plan, trainer } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (plan) filter.membershipPlan = plan;
    if (trainer) filter.trainer = trainer;

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const members = await Member.find(filter)
      .populate('membershipPlan', 'planName duration price')
      .populate('trainer', 'name specialization')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: members });
  } catch (err) {
    console.error('Get members error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching members.' });
  }
};

// GET /api/members/:id
exports.getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id)
      .populate('membershipPlan')
      .populate('trainer', 'name specialization photoUrl phone email');

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    return res.status(200).json({ success: true, data: member });
  } catch (err) {
    console.error('Get member error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching member.' });
  }
};

// POST /api/members
exports.createMember = async (req, res) => {
  try {
    const {
      fullName, photoUrl, email, phone, gender, dob, address, emergencyContact, joiningDate,
      membershipPlan, membershipStartDate, membershipEndDate, trainer,
      weight, height, fitnessGoal, status
    } = req.body;

    if (!fullName || !email || !phone || !gender || !dob || !address || !emergencyContact ||
        !membershipPlan || !membershipStartDate || !membershipEndDate) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    const member = new Member({
      fullName,
      photoUrl: photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=1e3a5f&color=fff&size=256`,
      email, phone, gender, dob, address, emergencyContact,
      joiningDate: joiningDate || Date.now(),
      membershipPlan, membershipStartDate, membershipEndDate,
      trainer: trainer || null,
      weight: weight || null,
      height: height || null,
      fitnessGoal: fitnessGoal || 'General Fitness',
      status: status || 'Active'
    });

    await member.save();
    return res.status(201).json({ success: true, message: 'Member added successfully.', data: member });
  } catch (err) {
    console.error('Create member error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Error creating member.' });
  }
};

// PUT /api/members/:id
exports.updateMember = async (req, res) => {
  try {
    const existing = await Member.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    Object.assign(existing, req.body);
    await existing.save(); // triggers pre-save BMI calculation

    return res.status(200).json({ success: true, message: 'Member updated successfully.', data: existing });
  } catch (err) {
    console.error('Update member error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Error updating member.' });
  }
};

// DELETE /api/members/:id
exports.deleteMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    return res.status(200).json({ success: true, message: 'Member deleted successfully.' });
  } catch (err) {
    console.error('Delete member error:', err);
    return res.status(500).json({ success: false, message: 'Error deleting member.' });
  }
};
