const Payment = require('../models/Payment');

// GET /api/receipts/:paymentId - receipt data derived directly from the Payment document
exports.getReceipt = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate('member')
      .populate('membershipPlan');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment/receipt not found.' });
    }

    return res.status(200).json({ success: true, data: payment });
  } catch (err) {
    console.error('Get receipt error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching receipt.' });
  }
};
