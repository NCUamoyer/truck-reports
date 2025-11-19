const express = require('express');
const router = express.Router();
const reportService = require('../services/reportService');
const { validateReport, validateQueryParams } = require('../middleware/validation');

// Get all reports with filtering and pagination
router.get('/', validateQueryParams, (req, res, next) => {
  try {
    const result = reportService.getAllReports(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get statistics
router.get('/statistics', (req, res, next) => {
  try {
    const stats = reportService.getStatistics();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Get single report
router.get('/:id', (req, res, next) => {
  try {
    const report = reportService.getReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    next(error);
  }
});

// Create new report
router.post('/', validateReport, (req, res, next) => {
  try {
    const report = reportService.createReport(req.body);
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
});

// Update report
router.put('/:id', validateReport, (req, res, next) => {
  try {
    const report = reportService.updateReport(req.params.id, req.body);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    next(error);
  }
});

// Delete report
router.delete('/:id', (req, res, next) => {
  try {
    const success = reportService.deleteReport(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

