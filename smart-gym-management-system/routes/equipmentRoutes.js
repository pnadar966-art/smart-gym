const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', equipmentController.getEquipment);
router.get('/maintenance-alerts', equipmentController.getMaintenanceAlerts);
router.get('/:id', equipmentController.getEquipmentById);
router.post('/', equipmentController.createEquipment);
router.put('/:id', equipmentController.updateEquipment);
router.delete('/:id', equipmentController.deleteEquipment);

module.exports = router;
