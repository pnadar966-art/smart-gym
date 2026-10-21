const MembershipPlan = require('../models/MembershipPlan');
const Member = require('../models/Member');

// GET /api/plans (supports ?search= & ?status=)
exports.getPlans = async (req, res) => {
  try {
    const { search, status } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (search) filter.planName = { $regex: search, $options: 'i' };

    const plans = await MembershipPlan.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: plans });
  } catch (err) {
    console.error('Get plans error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching membership plans.' });
  }
};

// GET /api/plans/:id
exports.getPlanById = async (req, res) => {
  try {
    const plan = await MembershipPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }
    return res.status(200).json({ success: true, data: plan });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching plan.' });
  }
};

// POST /api/plans
exports.createPlan = async (req, res) => {
  try {
    const { planName, duration, price, description, features, status } = req.body;

    if (!planName || !duration || price === undefined) {
      return res.status(400).json({ success: false, message: 'Plan name, duration and price are required.' });
    }

    let featuresArray = features;
    if (typeof features === 'string') {
      featuresArray = features.split(',').map(f => f.trim()).filter(f => f.length > 0);
    }

    const plan = new MembershipPlan({
      planName, duration, price,
      description: description || '',
      features: featuresArray || [],
      status: status || 'Active'
    });

    await plan.save();
    return res.status(201).json({ success: true, message: 'Membership plan added successfully.', data: plan });
  } catch (err) {
    console.error('Create plan error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Error creating plan.' });
  }
};

// PUT /api/plans/:id
exports.updatePlan = async (req, res) => {
  try {
    const body = { ...req.body };
    if (typeof body.features === 'string') {
      body.features = body.features.split(',').map(f => f.trim()).filter(f => f.length > 0);
    }

    const plan = await MembershipPlan.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }
    return res.status(200).json({ success: true, message: 'Plan updated successfully.', data: plan });
  } catch (err) {
    console.error('Update plan error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Error updating plan.' });
  }
};

// DELETE /api/plans/:id
exports.deletePlan = async (req, res) => {
  try {
    const assignedCount = await Member.countDocuments({ membershipPlan: req.params.id });
    if (assignedCount > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete. ${assignedCount} member(s) are using this plan.` });
    }

    const plan = await MembershipPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }
    return res.status(200).json({ success: true, message: 'Plan deleted successfully.' });
  } catch (err) {
    console.error('Delete plan error:', err);
    return res.status(500).json({ success: false, message: 'Error deleting plan.' });
  }
};
