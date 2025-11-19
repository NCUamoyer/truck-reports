const express = require('express');
const router = express.Router();
const documentService = require('../services/documentService');

// Create maintenance schedule item
router.post('/', (req, res, next) => {
  try {
    const {
      vehicle_id, maintenance_type, interval_miles, interval_days,
      last_service_date, last_service_mileage, next_due_date,
      next_due_mileage, status, notes
    } = req.body;
    
    if (!vehicle_id || !maintenance_type) {
      return res.status(400).json({ error: 'vehicle_id and maintenance_type are required' });
    }
    
    const maintenance = documentService.createMaintenance({
      vehicle_id: parseInt(vehicle_id),
      maintenance_type,
      interval_miles: interval_miles ? parseInt(interval_miles) : null,
      interval_days: interval_days ? parseInt(interval_days) : null,
      last_service_date: last_service_date || null,
      last_service_mileage: last_service_mileage ? parseInt(last_service_mileage) : null,
      next_due_date: next_due_date || null,
      next_due_mileage: next_due_mileage ? parseInt(next_due_mileage) : null,
      status: status || 'scheduled',
      notes: notes || null
    });
    
    res.status(201).json(maintenance);
  } catch (error) {
    next(error);
  }
});

// Get all maintenance for a vehicle
router.get('/vehicle/:vehicleId', (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      sortBy: req.query.sortBy || 'next_due_date',
      order: req.query.order || 'ASC'
    };
    
    const maintenance = documentService.getVehicleMaintenance(req.params.vehicleId, filters);
    res.json(maintenance);
  } catch (error) {
    next(error);
  }
});

// Get maintenance by ID
router.get('/:id', (req, res, next) => {
  try {
    const maintenance = documentService.getMaintenanceById(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ error: 'Maintenance item not found' });
    }
    res.json(maintenance);
  } catch (error) {
    next(error);
  }
});

// Update maintenance
router.put('/:id', (req, res, next) => {
  try {
    const maintenance = documentService.updateMaintenance(req.params.id, req.body);
    res.json(maintenance);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

