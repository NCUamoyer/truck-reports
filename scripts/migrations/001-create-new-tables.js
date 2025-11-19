const db = require('../../server/database/db');

console.log('[Migration 001] Creating new tables for Vehicle Management Suite...');

try {
  // 1. Create documents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('service', 'invoice', 'oil_test', 'inspection', 'photo', 'other')),
      title TEXT NOT NULL,
      description TEXT,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      file_type TEXT,
      uploaded_by TEXT,
      upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      document_date DATE,
      cost REAL,
      vendor TEXT,
      tags TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ Created documents table');

  // Create indexes for documents
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_documents_vehicle_id ON documents(vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
    CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date);
  `);
  console.log('✓ Created indexes for documents table');

  // 2. Create vehicle_notes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS vehicle_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      note_type TEXT NOT NULL CHECK(note_type IN ('general', 'maintenance', 'incident', 'assignment')),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ Created vehicle_notes table');

  // Create index for notes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_vehicle_notes_vehicle_id ON vehicle_notes(vehicle_id);
  `);
  console.log('✓ Created indexes for vehicle_notes table');

  // 3. Create maintenance_schedule table
  db.exec(`
    CREATE TABLE IF NOT EXISTS maintenance_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      maintenance_type TEXT NOT NULL,
      interval_miles INTEGER,
      interval_days INTEGER,
      last_service_date DATE,
      last_service_mileage INTEGER,
      next_due_date DATE,
      next_due_mileage INTEGER,
      status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'due', 'overdue', 'completed')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ Created maintenance_schedule table');

  // Create indexes for maintenance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON maintenance_schedule(vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_schedule(status);
  `);
  console.log('✓ Created indexes for maintenance_schedule table');

  // 4. Create vehicle_status_history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS vehicle_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('active', 'maintenance', 'out_of_service', 'sold', 'retired')),
      reason TEXT,
      changed_by TEXT,
      effective_date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ Created vehicle_status_history table');

  // Create index for status history
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_status_history_vehicle_id ON vehicle_status_history(vehicle_id);
  `);
  console.log('✓ Created indexes for vehicle_status_history table');

  console.log('\n[Migration 001] ✅ All tables created successfully!');
  
  // Show table counts
  const tableNames = ['documents', 'vehicle_notes', 'maintenance_schedule', 'vehicle_status_history'];
  console.log('\nTable verification:');
  tableNames.forEach(tableName => {
    const result = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
    console.log(`  - ${tableName}: ${result.count} rows`);
  });

} catch (error) {
  console.error('[Migration 001] ❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}

