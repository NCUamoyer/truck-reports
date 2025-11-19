const db = require('../database/db');

class ReportService {
  // Get all reports with optional filtering and pagination
  getAllReports(filters = {}) {
    const {
      page = 1,
      limit = 25,
      sortBy = 'inspection_date',
      order = 'DESC',
      vehicle,
      inspector,
      dateFrom,
      dateTo,
      search
    } = filters;
    
    const offset = (page - 1) * limit;
    let whereClauses = [];
    let params = [];
    
    // Apply filters
    if (vehicle) {
      whereClauses.push('vehicle_number LIKE ?');
      params.push(`%${vehicle}%`);
    }
    
    if (inspector) {
      whereClauses.push('inspector_name LIKE ?');
      params.push(`%${inspector}%`);
    }
    
    if (dateFrom) {
      whereClauses.push('inspection_date >= ?');
      params.push(dateFrom);
    }
    
    if (dateTo) {
      whereClauses.push('inspection_date <= ?');
      params.push(dateTo);
    }
    
    if (search) {
      whereClauses.push('(vehicle_number LIKE ? OR inspector_name LIKE ? OR defects LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
    
    // Validate sort column to prevent SQL injection
    const validSortColumns = [
      'id', 'vehicle_number', 'inspection_date', 'inspector_name', 
      'mileage', 'created_at'
    ];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'inspection_date';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    // Get total count
    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM reports ${whereSQL}`);
    const { count: total } = countStmt.get(...params);
    
    // Get paginated results
    const stmt = db.prepare(`
      SELECT * FROM reports 
      ${whereSQL}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `);
    
    const reports = stmt.all(...params, limit, offset);
    
    return {
      reports,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  // Get single report by ID
  getReportById(id) {
    const stmt = db.prepare('SELECT * FROM reports WHERE id = ?');
    return stmt.get(id);
  }
  
  // Create new report
  createReport(reportData) {
    // IMPORTANT: Create or update vehicle entry FIRST to satisfy foreign key constraint
    this.upsertVehicle({
      vehicle_number: reportData.vehicle_number,
      make: reportData.make,
      year: reportData.year
    });
    
    const fields = [
      'vehicle_number', 'inspection_date', 'inspector_name',
      'make', 'year', 'mileage', 'last_mileage_serviced', 'hour_meter', 'hours_pto',
      'steering_good', 'brakes_work', 'parking_brake_work',
      'headlights_working', 'parking_lights_working', 'taillights_working',
      'backup_lights_working', 'signal_devices_good', 'auxiliary_lights_working',
      'windshield_condition', 'windshield_wiper_working', 'tires_safe',
      'flags_flares_present', 'first_aid_kit_stocked', 'aed_location',
      'fire_extinguisher_condition', 'tire_pressure_rf', 'tire_pressure_rr',
      'tire_pressure_rr_outer', 'tire_pressure_lf', 'tire_pressure_lr',
      'tire_pressure_lr_outer', 'defects', 'signature'
    ];
    
    const values = fields.map(field => reportData[field] ?? null);
    const placeholders = fields.map(() => '?').join(', ');
    
    const stmt = db.prepare(`
      INSERT INTO reports (${fields.join(', ')})
      VALUES (${placeholders})
    `);
    
    const result = stmt.run(...values);
    
    return this.getReportById(result.lastInsertRowid);
  }
  
  // Update existing report
  updateReport(id, reportData) {
    const fields = [
      'vehicle_number', 'inspection_date', 'inspector_name',
      'make', 'year', 'mileage', 'last_mileage_serviced', 'hour_meter', 'hours_pto',
      'steering_good', 'brakes_work', 'parking_brake_work',
      'headlights_working', 'parking_lights_working', 'taillights_working',
      'backup_lights_working', 'signal_devices_good', 'auxiliary_lights_working',
      'windshield_condition', 'windshield_wiper_working', 'tires_safe',
      'flags_flares_present', 'first_aid_kit_stocked', 'aed_location',
      'fire_extinguisher_condition', 'tire_pressure_rf', 'tire_pressure_rr',
      'tire_pressure_rr_outer', 'tire_pressure_lf', 'tire_pressure_lr',
      'tire_pressure_lr_outer', 'defects', 'signature'
    ];
    
    const updates = [];
    const values = [];
    
    fields.forEach(field => {
      if (reportData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(reportData[field] ?? null);
      }
    });
    
    if (updates.length === 0) {
      throw new Error('No fields to update');
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const stmt = db.prepare(`
      UPDATE reports 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);
    
    stmt.run(...values);
    
    // Update vehicle info if provided
    if (reportData.vehicle_number) {
      this.upsertVehicle({
        vehicle_number: reportData.vehicle_number,
        make: reportData.make,
        year: reportData.year
      });
    }
    
    return this.getReportById(id);
  }
  
  // Delete report
  deleteReport(id) {
    const stmt = db.prepare('DELETE FROM reports WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
  
  // Upsert vehicle (update if exists, insert if not)
  upsertVehicle(vehicleData) {
    if (!vehicleData.vehicle_number) return;
    
    const stmt = db.prepare(`
      INSERT INTO vehicles (vehicle_number, make, year)
      VALUES (?, ?, ?)
      ON CONFLICT(vehicle_number) DO UPDATE SET
        make = COALESCE(excluded.make, vehicles.make),
        year = COALESCE(excluded.year, vehicles.year),
        updated_at = CURRENT_TIMESTAMP
    `);
    
    stmt.run(
      vehicleData.vehicle_number,
      vehicleData.make || null,
      vehicleData.year || null
    );
  }
  
  // Get all vehicles with filtering, search, and pagination
  getAllVehicles(filters = {}) {
    const {
      page = 1,
      limit = 100,
      sortBy = 'vehicle_number',
      order = 'ASC',
      status,
      location,
      search
    } = filters;
    
    const offset = (page - 1) * limit;
    let whereClauses = [];
    let params = [];
    
    // Apply filters
    if (status) {
      whereClauses.push('status = ?');
      params.push(status);
    }
    
    if (location) {
      whereClauses.push('location LIKE ?');
      params.push(`%${location}%`);
    }
    
    if (search) {
      whereClauses.push('(vehicle_number LIKE ? OR make LIKE ? OR model LIKE ? OR driver LIKE ? OR vin LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
    
    // Validate sort column
    const validSortColumns = [
      'id', 'vehicle_number', 'make', 'model', 'year', 'status', 
      'assigned_to', 'location', 'current_mileage', 'last_service_date'
    ];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'vehicle_number';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    // Special handling for vehicle_number to support natural/alphanumeric sorting
    let orderByClause;
    if (sortColumn === 'vehicle_number') {
      // Natural sort: handles both pure numbers (10, 100) and alphanumeric (T-10, T-100)
      // First sort by numeric value if the vehicle_number is purely numeric,
      // then by the full text to handle prefixes correctly
      orderByClause = `
        CASE 
          WHEN vehicle_number GLOB '[0-9]*' THEN 0 
          ELSE 1 
        END ${sortOrder},
        CASE 
          WHEN vehicle_number GLOB '[0-9]*' THEN CAST(vehicle_number AS INTEGER)
          ELSE 0
        END ${sortOrder},
        LENGTH(vehicle_number) ${sortOrder},
        vehicle_number ${sortOrder}
      `;
    } else {
      orderByClause = `${sortColumn} ${sortOrder}`;
    }
    
    // Get total count
    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM vehicles ${whereSQL}`);
    const { count: total } = countStmt.get(...params);
    
    // Get paginated results
    const stmt = db.prepare(`
      SELECT * FROM vehicles 
      ${whereSQL}
      ORDER BY ${orderByClause}
      LIMIT ? OFFSET ?
    `);
    
    const vehicles = stmt.all(...params, limit, offset);
    
    return {
      vehicles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  // Get vehicle by ID (not vehicle_number)
  getVehicleById(id) {
    const stmt = db.prepare('SELECT * FROM vehicles WHERE id = ?');
    return stmt.get(id);
  }
  
  // Get vehicle by number
  getVehicleByNumber(vehicleNumber) {
    const stmt = db.prepare('SELECT * FROM vehicles WHERE vehicle_number = ?');
    return stmt.get(vehicleNumber);
  }
  
  // Update vehicle information
  updateVehicle(id, vehicleData) {
    const allowedFields = [
      'vehicle_number', 'make', 'model', 'year', 'description', 'vin',
      'driver', 'license_plate', 'tonnage', 'fuel_type', 'has_radio',
      'service_station', 'sales_price', 'coverage', 'po_number', 'title_number',
      'status', 'assigned_to', 'location', 'acquisition_date', 
      'acquisition_cost', 'current_mileage', 'last_service_date', 'notes'
    ];
    
    const updates = [];
    const values = [];
    
    allowedFields.forEach(field => {
      if (vehicleData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(vehicleData[field] ?? null);
      }
    });
    
    if (updates.length === 0) {
      throw new Error('No fields to update');
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const stmt = db.prepare(`
      UPDATE vehicles 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);
    
    stmt.run(...values);
    
    return this.getVehicleById(id);
  }
  
  // Delete vehicle (soft delete by changing status)
  deleteVehicle(id) {
    const stmt = db.prepare("UPDATE vehicles SET status = 'retired', updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }
  
  // Permanently delete vehicle (hard delete - removes from database)
  permanentlyDeleteVehicle(id) {
    // Start a transaction to delete related records first
    const deleteDocuments = db.prepare('DELETE FROM documents WHERE vehicle_id = ?');
    const deleteNotes = db.prepare('DELETE FROM vehicle_notes WHERE vehicle_id = ?');
    const deleteMaintenance = db.prepare('DELETE FROM maintenance_schedule WHERE vehicle_id = ?');
    const deleteStatusHistory = db.prepare('DELETE FROM vehicle_status_history WHERE vehicle_id = ?');
    const deleteReports = db.prepare('DELETE FROM reports WHERE vehicle_number = (SELECT vehicle_number FROM vehicles WHERE id = ?)');
    const deleteVehicle = db.prepare('DELETE FROM vehicles WHERE id = ?');
    
    // Execute deletions in transaction
    const transaction = db.transaction(() => {
      deleteDocuments.run(id);
      deleteNotes.run(id);
      deleteMaintenance.run(id);
      deleteStatusHistory.run(id);
      deleteReports.run(id);
      const result = deleteVehicle.run(id);
      return result.changes > 0;
    });
    
    return transaction();
  }
  
  // Get vehicle summary for modal
  getVehicleSummary(id) {
    const vehicle = this.getVehicleById(id);
    if (!vehicle) return null;
    
    // Get reports count and recent reports
    const reportsCount = db.prepare('SELECT COUNT(*) as count FROM reports WHERE vehicle_number = ?').get(vehicle.vehicle_number);
    const recentReports = db.prepare(`
      SELECT id, inspection_date, inspector_name, mileage 
      FROM reports 
      WHERE vehicle_number = ? 
      ORDER BY inspection_date DESC 
      LIMIT 5
    `).all(vehicle.vehicle_number);
    
    // Get documents count by category (will implement later)
    const documentsCount = db.prepare('SELECT COUNT(*) as count FROM documents WHERE vehicle_id = ?').get(id);
    const documentsByCategory = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM documents 
      WHERE vehicle_id = ? 
      GROUP BY category
    `).all(id);
    
    // Get notes count (will implement later)
    const notesCount = db.prepare('SELECT COUNT(*) as count FROM vehicle_notes WHERE vehicle_id = ?').get(id);
    
    // Get maintenance items count (will implement later)
    const maintenanceCount = db.prepare('SELECT COUNT(*) as count FROM maintenance_schedule WHERE vehicle_id = ?').get(id);
    const overdueCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM maintenance_schedule 
      WHERE vehicle_id = ? AND status = 'overdue'
    `).get(id);
    
    return {
      ...vehicle,
      stats: {
        reportsCount: reportsCount.count,
        documentsCount: documentsCount.count,
        notesCount: notesCount.count,
        maintenanceCount: maintenanceCount.count,
        overdueMaintenanceCount: overdueCount.count
      },
      recentReports,
      documentsByCategory: documentsByCategory.reduce((acc, item) => {
        acc[item.category] = item.count;
        return acc;
      }, {})
    };
  }
  
  // Get vehicle reports
  getVehicleReports(vehicleNumber) {
    const stmt = db.prepare(`
      SELECT * FROM reports 
      WHERE vehicle_number = ? 
      ORDER BY inspection_date DESC
    `);
    return stmt.all(vehicleNumber);
  }
  
  // Get vehicle timeline (reports, documents, notes, status changes)
  getVehicleTimeline(id) {
    const vehicle = this.getVehicleById(id);
    if (!vehicle) return [];
    
    const timeline = [];
    
    // Get reports
    const reports = db.prepare(`
      SELECT id, inspection_date as date, inspector_name, 'report' as type, defects
      FROM reports 
      WHERE vehicle_number = ?
      ORDER BY inspection_date DESC
    `).all(vehicle.vehicle_number);
    timeline.push(...reports);
    
    // Get documents
    const documents = db.prepare(`
      SELECT id, upload_date as date, title, 'document' as type, category
      FROM documents 
      WHERE vehicle_id = ?
      ORDER BY upload_date DESC
    `).all(id);
    timeline.push(...documents);
    
    // Get notes
    const notes = db.prepare(`
      SELECT id, created_at as date, title, 'note' as type, note_type
      FROM vehicle_notes 
      WHERE vehicle_id = ?
      ORDER BY created_at DESC
    `).all(id);
    timeline.push(...notes);
    
    // Get status history
    const statusChanges = db.prepare(`
      SELECT id, effective_date as date, status, 'status_change' as type, reason
      FROM vehicle_status_history 
      WHERE vehicle_id = ?
      ORDER BY effective_date DESC
    `).all(id);
    timeline.push(...statusChanges);
    
    // Sort by date (most recent first)
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return timeline;
  }
  
  // Get statistics
  getStatistics() {
    const totalReports = db.prepare('SELECT COUNT(*) as count FROM reports').get();
    const totalVehicles = db.prepare('SELECT COUNT(*) as count FROM vehicles').get();
    const recentReports = db.prepare(`
      SELECT COUNT(*) as count FROM reports 
      WHERE inspection_date >= date('now', '-30 days')
    `).get();
    
    // Get vehicle status breakdown
    const statusBreakdown = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM vehicles 
      GROUP BY status
    `).all();
    
    return {
      totalReports: totalReports.count,
      totalVehicles: totalVehicles.count,
      reportsLast30Days: recentReports.count,
      vehiclesByStatus: statusBreakdown.reduce((acc, item) => {
        acc[item.status] = item.count;
        return acc;
      }, {})
    };
  }
}

module.exports = new ReportService();

