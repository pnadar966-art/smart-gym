const Payment = require('../models/Payment');
const Member = require('../models/Member');

function generateTransactionId() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TXN${timestamp}${random}`;
}

async function generateReceiptNumber() {
  const count = await Payment.countDocuments();
  return `RCPT-${String(count + 1).padStart(5, '0')}`;
}

// GET /api/payments (supports ?search= & ?method= & ?status= & ?from= & ?to= & ?member=)
exports.getPayments = async (req, res) => {
  try {
    const { search, method, status, from, to, member } = req.query;
    let filter = {};

    if (method) filter.paymentMethod = method;
    if (status) filter.paymentStatus = status;
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

    let payments = await Payment.find(filter)
      .populate('member', 'fullName email phone photoUrl')
      .populate('membershipPlan', 'planName price')
      .sort({ paymentDate: -1 });

    if (search) {
      const regex = new RegExp(search, 'i');
      payments = payments.filter(p =>
        (p.member && regex.test(p.member.fullName)) ||
        regex.test(p.transactionId) ||
        regex.test(p.receiptNumber)
      );
    }

    return res.status(200).json({ success: true, data: payments });
  } catch (err) {
    console.error('Get payments error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching payments.' });
  }
};

// GET /api/payments/:id
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('member').populate('membershipPlan');
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }
    return res.status(200).json({ success: true, data: payment });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching payment.' });
  }
};

// POST /api/payments
exports.createPayment = async (req, res) => {
  try {
    const { member, membershipPlan, amount, paymentDate, paymentMethod, paymentStatus } = req.body;

    if (!member || !membershipPlan || amount === undefined || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Member, plan, amount and payment method are required.' });
    }

    const memberExists = await Member.findById(member);
    if (!memberExists) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const transactionId = generateTransactionId();
    const receiptNumber = await generateReceiptNumber();

    const payment = new Payment({
      member, membershipPlan, amount,
      paymentDate: paymentDate || Date.now(),
      paymentMethod,
      paymentStatus: paymentStatus || 'Paid',
      transactionId, receiptNumber
    });

    await payment.save();

    const populatedPayment = await Payment.findById(payment._id)
      .populate('member', 'fullName email phone photoUrl')
      .populate('membershipPlan', 'planName price');

    return res.status(201).json({
      success: true,
      message: 'Payment recorded successfully. Receipt generated.',
      data: populatedPayment
    });
  } catch (err) {
    console.error('Create payment error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Error recording payment.' });
  }
};

// PUT /api/payments/:id
exports.updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('member', 'fullName email phone photoUrl')
      .populate('membershipPlan', 'planName price');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }

    return res.status(200).json({ success: true, message: 'Payment updated successfully.', data: payment });
  } catch (err) {
    console.error('Update payment error:', err);
    return res.status(500).json({ success: false, message: 'Error updating payment.' });
  }
};

// DELETE /api/payments/:id
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }
    return res.status(200).json({ success: true, message: 'Payment deleted successfully.' });
  } catch (err) {
    console.error('Delete payment error:', err);
    return res.status(500).json({ success: false, message: 'Error deleting payment.' });
  }
};
