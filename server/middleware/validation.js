// Validation middleware for request data

function validateReport(req, res, next) {
  const { vehicle_number, inspection_date, inspector_name } = req.body;
  
  const errors = [];
  
  if (!vehicle_number || vehicle_number.trim() === '') {
    errors.push('Vehicle number is required');
  }
  
  if (!inspection_date) {
    errors.push('Inspection date is required');
  } else {
    const date = new Date(inspection_date);
    if (isNaN(date.getTime())) {
      errors.push('Invalid inspection date');
    }
    if (date > new Date()) {
      errors.push('Inspection date cannot be in the future');
    }
  }
  
  if (!inspector_name || inspector_name.trim() === '') {
    errors.push('Inspector name is required');
  }
  
  // Validate numeric fields if provided
  const numericFields = ['year', 'mileage', 'last_mileage_serviced', 'hour_meter', 'hours_pto'];
  numericFields.forEach(field => {
    if (req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== '') {
      const value = Number(req.body[field]);
      if (isNaN(value) || value < 0) {
        errors.push(`${field} must be a positive number`);
      }
    }
  });
  
  // Validate tire pressure values
  const tirePressureFields = [
    'tire_pressure_rf', 'tire_pressure_rr', 'tire_pressure_rr_outer',
    'tire_pressure_lf', 'tire_pressure_lr', 'tire_pressure_lr_outer'
  ];
  tirePressureFields.forEach(field => {
    if (req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== '') {
      const value = Number(req.body[field]);
      if (isNaN(value) || value < 0 || value > 200) {
        errors.push(`${field} must be between 0 and 200 PSI`);
      }
    }
  });
  
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  
  next();
}

function validateQueryParams(req, res, next) {
  const { page, limit } = req.query;
  
  if (page !== undefined) {
    const pageNum = Number(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'Invalid page number' });
    }
  }
  
  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      return res.status(400).json({ error: 'Invalid limit (must be between 1 and 1000)' });
    }
  }
  
  next();
}

module.exports = {
  validateReport,
  validateQueryParams
};

