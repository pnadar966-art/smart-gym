const express = require('express');
const router = express.Router();
const fitnessProgressController = require('../controllers/fitnessProgressController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', fitnessProgressController.getProgress);
router.post('/', fitnessProgressController.addProgress);
router.delete('/:id', fitnessProgressController.deleteProgress);

module.exports = router;
