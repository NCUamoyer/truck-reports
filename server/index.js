const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const reportsRouter = require('./routes/reports');
const vehiclesRouter = require('./routes/vehicles');
const exportRouter = require('./routes/export');
const documentsRouter = require('./routes/documents');
const notesRouter = require('./routes/notes');
const maintenanceRouter = require('./routes/maintenance');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - Required for Tailscale and reverse proxies
// Trust only the first proxy hop (Tailscale) for security
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for local development
}));
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  validate: {
    trustProxy: false, // Disable validation warnings for Tailscale setup
    xForwardedForHeader: false
  }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api/reports', reportsRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/export', exportRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/notes', notesRouter);
app.use('/api/maintenance', maintenanceRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/report-form', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/report-form.html'));
});

app.get('/reports-table', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/reports-table.html'));
});

app.get('/vehicle-management', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/vehicle-management.html'));
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   Vehicle Management Suite                                   ║
║                                                               ║
║   Server running on: http://localhost:${PORT}                   ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║                                                               ║
║   Available endpoints:                                        ║
║   • Dashboard:         http://localhost:${PORT}/                 ║
║   • New Report:        http://localhost:${PORT}/report-form      ║
║   • View Reports:      http://localhost:${PORT}/reports-table    ║
║   • Vehicle Management: http://localhost:${PORT}/vehicle-management ║
║   • API:               http://localhost:${PORT}/api              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;

