const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const MembershipPlan = require('../models/MembershipPlan');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Equipment = require('../models/Equipment');

// GET /api/dashboard - all values computed live from MongoDB
exports.getDashboardStats = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalMembers,
      activeMembers,
      totalTrainers,
      activePlans,
      todaysAttendanceCount,
      monthlyRevenueAgg,
      expiringMemberships,
      maintenanceEquipmentCount,
      recentMembers,
      recentPayments,
      expiringMembersList,
      maintenanceAlertsList
    ] = await Promise.all([
      Member.countDocuments(),
      Member.countDocuments({ status: 'Active' }),
      Trainer.countDocuments(),
      MembershipPlan.countDocuments({ status: 'Active' }),
      Attendance.countDocuments({ date: { $gte: startOfDay, $lte: endOfDay } }),
      Payment.aggregate([
        { $match: { paymentDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Member.countDocuments({ membershipEndDate: { $gte: new Date(), $lte: sevenDaysFromNow }, status: 'Active' }),
      Equipment.countDocuments({ $or: [{ status: 'Maintenance Required' }, { status: 'Damaged' }] }),
      Member.find().sort({ createdAt: -1 }).limit(5).populate('membershipPlan', 'planName'),
      Payment.find().sort({ paymentDate: -1 }).limit(5).populate('member', 'fullName'),
      Member.find({ membershipEndDate: { $gte: new Date(), $lte: sevenDaysFromNow }, status: 'Active' })
        .select('fullName membershipEndDate photoUrl').limit(10),
      Equipment.find({ $or: [{ status: 'Maintenance Required' }, { status: 'Damaged' }] })
        .select('equipmentName status nextMaintenanceDate').limit(10)
    ]);

    // Membership growth chart - members joined per month, last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const membershipGrowthAgg = await Member.aggregate([
      { $match: { joiningDate: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$joiningDate' }, month: { $month: '$joiningDate' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Monthly revenue chart - last 6 months
    const revenueAgg = await Payment.aggregate([
      { $match: { paymentDate: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$paymentDate' }, month: { $month: '$paymentDate' } }, total: { $sum: '$amount' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Attendance trend - last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const attendanceTrendAgg = await Attendance.aggregate([
      { $match: { date: { $gte: sevenDaysAgo }, status: 'Present' } },
      { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' }, day: { $dayOfMonth: '$date' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Plan distribution
    const planDistributionAgg = await Member.aggregate([
      { $group: { _id: '$membershipPlan', count: { $sum: 1 } } }
    ]);
    const planIds = planDistributionAgg.map(p => p._id).filter(Boolean);
    const plansForDistribution = await MembershipPlan.find({ _id: { $in: planIds } }).select('planName');
    const planDistribution = planDistributionAgg.map(p => {
      const plan = plansForDistribution.find(pl => pl._id.toString() === (p._id ? p._id.toString() : ''));
      return { planName: plan ? plan.planName : 'Unknown', count: p.count };
    });

    return res.status(200).json({
      success: true,
      data: {
        totalMembers,
        activeMembers,
        totalTrainers,
        activePlans,
        todaysAttendanceCount,
        monthlyRevenue: monthlyRevenueAgg.length > 0 ? monthlyRevenueAgg[0].total : 0,
        expiringMemberships,
        maintenanceEquipmentCount,
        recentMembers,
        recentPayments,
        expiringMembersList,
        maintenanceAlertsList,
        charts: {
          membershipGrowth: membershipGrowthAgg.map(m => ({ label: `${m._id.month}/${m._id.year}`, count: m.count })),
          monthlyRevenue: revenueAgg.map(r => ({ label: `${r._id.month}/${r._id.year}`, total: r.total })),
          attendanceTrend: attendanceTrendAgg.map(a => ({ label: `${a._id.day}/${a._id.month}`, count: a.count })),
          planDistribution
        }
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching dashboard data.' });
  }
};
