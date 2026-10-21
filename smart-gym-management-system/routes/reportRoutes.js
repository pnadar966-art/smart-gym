const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/members', reportController.memberReport);
router.get('/trainers', reportController.trainerReport);
router.get('/membership', reportController.membershipReport);
router.get('/attendance', reportController.attendanceReport);
router.get('/payments', reportController.paymentReport);
router.get('/revenue', reportController.revenueReport);
router.get('/equipment', reportController.equipmentReport);
router.get('/maintenance', reportController.maintenanceReport);
router.get('/fitness-progress', reportController.fitnessProgressReport);

module.exports = router;
