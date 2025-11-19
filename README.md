# 🚛 Vehicle Management Suite

A comprehensive, professional web application for complete vehicle fleet management, combining condition reports, document management, maintenance tracking, and full vehicle lifecycle administration. Built with enterprise-grade architecture using Node.js, SQLite, and a modern, responsive UI.

## ✨ Key Features

### 📋 **Condition Reports**
- **Digital Inspection Forms**: Complete digitization of vehicle condition reports
- **Smart Autocomplete**: Enhanced vehicle selector with status badges, driver info, location, and mileage
- **Auto-fill**: Automatically populates make/model/year from vehicle database
- **Edit Reports**: Full editing capability for existing reports
- **Auto-save**: Automatic draft saving every 30 seconds to prevent data loss
- **Export Options**: Professional PDF export and bulk CSV export

### 🚗 **Vehicle Management**
- **Complete CRUD Operations**: Add, edit, delete, and manage all vehicles
- **Fleet Overview Dashboard**: Real-time statistics with status breakdowns
- **Advanced Search & Filtering**: Sort, filter, and search across the entire fleet
- **Vehicle Details Modal**: Comprehensive tabbed interface showing:
  - **Overview**: All vehicle information with quick stats
  - **Documents**: File management with upload/download
  - **Reports**: Complete inspection history timeline
  - **Notes**: Internal notes and observations
  - **Maintenance**: Service schedules and tracking
- **Status Management**: Track vehicle status (Active, Maintenance, Out of Service, Retired)
- **Driver/Assignment Tracking**: Monitor who's assigned to each vehicle
- **Location Tracking**: Track vehicle locations across your fleet
- **Permanent Delete**: Secure deletion with confirmation safeguards

### 📄 **Document Management**
- **Drag & Drop Upload**: Intuitive file upload within vehicle modals
- **File Validation**: Client-side validation for file type and size (max 10MB)
- **Support for Multiple Formats**: PDF, Images (JPG/PNG), Office Documents (Word/Excel)
- **Rich Metadata**: Title, category, date, cost, vendor, and description
- **Categories**: Service reports, invoices, oil samples, inspections, registration, insurance, receipts
- **Progress Indicators**: Real-time upload progress and status messages
- **Download & Delete**: Full file lifecycle management

### 🔗 **Integrated Workflows**
- **Reports ↔ Vehicles**: Direct navigation from reports to vehicle details
- **Dashboard ↔ Fleet**: One-click access to vehicle management from dashboard
- **Cross-referencing**: All data linked and easily accessible

### 🎨 **Modern UI/UX**
- **Professional Design**: Clean, modern interface with Lucide Icons
- **Responsive Layout**: Fully optimized for mobile, tablet, and desktop
- **Card-based Mobile Views**: Touch-friendly interface for smartphones
- **Status Badges**: Color-coded indicators throughout the application
- **Smooth Animations**: Professional transitions and micro-interactions
- **Performance Optimized**: Fast loading with lazy-loaded content

## 🛠 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js + Express.js |
| **Database** | SQLite3 (better-sqlite3) |
| **Frontend** | Vanilla HTML/CSS/JavaScript |
| **File Uploads** | Multer middleware |
| **PDF Generation** | PDFKit |
| **CSV Export** | csv-stringify |
| **Excel Import** | xlsx |
| **Icons** | Lucide Icons |
| **Security** | Helmet.js, CORS, Rate Limiting |

## 📋 Prerequisites

- **Node.js** 16+ (recommended: Node.js 20+)
- **pnpm** (or npm)
- **Windows PowerShell** (for Windows users)

## 🚀 Quick Start

### 1. Installation

```powershell
# Navigate to project directory
cd truck-reports

# Install dependencies
pnpm install

# If you encounter better-sqlite3 build issues:
pnpm approve-builds
pnpm install --force
```

### 2. Import Your Fleet Data

```powershell
# Preview what will be imported (optional)
pnpm run preview-vehicles

# Import vehicle data from Excel
pnpm run import-vehicles

# Clean up any junk data (if needed)
pnpm run cleanup-vehicles
```

### 3. Start the Server

```powershell
# Production mode
pnpm start

# Development mode (with auto-reload)
pnpm run dev
```

### 4. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## 📁 Project Structure

```
truck-reports/
│
├── server/
│   ├── index.js                      # Express app entry point
│   ├── database/
│   │   ├── db.js                    # Database connection & initialization
│   │   └── schema.sql               # Database schema
│   ├── routes/
│   │   ├── reports.js               # Report CRUD operations
│   │   ├── vehicles.js              # Vehicle management endpoints
│   │   ├── documents.js             # Document upload/download
│   │   ├── notes.js                 # Vehicle notes endpoints
│   │   ├── maintenance.js           # Maintenance schedules
│   │   └── export.js                # Export functionality
│   ├── services/
│   │   ├── reportService.js         # Reports & vehicles business logic
│   │   ├── documentService.js       # Document management logic
│   │   └── exportService.js         # PDF/CSV generation
│   └── middleware/
│       ├── validation.js            # Input validation
│       ├── errorHandler.js          # Global error handling
│       └── upload.js                # Multer file upload configuration
│
├── public/
│   ├── index.html                   # Dashboard
│   ├── report-form.html             # Condition report form
│   ├── reports-table.html           # Historical reports
│   ├── vehicle-management.html      # Vehicle fleet management
│   ├── css/
│   │   ├── variables.css            # CSS custom properties
│   │   ├── global.css               # Global styles & animations
│   │   ├── form.css                 # Form-specific styles
│   │   ├── table.css                # Table & filters styles
│   │   ├── autocomplete.css         # Enhanced autocomplete dropdown
│   │   ├── modal.css                # Modal & form controls
│   │   └── vehicle-management.css   # Vehicle table styles
│   └── js/
│       ├── api.js                   # API client wrapper
│       ├── form.js                  # Report form handling
│       ├── table.js                 # Reports table rendering
│       ├── autocomplete.js          # Enhanced vehicle autocomplete
│       ├── vehicleTable.js          # Vehicle management table
│       ├── vehicleModal.js          # Vehicle details modal (1200+ lines)
│       └── addVehicleModal.js       # Add new vehicle modal
│
├── data/
│   └── reports.db                   # SQLite database (auto-generated)
│
├── uploads/
│   └── vehicles/                    # Document storage (auto-generated)
│       └── {vehicle_id}/
│           ├── service_report/
│           ├── invoice/
│           ├── oil_sample/
│           └── ...
│
├── scripts/
│   ├── import-vehicles.js           # Import fleet from Excel
│   ├── preview-vehicles.js          # Preview Excel data
│   ├── cleanup-vehicles.js          # Remove junk data
│   └── migrations/                  # Database migrations
│
├── package.json
├── .gitignore
├── README.md
├── IMPLEMENTATION_PLAN.md
└── VEHICLE-MANAGEMENT-SUITE-PLAN.md
```

## 🎯 User Guide

### Dashboard

The dashboard provides an at-a-glance view of your fleet:

1. **Quick Stats**: Total reports, pending attention, recent submissions
2. **Fleet Overview**: Vehicle counts by status (Active, Maintenance, Out of Service, Retired)
3. **Quick Actions**: Create report, view reports, manage fleet
4. **Status Cards**: Click to filter vehicles by status

### Creating a Condition Report

1. Navigate to **"New Report"** from dashboard or navigation
2. **Select Vehicle**: 
   - Type vehicle number to search
   - See enhanced details: status badge, driver, location, mileage
   - Auto-fills make/model/year
3. Fill in inspection details:
   - Date, Inspector name
   - Mileage, Hours
   - Complete inspection checklist (13+ items)
   - Tire pressure readings
   - Note any defects
4. Click **"Submit Report"**
5. Report auto-saves every 30 seconds as draft

### Managing Vehicles

#### Viewing the Fleet

1. Click **"Vehicles"** in navigation
2. Use search box to find vehicles
3. Filter by status or location
4. Sort by any column
5. Select multiple vehicles for bulk actions
6. Click any vehicle to see full details

#### Vehicle Details Modal

Click any vehicle to open a comprehensive modal with 5 tabs:

**1. Overview Tab**
- Quick stats (reports, documents, notes, maintenance items)
- Complete vehicle information
- Edit button to modify vehicle details

**2. Documents Tab**
- Upload documents via drag & drop or click
- Supported formats: PDF, JPG, PNG, Word, Excel
- Add rich metadata: title, category, date, cost, vendor, description
- Download or delete documents
- View all uploaded files

**3. Reports Tab**
- Timeline of all condition reports for this vehicle
- See inspection history
- Direct links to view/download PDFs
- Create first report link if none exist

**4. Notes Tab**
- Add internal notes and observations
- Track important information
- Edit or delete notes

**5. Maintenance Tab**
- View maintenance schedule
- Track service intervals
- See upcoming and overdue items

#### Adding a New Vehicle

1. Click **"Add New Vehicle"** button
2. Fill in required fields:
   - Vehicle Number (required)
   - Status (required)
   - Make, Model, Year
   - VIN, License Plate
   - Driver/Assigned To
   - Location, Service Station
   - Current Mileage
   - Additional notes
3. Click **"Add Vehicle"**

#### Editing a Vehicle

**Method 1: From Table**
- Click the edit (pencil) icon next to vehicle
- Opens modal directly in edit mode

**Method 2: From Modal**
- Open vehicle details
- Click **"Edit Vehicle"** in header
- Modify any field (including vehicle number)
- Click **"Save Changes"**

#### Deleting a Vehicle (Permanent)

⚠️ **Warning**: This permanently deletes ALL data associated with the vehicle.

1. Click **trash icon** next to vehicle
2. Read the warning dialog carefully
3. Type the vehicle number to confirm
4. Click **"Permanently Delete"**

This will delete:
- The vehicle record
- All condition reports
- All uploaded documents
- All notes
- All maintenance records
- Complete vehicle history

### Document Management

#### Uploading Documents

1. Open vehicle details modal
2. Go to **Documents** tab
3. Click **"Upload Document"** button
4. Either:
   - Drag and drop a file
   - Click the upload zone to browse
5. File is validated (type & size)
6. Fill in metadata:
   - Title (required)
   - Category (required): service report, invoice, oil sample, etc.
   - Document date
   - Cost
   - Vendor
   - Description
7. Click **"Upload Document"**
8. See progress bar and success message

#### Managing Documents

- **Download**: Click download icon to save file
- **Delete**: Click trash icon, confirm deletion
- **View List**: All documents shown with metadata
- Documents organized by category

### Reports Management

#### Viewing Reports

1. Click **"View Reports"** in navigation
2. Use powerful filtering:
   - Search by vehicle, inspector, or details
   - Filter by date range
   - Filter by status (PASS/ATTENTION)
3. Sort by clicking column headers
4. Actions per report:
   - **View Vehicle**: Navigate to vehicle details
   - **View**: See report details
   - **Edit**: Modify report
   - **PDF**: Download professional PDF
   - **Delete**: Remove report

#### Linking Between Reports and Vehicles

- **From Report → Vehicle**: Click **"Vehicle"** button in reports table
- **From Vehicle → Reports**: Open vehicle modal, go to Reports tab
- Seamless navigation throughout the app

### Exporting Data

#### Single Report PDF
- Click **PDF** button next to any report
- Professional formatted PDF opens in new tab
- Includes all inspection details and signature

#### Multiple Reports CSV
1. Select reports using checkboxes
2. Click **"Export Selected (CSV)"**
3. Opens in Excel/CSV reader

#### All Reports CSV
- Click **"Export All (CSV)"** at top of table
- Exports complete dataset

#### Vehicle List CSV
1. Go to Vehicle Management
2. Select vehicles or use filters
3. Click **"Export CSV"**
4. All vehicle data exported

## 🗄 Database Schema

### Core Tables

**vehicles**: Complete vehicle information
- Basic: vehicle_number, make, model, year, VIN
- Assignment: assigned_to, location, driver
- Status: status, current_mileage, last_service_date
- Details: description, license_plate, tonnage, fuel_type, service_station
- Metadata: created_at, updated_at

**reports**: Vehicle condition inspection reports
- Basic: vehicle_number, inspection_date, inspector_name
- Vehicle Details: make, year, mileage, hours
- Inspection: 13+ boolean checklist fields
- Tires: 6 position tire pressure readings
- Issues: defects notes
- Metadata: signature, created_at, updated_at

**documents**: File attachments for vehicles
- File Info: filename, originalname, mimetype, size, path
- Metadata: title, category, description, document_date
- Financial: cost, vendor
- References: vehicle_id (FK)
- Timestamps: upload_date, updated_at

**vehicle_notes**: Internal notes per vehicle
- Content: title, content, note_type
- Reference: vehicle_id (FK)
- Timestamps: created_at, updated_at

**maintenance_schedule**: Service tracking
- Schedule: service_type, due_date, interval_miles, interval_months
- Status: status (scheduled/due/overdue/completed)
- History: last_service_date, last_service_mileage
- Reference: vehicle_id (FK)

**vehicle_status_history**: Track status changes
- Change: previous_status, new_status, reason
- Reference: vehicle_id (FK)
- Timestamp: changed_at

## 🔌 API Reference

### Reports Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports` | Get all reports (paginated, filterable) |
| `GET` | `/api/reports/:id` | Get single report by ID |
| `POST` | `/api/reports` | Create new report |
| `PUT` | `/api/reports/:id` | Update existing report |
| `DELETE` | `/api/reports/:id` | Delete report |
| `GET` | `/api/reports/statistics` | Get dashboard statistics |

### Vehicles Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/vehicles` | Get all vehicles (paginated, filterable, sortable) |
| `GET` | `/api/vehicles/:id` | Get vehicle by ID |
| `GET` | `/api/vehicles/:id/summary` | Get vehicle with summary stats |
| `GET` | `/api/vehicles/:id/reports` | Get all reports for vehicle |
| `GET` | `/api/vehicles/:id/timeline` | Get combined timeline (reports, docs, notes) |
| `POST` | `/api/vehicles` | Create/upsert vehicle |
| `PUT` | `/api/vehicles/:id` | Update vehicle |
| `DELETE` | `/api/vehicles/:id` | Soft delete (set to retired) |
| `DELETE` | `/api/vehicles/:id/permanent` | Permanently delete vehicle + all data |

### Documents Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/documents/upload` | Upload document (multipart/form-data) |
| `GET` | `/api/documents/:id` | Get document metadata |
| `GET` | `/api/documents/:id/download` | Download document file |
| `PUT` | `/api/documents/:id` | Update document metadata |
| `DELETE` | `/api/documents/:id` | Delete document and file |
| `GET` | `/api/documents/vehicle/:vehicleId` | Get all documents for vehicle |
| `GET` | `/api/documents/vehicle/:vehicleId/stats` | Get document stats by category |

### Notes Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/notes` | Create note |
| `GET` | `/api/notes/vehicle/:vehicleId` | Get notes for vehicle |
| `PUT` | `/api/notes/:id` | Update note |
| `DELETE` | `/api/notes/:id` | Delete note |

### Maintenance Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/maintenance` | Create maintenance item |
| `GET` | `/api/maintenance/vehicle/:vehicleId` | Get maintenance for vehicle |
| `PUT` | `/api/maintenance/:id` | Update maintenance item |
| `DELETE` | `/api/maintenance/:id` | Delete maintenance item |

### Export Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/export/report/:id/pdf` | Export single report as PDF |
| `POST` | `/api/export/reports/csv` | Export selected reports as CSV |
| `GET` | `/api/export/reports/csv` | Export all reports as CSV |
| `GET` | `/api/export/vehicles` | Export vehicles as CSV |

## ⚙️ Configuration

### Environment Variables

```powershell
# Port configuration
$env:PORT=3000

# Database path (optional)
$env:DB_PATH="./data/reports.db"

# Upload directory (optional)
$env:UPLOAD_DIR="./uploads"
```

### Upload Limits

- **Max File Size**: 10MB
- **Allowed Types**: PDF, JPG, JPEG, PNG, DOC, DOCX, XLS, XLSX
- **Storage**: `uploads/vehicles/{vehicle_id}/{category}/`

## 🔒 Security Features

- **Helmet.js**: Security headers (XSS, clickjacking, etc.)
- **CORS**: Cross-Origin Resource Sharing enabled
- **Rate Limiting**: API endpoint protection
- **Input Validation**: All inputs validated and sanitized
- **Parameterized Queries**: SQL injection prevention
- **File Validation**: Type and size checks on uploads
- **Secure File Storage**: Organized directory structure

## 📱 Mobile Optimization

### Responsive Breakpoints
- **Desktop**: > 768px
- **Mobile**: ≤ 768px

### Mobile Features

**Tables**
- Card-based layout replaces traditional tables
- Touch-friendly buttons (44px minimum)
- Swipe-friendly spacing
- Larger checkboxes (24px)

**Forms**
- Single-column layouts
- 16px input font (prevents iOS zoom)
- Full-width buttons
- Optimized keyboard navigation

**Modals**
- Full-screen on mobile
- Scroll optimization
- Thumb-friendly controls

**Navigation**
- Responsive header
- Collapsible filters
- Touch-optimized links

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```powershell
$env:PORT=3001
pnpm start
```

#### 2. Database Locked
- Stop all server instances
- Close SQLite browser tools
- Restart server

#### 3. better-sqlite3 Build Error
```powershell
pnpm approve-builds
pnpm install --force
```

#### 4. Upload Directory Permissions
```powershell
# Windows: Ensure write permissions
icacls uploads /grant Everyone:F /T
```

#### 5. File Upload 404 Error
- Check `/api/documents/upload` endpoint
- Verify multer middleware is loaded
- Check `uploads/` directory exists

### Debug Mode

Enable detailed logging:
```powershell
$env:DEBUG="app:*"
pnpm run dev
```

## 📦 Backup & Restore

### Automatic Backups (Recommended)

1. **Database**:
   ```powershell
   Copy-Item data/reports.db "backups/reports_$(Get-Date -Format 'yyyy-MM-dd_HH-mm').db"
   ```

2. **Uploads Folder**:
   ```powershell
   Copy-Item -Recurse uploads "backups/uploads_$(Get-Date -Format 'yyyy-MM-dd')"
   ```

3. **Create scheduled task** (Windows):
   - Open Task Scheduler
   - Create daily/weekly backup task
   - Run PowerShell backup script

### Manual Backup

1. Stop the server
2. Copy these directories:
   - `data/` (database)
   - `uploads/` (documents)
3. Restart server

### Restore from Backup

1. Stop the server
2. Replace:
   - `data/reports.db` with backup
   - `uploads/` with backup folder
3. Restart server

## 🔄 Maintenance

### Database Migrations

```powershell
# Run migrations (if updates available)
pnpm run migrate

# View migration history
node scripts/migrations/check-status.js
```

### Data Cleanup

```powershell
# Remove junk vehicle entries
pnpm run cleanup-vehicles

# Re-import clean data
pnpm run import-vehicles
```

### Performance Optimization

- **Database**: Automatic indexes on foreign keys
- **File Storage**: Organized by vehicle and category
- **Frontend**: Lazy loading, content caching
- **API**: Pagination on large datasets

## 📝 Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm start` | Start production server |
| `pnpm run dev` | Development server (nodemon) |
| `pnpm run migrate` | Run database migrations |
| `pnpm run import-vehicles` | Import fleet from Excel |
| `pnpm run preview-vehicles` | Preview Excel data |
| `pnpm run cleanup-vehicles` | Remove invalid entries |

### Code Structure Guidelines

- **Services**: Business logic only
- **Routes**: HTTP handling only
- **Middleware**: Reusable request processing
- **Public**: Frontend assets only
- **Scripts**: One-time tasks and migrations

### Adding New Features

1. **Backend**:
   - Add service method
   - Create route endpoint
   - Update API documentation

2. **Frontend**:
   - Add UI component
   - Update API client
   - Add corresponding CSS

3. **Database**:
   - Create migration script
   - Update schema documentation

## 📊 Performance Metrics

- **Page Load**: < 1s (optimized assets)
- **API Response**: < 100ms (average)
- **Database Queries**: Indexed for performance
- **File Uploads**: Progress indicators
- **Modal Load**: < 200ms (lazy loading)

## 🌐 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ Fully Supported |
| Edge | Latest | ✅ Fully Supported |
| Firefox | Latest | ✅ Fully Supported |
| Safari | Latest | ✅ Fully Supported |
| Mobile Safari | iOS 12+ | ✅ Fully Supported |
| Chrome Mobile | Latest | ✅ Fully Supported |

## 🎓 Learning Resources

- [Express.js Documentation](https://expressjs.com/)
- [Better-SQLite3 API](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md)
- [Lucide Icons](https://lucide.dev/)
- [MDN Web Docs](https://developer.mozilla.org/)

## 📄 License

MIT License - Feel free to modify and extend for your needs.

## 🤝 Support

For issues, questions, or feature requests:
1. Check this README
2. Review `IMPLEMENTATION_PLAN.md`
3. Check `VEHICLE-MANAGEMENT-SUITE-PLAN.md`
4. Review troubleshooting section

---

## 🎉 **Built for Enterprise Fleet Management**

**Version**: 2.0 - Vehicle Management Suite  
**Last Updated**: 2025  
**Made with**: Node.js, SQLite, and attention to detail ❤️

---

### Quick Links

- [Installation](#-quick-start)
- [User Guide](#-user-guide)
- [API Reference](#-api-reference)
- [Troubleshooting](#-troubleshooting)
- [Backup](#-backup--restore)
