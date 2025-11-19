const db = require('../server/database/db');

console.log('[Cleanup] Removing invalid vehicle entries...');

// Delete vehicles with invalid patterns
const invalidPatterns = [
  '%ACCT%', '%ACCOUNT%', '%ELECT%', '%DUTY%', '%STATION%', '%PRICE%',
  '%JOB %', '%NDEG%', '%NDEQ%', '%JUNKED%', '%TRADED%', '%AUCTION%',
  '%NEW #%', '%OLD #%', '%VEH #%', '%E-G-W%', '%E G W%',
  '%HAS BEEN%', '%SERVICE%', '%SALES%'
];

let totalDeleted = 0;

invalidPatterns.forEach(pattern => {
  const result = db.prepare(`DELETE FROM vehicles WHERE vehicle_number LIKE ?`).run(pattern);
  if (result.changes > 0) {
    console.log(`[Cleanup] Deleted ${result.changes} entries matching: ${pattern}`);
    totalDeleted += result.changes;
  }
});

// Delete vehicles with no numbers in the vehicle_number
const stmt = db.prepare(`
  DELETE FROM vehicles 
  WHERE vehicle_number NOT GLOB '*[0-9]*'
`);
const result = stmt.run();
if (result.changes > 0) {
  console.log(`[Cleanup] Deleted ${result.changes} entries with no numbers`);
  totalDeleted += result.changes;
}

// Delete vehicles with very long vehicle numbers (likely descriptions)
const longStmt = db.prepare(`
  DELETE FROM vehicles 
  WHERE LENGTH(vehicle_number) > 20
`);
const longResult = longStmt.run();
if (longResult.changes > 0) {
  console.log(`[Cleanup] Deleted ${longResult.changes} entries with long vehicle numbers`);
  totalDeleted += longResult.changes;
}

console.log(`\n[Cleanup] Total deleted: ${totalDeleted}`);
console.log(`[Cleanup] Remaining vehicles: ${db.prepare('SELECT COUNT(*) as count FROM vehicles').get().count}`);

// Show sample of remaining vehicles
console.log('\n[Cleanup] Sample remaining vehicles:');
const samples = db.prepare('SELECT vehicle_number, make, model, year FROM vehicles ORDER BY vehicle_number LIMIT 10').all();
samples.forEach(v => {
  console.log(`  ${v.vehicle_number}: ${v.year || 'N/A'} ${v.make || ''} ${v.model || ''}`);
});

