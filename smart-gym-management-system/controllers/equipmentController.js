const Equipment = require('../models/Equipment');

// GET /api/equipment (supports ?search= & ?status= & ?category=)
exports.getEquipment = async (req, res) => {
  try {
    const { search, status, category } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;

    if (search) {
      filter.$or = [
        { equipmentName: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const equipment = await Equipment.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: equipment });
  } catch (err) {
    console.error('Get equipment error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching equipment.' });
  }
};

// GET /api/equipment/maintenance-alerts - items needing maintenance within 7 days or overdue
exports.getMaintenanceAlerts = async (req, res) => {
  try {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const alerts = await Equipment.find({
      $or: [
        { status: 'Maintenance Required' },
        { status: 'Damaged' },
        { nextMaintenanceDate: { $lte: sevenDaysFromNow } }
      ]
    }).sort({ nextMaintenanceDate: 1 });

    return res.status(200).json({ success: true, data: alerts, count: alerts.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching maintenance alerts.' });
  }
};

// GET /api/equipment/:id
exports.getEquipmentById = async (req, res) => {
  try {
    const item = await Equipment.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Equipment not found.' });
    }
    return res.status(200).json({ success: true, data: item });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching equipment.' });
  }
};

// POST /api/equipment
exports.createEquipment = async (req, res) => {
  try {
    const {
      equipmentName, imageUrl, category, quantity, purchaseDate, purchasePrice,
      condition, status, lastMaintenanceDate, nextMaintenanceDate
    } = req.body;

    if (!equipmentName || !category || !purchaseDate || purchasePrice === undefined) {
      return res.status(400).json({ success: false, message: 'Equipment name, category, purchase date and price are required.' });
    }

    const categoryImageMap = {
      'Cardio': 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400',
      'Strength': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
      'Free Weights': 'https://images.unsplash.com/photo-1584735175315-9d5df23860e6?w=400',
      'Other': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400'
    };

    const equipment = new Equipment({
      equipmentName,
      imageUrl: imageUrl || categoryImageMap[category] || categoryImageMap['Other'],
      category,
      quantity: quantity || 1,
      purchaseDate,
      purchasePrice,
      condition: condition || 'Good',
      status: status || 'Available',
      lastMaintenanceDate: lastMaintenanceDate || null,
      nextMaintenanceDate: nextMaintenanceDate || null
    });

    await equipment.save();
    return res.status(201).json({ success: true, message: 'Equipment added successfully.', data: equipment });
  } catch (err) {
    console.error('Create equipment error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Error creating equipment.' });
  }
};

// PUT /api/equipment/:id
exports.updateEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found.' });
    }
    return res.status(200).json({ success: true, message: 'Equipment updated successfully.', data: equipment });
  } catch (err) {
    console.error('Update equipment error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Error updating equipment.' });
  }
};

// DELETE /api/equipment/:id
exports.deleteEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndDelete(req.params.id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found.' });
    }
    return res.status(200).json({ success: true, message: 'Equipment deleted successfully.' });
  } catch (err) {
    console.error('Delete equipment error:', err);
    return res.status(500).json({ success: false, message: 'Error deleting equipment.' });
  }
};
