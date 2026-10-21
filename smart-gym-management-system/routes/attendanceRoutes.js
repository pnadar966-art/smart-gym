const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', attendanceController.getAttendance);
router.get('/percentage/:memberId', attendanceController.getAttendancePercentage);
router.post('/', attendanceController.markAttendance);
router.put('/:id/checkout', attendanceController.checkOut);
router.delete('/:id', attendanceController.deleteAttendance);

module.exports = router;
