const express = require('express');
const router = express.Router();
const workoutController = require('../controllers/workoutController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', workoutController.getWorkoutPlans);
router.get('/:id', workoutController.getWorkoutPlanById);
router.post('/', workoutController.createWorkoutPlan);
router.put('/:id', workoutController.updateWorkoutPlan);
router.delete('/:id', workoutController.deleteWorkoutPlan);

module.exports = router;
