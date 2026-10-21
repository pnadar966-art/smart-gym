const Attendance = require('../models/Attendance');
const Member = require('../models/Member');

// GET /api/attendance (supports ?date= & ?member= & ?status= & ?from= & ?to=)
exports.getAttendance = async (req, res) => {
  try {
    const { date, member, status, from, to } = req.query;
    let filter = {};

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    } else if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.date.$lte = toDate;
      }
    }

    if (member) filter.member = member;
    if (status) filter.status = status;

    const records = await Attendance.find(filter)
      .populate('member', 'fullName email phone photoUrl')
      .sort({ date: -1, createdAt: -1 });

    return res.status(200).json({ success: true, data: records });
  } catch (err) {
    console.error('Get attendance error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching attendance.' });
  }
};

// GET /api/attendance/percentage/:memberId - attendance percentage for a member
exports.getAttendancePercentage = async (req, res) => {
  try {
    const memberId = req.params.memberId;
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const totalDaysSinceJoining = Math.max(1, Math.ceil((Date.now() - new Date(member.joiningDate)) / (1000 * 60 * 60 * 24)));
    const presentCount = await Attendance.countDocuments({ member: memberId, status: 'Present' });
    const percentage = Math.min(100, Math.round((presentCount / totalDaysSinceJoining) * 100));

    return res.status(200).json({ success: true, data: { presentCount, totalDaysSinceJoining, percentage } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error calculating attendance percentage.' });
  }
};

// POST /api/attendance (Mark attendance / Check-in)
exports.markAttendance = async (req, res) => {
  try {
    const { member, date, checkInTime, status } = req.body;

    if (!member) {
      return res.status(400).json({ success: false, message: 'Member is required.' });
    }

    const attendance = new Attendance({
      member,
      date: date || Date.now(),
      checkInTime: checkInTime || Date.now(),
      status: status || 'Present'
    });

    await attendance.save();
    const populated = await attendance.populate('member', 'fullName email phone photoUrl');

    return res.status(201).json({ success: true, message: 'Attendance marked successfully.', data: populated });
  } catch (err) {
    console.error('Mark attendance error:', err);
    return res.status(500).json({ success: false, message: 'Error marking attendance.' });
  }
};

// PUT /api/attendance/:id/checkout
exports.checkOut = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { checkOutTime: Date.now() },
      { new: true }
    ).populate('member', 'fullName email phone photoUrl');

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    return res.status(200).json({ success: true, message: 'Check-out recorded successfully.', data: attendance });
  } catch (err) {
    console.error('Check-out error:', err);
    return res.status(500).json({ success: false, message: 'Error recording check-out.' });
  }
};

// DELETE /api/attendance/:id
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }
    return res.status(200).json({ success: true, message: 'Attendance record deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error deleting attendance record.' });
  }
};
