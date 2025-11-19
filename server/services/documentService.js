const db = require('../database/db');
const fs = require('fs');
const path = require('path');

class DocumentService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads');
    this.ensureUploadDirectory();
  }

  // Ensure upload directory structure exists
  ensureUploadDirectory() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    
    const vehiclesDir = path.join(this.uploadDir, 'vehicles');
    if (!fs.existsSync(vehiclesDir)) {
      fs.mkdirSync(vehiclesDir, { recursive: true });
    }
  }

  // Ensure vehicle-specific directories exist
  ensureVehicleDirectories(vehicleId) {
    const vehicleDir = path.join(this.uploadDir, 'vehicles', vehicleId.toString());
    
    const categories = ['service', 'invoice', 'oil_test', 'inspection', 'photo', 'other'];
    
    if (!fs.existsSync(vehicleDir)) {
      fs.mkdirSync(vehicleDir, { recursive: true });
    }
    
    categories.forEach(category => {
      const categoryDir = path.join(vehicleDir, category);
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
      }
    });
    
    return vehicleDir;
  }

  // Save uploaded file
  saveFile(vehicleId, category, file) {
    this.ensureVehicleDirectories(vehicleId);
    
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    const relativePath = path.join('vehicles', vehicleId.toString(), category, fileName);
    const fullPath = path.join(this.uploadDir, relativePath);
    
    // Move the file
    fs.renameSync(file.path, fullPath);
    
    return {
      fileName: file.originalname,
      filePath: relativePath,
      fileSize: file.size,
      fileType: file.mimetype
    };
  }

  // Create document record
  createDocument(documentData) {
    const fields = [
      'vehicle_id', 'category', 'title', 'description', 'file_name',
      'file_path', 'file_size', 'file_type', 'uploaded_by', 'document_date',
      'cost', 'vendor', 'tags', 'metadata'
    ];
    
    const values = fields.map(field => documentData[field] ?? null);
    const placeholders = fields.map(() => '?').join(', ');
    
    const stmt = db.prepare(`
      INSERT INTO documents (${fields.join(', ')})
      VALUES (${placeholders})
    `);
    
    const result = stmt.run(...values);
    
    return this.getDocumentById(result.lastInsertRowid);
  }

  // Get document by ID
  getDocumentById(id) {
    const stmt = db.prepare('SELECT * FROM documents WHERE id = ?');
    return stmt.get(id);
  }

  // Get all documents for a vehicle
  getVehicleDocuments(vehicleId, filters = {}) {
    const { category, search, sortBy = 'upload_date', order = 'DESC' } = filters;
    
    let whereClauses = ['vehicle_id = ?'];
    let params = [vehicleId];
    
    if (category) {
      whereClauses.push('category = ?');
      params.push(category);
    }
    
    if (search) {
      whereClauses.push('(title LIKE ? OR description LIKE ? OR file_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    const whereSQL = whereClauses.join(' AND ');
    
    // Validate sort column
    const validSortColumns = ['upload_date', 'document_date', 'title', 'category', 'file_size'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'upload_date';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    const stmt = db.prepare(`
      SELECT * FROM documents 
      WHERE ${whereSQL}
      ORDER BY ${sortColumn} ${sortOrder}
    `);
    
    return stmt.all(...params);
  }

  // Update document metadata
  updateDocument(id, documentData) {
    const allowedFields = [
      'title', 'description', 'category', 'document_date',
      'cost', 'vendor', 'tags', 'metadata'
    ];
    
    const updates = [];
    const values = [];
    
    allowedFields.forEach(field => {
      if (documentData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(documentData[field] ?? null);
      }
    });
    
    if (updates.length === 0) {
      throw new Error('No fields to update');
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const stmt = db.prepare(`
      UPDATE documents 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);
    
    stmt.run(...values);
    
    return this.getDocumentById(id);
  }

  // Delete document (file and record)
  deleteDocument(id) {
    const document = this.getDocumentById(id);
    if (!document) return false;
    
    // Delete file from filesystem
    const fullPath = path.join(this.uploadDir, document.file_path);
    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      // Continue to delete database record even if file deletion fails
    }
    
    // Delete database record
    const stmt = db.prepare('DELETE FROM documents WHERE id = ?');
    const result = stmt.run(id);
    
    return result.changes > 0;
  }

  // Get document file path for download
  getDocumentPath(id) {
    const document = this.getDocumentById(id);
    if (!document) return null;
    
    const fullPath = path.join(this.uploadDir, document.file_path);
    
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    
    return {
      path: fullPath,
      fileName: document.file_name,
      fileType: document.file_type
    };
  }

  // Get document statistics for a vehicle
  getVehicleDocumentStats(vehicleId) {
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM documents WHERE vehicle_id = ?').get(vehicleId);
    
    const byCategory = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM documents 
      WHERE vehicle_id = ? 
      GROUP BY category
    `).all(vehicleId);
    
    const totalSize = db.prepare(`
      SELECT SUM(file_size) as size 
      FROM documents 
      WHERE vehicle_id = ?
    `).get(vehicleId);
    
    return {
      totalCount: totalCount.count,
      byCategory: byCategory.reduce((acc, item) => {
        acc[item.category] = item.count;
        return acc;
      }, {}),
      totalSize: totalSize.size || 0
    };
  }

  // Create vehicle note
  createNote(noteData) {
    const fields = ['vehicle_id', 'note_type', 'title', 'content', 'created_by'];
    const values = fields.map(field => noteData[field] ?? null);
    const placeholders = fields.map(() => '?').join(', ');
    
    const stmt = db.prepare(`
      INSERT INTO vehicle_notes (${fields.join(', ')})
      VALUES (${placeholders})
    `);
    
    const result = stmt.run(...values);
    return this.getNoteById(result.lastInsertRowid);
  }

  // Get note by ID
  getNoteById(id) {
    const stmt = db.prepare('SELECT * FROM vehicle_notes WHERE id = ?');
    return stmt.get(id);
  }

  // Get all notes for a vehicle
  getVehicleNotes(vehicleId, filters = {}) {
    const { noteType, sortBy = 'created_at', order = 'DESC' } = filters;
    
    let whereClauses = ['vehicle_id = ?'];
    let params = [vehicleId];
    
    if (noteType) {
      whereClauses.push('note_type = ?');
      params.push(noteType);
    }
    
    const whereSQL = whereClauses.join(' AND ');
    
    const validSortColumns = ['created_at', 'updated_at', 'title'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    const stmt = db.prepare(`
      SELECT * FROM vehicle_notes 
      WHERE ${whereSQL}
      ORDER BY ${sortColumn} ${sortOrder}
    `);
    
    return stmt.all(...params);
  }

  // Update note
  updateNote(id, noteData) {
    const allowedFields = ['note_type', 'title', 'content'];
    const updates = [];
    const values = [];
    
    allowedFields.forEach(field => {
      if (noteData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(noteData[field] ?? null);
      }
    });
    
    if (updates.length === 0) {
      throw new Error('No fields to update');
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const stmt = db.prepare(`
      UPDATE vehicle_notes 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);
    
    stmt.run(...values);
    return this.getNoteById(id);
  }

  // Delete note
  deleteNote(id) {
    const stmt = db.prepare('DELETE FROM vehicle_notes WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Create maintenance schedule item
  createMaintenance(maintenanceData) {
    const fields = [
      'vehicle_id', 'maintenance_type', 'interval_miles', 'interval_days',
      'last_service_date', 'last_service_mileage', 'next_due_date',
      'next_due_mileage', 'status', 'notes'
    ];
    
    const values = fields.map(field => maintenanceData[field] ?? null);
    const placeholders = fields.map(() => '?').join(', ');
    
    const stmt = db.prepare(`
      INSERT INTO maintenance_schedule (${fields.join(', ')})
      VALUES (${placeholders})
    `);
    
    const result = stmt.run(...values);
    return this.getMaintenanceById(result.lastInsertRowid);
  }

  // Get maintenance by ID
  getMaintenanceById(id) {
    const stmt = db.prepare('SELECT * FROM maintenance_schedule WHERE id = ?');
    return stmt.get(id);
  }

  // Get all maintenance for a vehicle
  getVehicleMaintenance(vehicleId, filters = {}) {
    const { status, sortBy = 'next_due_date', order = 'ASC' } = filters;
    
    let whereClauses = ['vehicle_id = ?'];
    let params = [vehicleId];
    
    if (status) {
      whereClauses.push('status = ?');
      params.push(status);
    }
    
    const whereSQL = whereClauses.join(' AND ');
    
    const validSortColumns = ['next_due_date', 'next_due_mileage', 'last_service_date'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'next_due_date';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    const stmt = db.prepare(`
      SELECT * FROM maintenance_schedule 
      WHERE ${whereSQL}
      ORDER BY ${sortColumn} ${sortOrder}
    `);
    
    return stmt.all(...params);
  }

  // Update maintenance
  updateMaintenance(id, maintenanceData) {
    const allowedFields = [
      'maintenance_type', 'interval_miles', 'interval_days',
      'last_service_date', 'last_service_mileage', 'next_due_date',
      'next_due_mileage', 'status', 'notes'
    ];
    
    const updates = [];
    const values = [];
    
    allowedFields.forEach(field => {
      if (maintenanceData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(maintenanceData[field] ?? null);
      }
    });
    
    if (updates.length === 0) {
      throw new Error('No fields to update');
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const stmt = db.prepare(`
      UPDATE maintenance_schedule 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);
    
    stmt.run(...values);
    return this.getMaintenanceById(id);
  }
}

module.exports = new DocumentService();

