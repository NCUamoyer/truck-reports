const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const dbPath = path.join(dataDir, 'reports.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
function initializeDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  db.exec(schema);
  console.log('[Database] Initialized successfully');
}

// Initialize on module load
initializeDatabase();

module.exports = db;

