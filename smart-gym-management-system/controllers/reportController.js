const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Equipment = require('../models/Equipment');
const MembershipPlan = require('../models/MembershipPlan');
const FitnessProgress = require('../models/FitnessProgress');

exports.memberReport = async (req, res) => {
  try {
    const { from, to, status } = req.query;
    let filter = {};
    if (status) filter.status = status;
    if (from || to) {
      filter.joiningDate = {};
      if (from) filter.joiningDate.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.joiningDate.$lte = toDate;
      }
    }

    const members = await Member.find(filter).populate('membershipPlan', 'planName price').sort({ joiningDate: -1 });
    return res.status(200).json({ success: true, data: members, count: members.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error generating member report.' });
  }
};

exports.trainerReport = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status) filter.status = status;

    const trainers = await Trainer.find(filter).sort({ joiningDate: -1 });
    const totalSalary = trainers.reduce((sum, t) => sum + t.salary, 0);
    return res.status(200).json({ success: true, data: trainers, count: trainers.length, totalSalary });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error generating trainer report.' });
  }
};

exports.membershipReport = async (req, res) => {
  try {
    const plans = await MembershipPlan.find().sort({ createdAt: -1 });
    const data = await Promise.all(plans.map(async (plan) => {
      const memberCount = await Member.countDocuments({ membershipPlan: plan._id });
      const activeCount = await Member.countDocuments({ membershipPlan: plan._id, status: 'Active' });
      return {
        _id: plan._id, planName: plan.planName, duration: plan.duration, price: plan.price,
        status: plan.status, totalMembers: memberCount, activeMembers: activeCount
      };
    }));
    return res.status(200).json({ success: true, data, count: data.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error generating membership report.' });
  }
};

exports.attendanceReport = async (req, res) => {
  try {
    const { from, to, member } = req.query;
    let filter = {};
    if (member) filter.member = member;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.date.$lte = toDate;
      }
    }

    const records = await Attendance.find(filter).populate('member', 'fullName email phone').sort({ date: -1 });
    const presentCount = records.filter(r => r.status === 'Present').length;
    const absentCount = records.filter(r => r.status === 'Absent').length;

    return res.status(200).json({ success: true, data: records, count: records.length, summary: { presentCount, absentCount } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error generating attendance report.' });
  }
};

exports.paymentReport = async (req, res) => {
  try {
    const { from, to, method, member } = req.query;
    let filter = {};
    if (method) filter.paymentMethod = method;
    if (member) filter.member = member;
    if (from || to) {
      filter.paymentDate = {};
      if (from) filter.paymentDate.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.paymentDate.$lte = toDate;
      }
    }

    const payments = await Payment.find(filter)
      .populate('member', 'fullName email phone')
      .populate('membershipPlan', 'planName')
      .sort({ paymentDate: -1 });

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    return res.status(200).json({ success: true, data: payments, count: payments.length, totalAmount });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error generating payment report.' });
  }
};

// Revenue report - grouped by month
exports.revenueReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    let filter = {};
    if (from || to) {
      filter.paymentDate = {};
      if (from) filter.paymentDate.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.paymentDate.$lte = toDate;
      }
    }

    const revenueAgg = await Payment.aggregate([
      { $match: filter },
      { $group: { _id: { year: { $year: '$paymentDate' }, month: { $month: '$paymentDate' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const data = revenueAgg.map(r => ({ period: `${r._id.month}/${r._id.year}`, total: r.total, count: r.count }));
    const grandTotal = data.reduce((sum, d) => sum + d.total, 0);

    return res.status(200).json({ success: true, data, count: data.length, grandTotal });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error generating revenue report.' });
  }
};

exports.equipmentReport = async (req, res) => {
  try {
    const { status, category } = req.query;
    let filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const equipment = await Equipment.find(filter).sort({ createdAt: -1 });
    const totalQuantity = equipment.reduce((sum, e) => sum + e.quantity, 0);
    const totalValue = equipment.reduce((sum, e) => sum + (e.purchasePrice * e.quantity), 0);

    return res.status(200).json({ success: true, data: equipment, count: equipment.length, totalQuantity, totalValue });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error generating equipment report.' });
  }
};

exports.maintenanceReport = async (req, res) => {
  try {
    const equipment = await Equipment.find({
      $or: [{ status: 'Maintenance Required' }, { status: 'Damaged' }, { nextMaintenanceDate: { $ne: null } }]
    }).sort({ nextMaintenanceDate: 1 });

    return res.status(200).json({ success: true, data: equipment, count: equipment.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error generating maintenance report.' });
  }
};

exports.fitnessProgressReport = async (req, res) => {
  try {
    const { member, from, to } = req.query;
    let filter = {};
    if (member) filter.member = member;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.date.$lte = toDate;
      }
    }

    const records = await FitnessProgress.find(filter).populate('member', 'fullName').sort({ date: -1 });
    return res.status(200).json({ success: true, data: records, count: records.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error generating fitness progress report.' });
  }
};
