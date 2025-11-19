const XLSX = require('xlsx');
const path = require('path');

// Read and preview the Excel file structure
function previewVehicles() {
  const filePath = path.join(__dirname, '../STORES-VEHICLE AND EQUIPMENT LISTING 2025.xlsx');
  
  console.log('[Preview] Reading Excel file...');
  
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON with header row specified
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  
  console.log('\n[Preview] Total rows:', data.length);
  
  // Find the first row with actual vehicle data (has VEH # field)
  const vehicleRows = data.filter(row => row['VEH #']);
  
  console.log('[Preview] Rows with vehicle numbers:', vehicleRows.length);
  
  if (vehicleRows.length > 0) {
    console.log('\n[Preview] Column names in vehicle data:');
    console.log('==========================================');
    const columns = Object.keys(vehicleRows[0]);
    columns.forEach((col, index) => {
      console.log(`${index + 1}. "${col}"`);
    });
    
    console.log('\n[Preview] First 5 vehicle entries:');
    console.log('==========================================');
    vehicleRows.slice(0, 5).forEach((row, index) => {
      console.log(`\n--- Vehicle ${index + 1} ---`);
      console.log(`VEH #: ${row['VEH #']}`);
      console.log(`YEAR: ${row['YEAR']}`);
      console.log(`DESCRIPTION: ${row['DESCRIPTION']}`);
      console.log(`VIN #: ${row['VIN #']}`);
      console.log(`DRIVER: ${row['DRIVER']}`);
      console.log(`LICENSE: ${row['LICENSE']}`);
      console.log(`TONNAGE: ${row['TONNAGE']}`);
      console.log(`FUEL: ${row['FUEL']}`);
      console.log(`RADIO: ${row['RADIO']}`);
      console.log(`SERVICE: ${row['SERVICE']}`);
      console.log(`SALES: ${row['SALES ']}`);
      console.log(`COVERAGE: ${row['COVERAGE']}`);
      console.log(`PO#: ${row['PO#']}`);
      console.log(`TITLE: ${row['TITLE']}`);
    });
    
    console.log('\n[Preview] Summary Statistics:');
    console.log('==========================================');
    console.log(`Total vehicles with VEH #: ${vehicleRows.length}`);
    console.log(`Years range: ${Math.min(...vehicleRows.map(r => r['YEAR']).filter(y => y))} - ${Math.max(...vehicleRows.map(r => r['YEAR']).filter(y => y))}`);
    console.log(`Vehicles with VIN: ${vehicleRows.filter(r => r['VIN #']).length}`);
    console.log(`Vehicles with LICENSE: ${vehicleRows.filter(r => r['LICENSE']).length}`);
    
    // Show unique service stations
    const services = [...new Set(vehicleRows.map(r => r['SERVICE']).filter(s => s))];
    console.log(`\nUnique SERVICE stations (${services.length}):`, services.slice(0, 10).join(', '));
  }
}

try {
  previewVehicles();
} catch (error) {
  console.error('[Preview] Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
