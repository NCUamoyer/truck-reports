-- Vehicle Condition Reports Database Schema

-- Vehicles table for quick reference and autocomplete
CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_number TEXT UNIQUE NOT NULL,
  year INTEGER,
  description TEXT,
  make TEXT,
  model TEXT,
  vin TEXT,
  driver TEXT,
  license_plate TEXT,
  tonnage TEXT,
  fuel_type TEXT,
  has_radio TEXT,
  service_station TEXT,
  sales_price REAL,
  coverage TEXT,
  po_number TEXT,
  title_number TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Main reports table
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_number TEXT NOT NULL,
  inspection_date DATE NOT NULL,
  inspector_name TEXT NOT NULL,
  
  -- Vehicle Information
  make TEXT,
  year INTEGER,
  mileage INTEGER,
  last_mileage_serviced INTEGER,
  hour_meter REAL,
  hours_pto REAL,
  
  -- Inspection Checklist (Boolean fields: 1 = Yes/Good, 0 = No/Bad, NULL = Not Checked)
  steering_good INTEGER,
  brakes_work INTEGER,
  parking_brake_work INTEGER,
  headlights_working INTEGER,
  parking_lights_working INTEGER,
  taillights_working INTEGER,
  backup_lights_working INTEGER,
  signal_devices_good INTEGER,
  auxiliary_lights_working INTEGER,
  windshield_condition TEXT,
  windshield_wiper_working INTEGER,
  tires_safe INTEGER,
  flags_flares_present INTEGER,
  first_aid_kit_stocked INTEGER,
  aed_location TEXT,
  fire_extinguisher_condition TEXT,
  
  -- Tire Pressure (using naming convention from form)
  tire_pressure_rf REAL,
  tire_pressure_rr REAL,
  tire_pressure_rr_outer REAL,
  tire_pressure_lf REAL,
  tire_pressure_lr REAL,
  tire_pressure_lr_outer REAL,
  
  -- Additional Notes
  defects TEXT,
  signature TEXT,
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (vehicle_number) REFERENCES vehicles(vehicle_number) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_vehicle ON reports(vehicle_number);
CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(inspection_date DESC);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicles_number ON vehicles(vehicle_number);

