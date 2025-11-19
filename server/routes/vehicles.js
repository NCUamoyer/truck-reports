const express = require('express');
const router = express.Router();
const reportService = require('../services/reportService');

// Get all vehicles with pagination, filtering, and sorting
router.get('/', (req, res, next) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 100,
      sortBy: req.query.sortBy || 'vehicle_number',
      order: req.query.order || 'ASC',
      status: req.query.status,
      location: req.query.location,
      search: req.query.search
    };
    
    const result = reportService.getAllVehicles(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get vehicle by ID
router.get('/:id', (req, res, next) => {
  try {
    const vehicle = reportService.getVehicleById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

// Get vehicle summary (for modal)
router.get('/:id/summary', (req, res, next) => {
  try {
    const summary = reportService.getVehicleSummary(req.params.id);
    if (!summary) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

// Get vehicle reports
router.get('/:id/reports', (req, res, next) => {
  try {
    const vehicle = reportService.getVehicleById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    const reports = reportService.getVehicleReports(vehicle.vehicle_number);
    res.json(reports);
  } catch (error) {
    next(error);
  }
});

// Get vehicle timeline
router.get('/:id/timeline', (req, res, next) => {
  try {
    const timeline = reportService.getVehicleTimeline(req.params.id);
    res.json(timeline);
  } catch (error) {
    next(error);
  }
});

// Update vehicle
router.put('/:id', (req, res, next) => {
  try {
    const vehicle = reportService.updateVehicle(req.params.id, req.body);
    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

// Delete vehicle (soft delete)
router.delete('/:id', (req, res, next) => {
  try {
    const success = reportService.deleteVehicle(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json({ message: 'Vehicle retired successfully' });
  } catch (error) {
    next(error);
  }
});

// Permanently delete vehicle (hard delete)
router.delete('/:id/permanent', (req, res, next) => {
  try {
    const success = reportService.permanentlyDeleteVehicle(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json({ message: 'Vehicle permanently deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Create or update vehicle (legacy endpoint for backward compatibility)
router.post('/', (req, res, next) => {
  try {
    const { vehicle_number, make, year } = req.body;
    
    if (!vehicle_number) {
      return res.status(400).json({ error: 'Vehicle number is required' });
    }
    
    reportService.upsertVehicle({ vehicle_number, make, year });
    const vehicle = reportService.getVehicleByNumber(vehicle_number);
    
    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

