const db = require('../../server/database/db');

console.log('[Migration 002] Enhancing vehicles table with new columns...');

try {
  // Check which columns already exist
  const tableInfo = db.prepare("PRAGMA table_info(vehicles)").all();
  const existingColumns = tableInfo.map(col => col.name);

  const columnsToAdd = [
    { name: 'status', type: 'TEXT', default: "'active'" },
    { name: 'assigned_to', type: 'TEXT', default: 'NULL' },
    { name: 'location', type: 'TEXT', default: 'NULL' },
    { name: 'acquisition_date', type: 'DATE', default: 'NULL' },
    { name: 'acquisition_cost', type: 'REAL', default: 'NULL' },
    { name: 'current_mileage', type: 'INTEGER', default: 'NULL' },
    { name: 'last_service_date', type: 'DATE', default: 'NULL' },
    { name: 'notes', type: 'TEXT', default: 'NULL' },
    { name: 'thumbnail_path', type: 'TEXT', default: 'NULL' }
  ];

  let addedCount = 0;
  let skippedCount = 0;

  columnsToAdd.forEach(column => {
    if (existingColumns.includes(column.name)) {
      console.log(`⊘ Column '${column.name}' already exists, skipping`);
      skippedCount++;
    } else {
      try {
        db.exec(`ALTER TABLE vehicles ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.default}`);
        console.log(`✓ Added column '${column.name}' (${column.type})`);
        addedCount++;
      } catch (error) {
        if (error.message.includes('duplicate column name')) {
          console.log(`⊘ Column '${column.name}' already exists, skipping`);
          skippedCount++;
        } else {
          throw error;
        }
      }
    }
  });

  console.log(`\n[Migration 002] ✅ Enhanced vehicles table!`);
  console.log(`  - Added: ${addedCount} columns`);
  console.log(`  - Skipped: ${skippedCount} columns (already existed)`);

  // Initialize status for existing vehicles
  const updateResult = db.prepare("UPDATE vehicles SET status = 'active' WHERE status IS NULL").run();
  if (updateResult.changes > 0) {
    console.log(`  - Updated ${updateResult.changes} vehicles with default 'active' status`);
  }

  // Show updated table structure
  console.log('\nCurrent vehicles table structure:');
  const updatedTableInfo = db.prepare("PRAGMA table_info(vehicles)").all();
  updatedTableInfo.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });

  // Show sample data
  console.log('\nSample vehicle data:');
  const sample = db.prepare('SELECT id, vehicle_number, make, year, status, location FROM vehicles LIMIT 3').all();
  sample.forEach(v => {
    console.log(`  ${v.vehicle_number}: ${v.year || 'N/A'} ${v.make || ''} - Status: ${v.status || 'N/A'}`);
  });

} catch (error) {
  console.error('[Migration 002] ❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}

