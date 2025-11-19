const db = require('../server/database/db');

console.log('[Migration] Adding new vehicle fields...');

try {
  // Add new columns to vehicles table based on Excel structure
  const columnsToAdd = [
    { name: 'description', type: 'TEXT' },
    { name: 'model', type: 'TEXT' },
    { name: 'vin', type: 'TEXT' },
    { name: 'driver', type: 'TEXT' },
    { name: 'license_plate', type: 'TEXT' },
    { name: 'tonnage', type: 'TEXT' },
    { name: 'fuel_type', type: 'TEXT' },
    { name: 'has_radio', type: 'TEXT' },
    { name: 'service_station', type: 'TEXT' },
    { name: 'sales_price', type: 'REAL' },
    { name: 'coverage', type: 'TEXT' },
    { name: 'po_number', type: 'TEXT' },
    { name: 'title_number', type: 'TEXT' }
  ];
  
  columnsToAdd.forEach(col => {
    try {
      db.prepare(`ALTER TABLE vehicles ADD COLUMN ${col.name} ${col.type}`).run();
      console.log(`[Migration] ✓ Added column: ${col.name}`);
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log(`[Migration] - Column ${col.name} already exists, skipping`);
      } else {
        throw error;
      }
    }
  });
  
  console.log('[Migration] Migration complete!');
} catch (error) {
  console.error('[Migration] Error:', error.message);
  process.exit(1);
}

