const express = require('express');
const router = express.Router();
const exportService = require('../services/exportService');

// Export single report as PDF
router.get('/report/:id/pdf', async (req, res, next) => {
  try {
    const pdfDoc = await exportService.exportReportPDF(req.params.id);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-${req.params.id}.pdf`);
    
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
});

// Export multiple reports as CSV
router.post('/reports/csv', async (req, res, next) => {
  try {
    const { reportIds } = req.body;
    const csv = await exportService.exportReportsCSV(reportIds);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=reports.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// Export all reports as CSV (GET endpoint for convenience)
router.get('/reports/csv', async (req, res, next) => {
  try {
    const csv = await exportService.exportReportsCSV();
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=all-reports.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

