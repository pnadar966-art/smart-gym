const express = require('express');
const router = express.Router();
const trainerController = require('../controllers/trainerController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', trainerController.getTrainers);
router.get('/:id', trainerController.getTrainerById);
router.post('/', trainerController.createTrainer);
router.put('/:id', trainerController.updateTrainer);
router.delete('/:id', trainerController.deleteTrainer);

module.exports = router;
