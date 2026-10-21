const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:paymentId', receiptController.getReceipt);

module.exports = router;
