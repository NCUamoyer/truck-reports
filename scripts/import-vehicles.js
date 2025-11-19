const XLSX = require('xlsx');
const path = require('path');
const db = require('../server/database/db');

// Helper function to validate vehicle numbers
function isValidVehicleNumber(vehicleNumber) {
  if (!vehicleNumber || vehicleNumber.length === 0) return false;
  
  const vehNum = String(vehicleNumber).toUpperCase().trim();
  
  // Reject obvious invalid entries
  const invalidPatterns = [
    'ACCT', 'ACCOUNT', 'ELECT', 'DUTY', 'STATION', 'PRICE',
    'JOB ', 'NDEG', 'NDEQ', 'JUNKED', 'TRADED', 'AUCTION',
    'NEW #', 'OLD #', 'VEH #', 'E-G-W', 'E G W',
    'HAS BEEN', 'SERVICE', 'SALES'
  ];
  
  // Check if vehicle number matches any invalid patterns
  for (const pattern of invalidPatterns) {
    if (vehNum.includes(pattern)) {
      return false;
    }
  }
  
  // Reject if it's just letters (no numbers at all)
  if (!/\d/.test(vehNum)) {
    return false;
  }
  
  // Reject if it's longer than 20 characters (probably a description)
  if (vehNum.length > 20) {
    return false;
  }
  
  return true;
}

// Helper function to extract make from description
function extractMake(description) {
  if (!description) return null;
  
  const desc = String(description).toUpperCase();
  const makes = ['DODGE', 'CHEVY', 'CHEVROLET', 'FORD', 'GMC', 'RAM', 'TOYOTA', 'HONDA', 'NISSAN', 'KIA', 'HYUNDAI', 'JOHN DEERE', 'KUBOTA', 'EXMARK', 'HUSQVARNA'];
  
  for (const make of makes) {
    if (desc.includes(make)) {
      return make === 'CHEVROLET' ? 'CHEVY' : make;
    }
  }
  
  return null;
}

// Helper function to extract model from description
function extractModel(description) {
  if (!description) return null;
  
  // Remove the make from description to get model
  const desc = String(description);
  const make = extractMake(description);
  
  if (make) {
    return desc.replace(new RegExp(make, 'i'), '').trim();
  }
  
  return desc.trim();
}

// Read and parse the Excel file
function importVehicles() {
  const filePath = path.join(__dirname, '../STORES-VEHICLE AND EQUIPMENT LISTING 2025.xlsx');
  
  console.log('[Import] Reading Excel file...');
  const workbook = XLSX.readFile(filePath);
  
  // Get the first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  
  // Filter to only rows with vehicle numbers
  const vehicles = data.filter(row => row['VEH #']);
  
  console.log(`[Import] Found ${vehicles.length} vehicles in Excel file`);
  
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  
  // Prepare the upsert statement
  const stmt = db.prepare(`
    INSERT INTO vehicles (
      vehicle_number,
      year,
      description,
      make,
      model,
      vin,
      driver,
      license_plate,
      tonnage,
      fuel_type,
      has_radio,
      service_station,
      sales_price,
      coverage,
      po_number,
      title_number
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(vehicle_number) DO UPDATE SET
      year = COALESCE(excluded.year, vehicles.year),
      description = COALESCE(excluded.description, vehicles.description),
      make = COALESCE(excluded.make, vehicles.make),
      model = COALESCE(excluded.model, vehicles.model),
      vin = COALESCE(excluded.vin, vehicles.vin),
      driver = COALESCE(excluded.driver, vehicles.driver),
      license_plate = COALESCE(excluded.license_plate, vehicles.license_plate),
      tonnage = COALESCE(excluded.tonnage, vehicles.tonnage),
      fuel_type = COALESCE(excluded.fuel_type, vehicles.fuel_type),
      has_radio = COALESCE(excluded.has_radio, vehicles.has_radio),
      service_station = COALESCE(excluded.service_station, vehicles.service_station),
      sales_price = COALESCE(excluded.sales_price, vehicles.sales_price),
      coverage = COALESCE(excluded.coverage, vehicles.coverage),
      po_number = COALESCE(excluded.po_number, vehicles.po_number),
      title_number = COALESCE(excluded.title_number, vehicles.title_number),
      updated_at = CURRENT_TIMESTAMP
  `);
  
  // Process each vehicle with validation
  vehicles.forEach((row, index) => {
    try {
      const vehicleNumber = String(row['VEH #']).trim();
      
      // Skip if vehicle number is invalid
      if (!isValidVehicleNumber(vehicleNumber)) {
        skipped++;
        return;
      }
      
      const description = row['DESCRIPTION'] || null;
      const year = row['YEAR'] ? parseInt(row['YEAR']) : null;
      
      // Skip if year is invalid (too old or not a number)
      if (year && (year < 1950 || year > 2030)) {
        console.log(`[Import] Skipping invalid year: ${vehicleNumber} (${year})`);
        skipped++;
        return;
      }
      
      const salesPrice = row['SALES '] ? parseFloat(String(row['SALES ']).replace(/[^0-9.]/g, '')) : null;
      
      // Extract make and model from description
      const make = extractMake(description);
      const model = extractModel(description);
      
      const result = stmt.run(
        vehicleNumber,
        year,
        description,
        make,
        model,
        row['VIN #'] || null,
        row['DRIVER'] || null,
        row['LICENSE'] || null,
        row['TONNAGE'] || null,
        row['FUEL'] || null,
        row['RADIO'] || null,
        row['SERVICE'] || null,
        salesPrice,
        row['COVERAGE'] || null,
        row['PO#'] || null,
        row['TITLE'] || null
      );
      
      if (result.changes > 0) {
        imported++;
        if ((imported + updated) % 50 === 0) {
          console.log(`[Import] Processed ${imported + updated} vehicles...`);
        }
      }
      
    } catch (error) {
      console.error(`[Import] Error processing vehicle #${row['VEH #']}:`, error.message);
      skipped++;
    }
  });
  
  console.log('\n[Import] Import complete!');
  console.log(`  - Imported: ${imported} vehicles`);
  console.log(`  - Skipped: ${skipped} rows`);
  console.log(`  - Total vehicles in database: ${db.prepare('SELECT COUNT(*) as count FROM vehicles').get().count}`);
  
  // Show some sample imported data
  console.log('\n[Import] Sample imported vehicles:');
  const samples = db.prepare('SELECT vehicle_number, make, model, year FROM vehicles ORDER BY vehicle_number LIMIT 5').all();
  samples.forEach(v => {
    console.log(`  ${v.vehicle_number}: ${v.year || 'N/A'} ${v.make || ''} ${v.model || ''}`);
  });
}

// Run the import
try {
  importVehicles();
} catch (error) {
  console.error('[Import] Fatal error:', error);
  console.error(error.stack);
  process.exit(1);
}

