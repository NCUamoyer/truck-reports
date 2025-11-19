const PDFDocument = require('pdfkit');
const { stringify } = require('csv-stringify/sync');
const reportService = require('./reportService');

class ExportService {
  // Generate PDF for a single report
  generateReportPDF(report) {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    
    // Helper function for consistent styling
    const addHeader = () => {
      doc.fontSize(18).font('Helvetica-Bold').text('VEHICLE CONDITION REPORT', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
    };
    
    const addField = (label, value, inline = false) => {
      const displayValue = value !== null && value !== undefined ? String(value) : '______';
      if (inline) {
        doc.font('Helvetica-Bold').text(label + ': ', { continued: true })
           .font('Helvetica').text(displayValue);
      } else {
        doc.font('Helvetica-Bold').text(label + ':');
        doc.font('Helvetica').text(displayValue);
        doc.moveDown(0.3);
      }
    };
    
    const addCheckbox = (label, checked) => {
      const checkbox = checked === 1 ? '[X]' : '[ ]';
      doc.font('Helvetica').text(`${checkbox} ${label}`);
    };
    
    // Header
    addHeader();
    
    // Report metadata
    doc.fontSize(10);
    doc.font('Helvetica-Bold').text('VEHICLE NO: ', { continued: true })
       .font('Helvetica').text(report.vehicle_number);
    doc.font('Helvetica-Bold').text('DATE: ', { continued: true })
       .font('Helvetica').text(report.inspection_date);
    doc.font('Helvetica-Bold').text('INSPECTOR: ', { continued: true })
       .font('Helvetica').text(report.inspector_name);
    doc.moveDown();
    
    // Vehicle Information Section
    doc.fontSize(12).font('Helvetica-Bold').text('Vehicle Information');
    doc.fontSize(10).font('Helvetica').moveDown(0.3);
    
    addField('Make of Vehicle', report.make, true);
    addField('Year', report.year, true);
    addField('Mileage', report.mileage, true);
    addField('Last Mileage Serviced', report.last_mileage_serviced, true);
    addField('Hour Meter', report.hour_meter, true);
    addField('Hours PTO', report.hours_pto, true);
    doc.moveDown();
    
    // Inspection Checklist
    doc.fontSize(12).font('Helvetica-Bold').text('Inspection Checklist');
    doc.fontSize(10).moveDown(0.3);
    
    addCheckbox('Is Steering Gear in Good Condition?', report.steering_good);
    addCheckbox('Do Brakes Work Properly?', report.brakes_work);
    addCheckbox('Does Parking Brake Work Properly?', report.parking_brake_work);
    addCheckbox('Are Both Headlights Working?', report.headlights_working);
    addCheckbox('Are Both Parking Lights Working?', report.parking_lights_working);
    addCheckbox('Are Taillights Working?', report.taillights_working);
    addCheckbox('Are Both Back-Up Lights Working?', report.backup_lights_working);
    addCheckbox('Are Signal Devices in Good Order?', report.signal_devices_good);
    addCheckbox('Are Auxiliary Lights Working?', report.auxiliary_lights_working);
    doc.moveDown(0.3);
    
    addField('Condition of Windshield', report.windshield_condition, true);
    addCheckbox('Is Windshield Wiper Working?', report.windshield_wiper_working);
    addCheckbox('Are All Tires & Treads Safe?', report.tires_safe);
    addCheckbox('Are there Flags & Flares?', report.flags_flares_present);
    addCheckbox('Is First Aid Kit Fully Stocked?', report.first_aid_kit_stocked);
    doc.moveDown(0.3);
    
    addField('Location and Condition of AED', report.aed_location, true);
    addField('Condition of Fire Extinguisher', report.fire_extinguisher_condition, true);
    doc.moveDown();
    
    // Tire Pressure Section
    doc.fontSize(12).font('Helvetica-Bold').text('Tire Pressure (PSI)');
    doc.fontSize(10).moveDown(0.3);
    
    doc.font('Helvetica').text(
      `RF: ${report.tire_pressure_rf || '__'}  ` +
      `RR: ${report.tire_pressure_rr || '__'}  ` +
      `RR (Outer): ${report.tire_pressure_rr_outer || '__'}`
    );
    doc.text(
      `LF: ${report.tire_pressure_lf || '__'}  ` +
      `LR: ${report.tire_pressure_lr || '__'}  ` +
      `LR (Outer): ${report.tire_pressure_lr_outer || '__'}`
    );
    doc.moveDown();
    
    // Defects
    doc.fontSize(12).font('Helvetica-Bold').text('Defects');
    doc.fontSize(10).font('Helvetica').moveDown(0.3);
    doc.text(report.defects || 'None reported');
    doc.moveDown();
    
    // Signature
    doc.fontSize(12).font('Helvetica-Bold').text('Signature');
    doc.fontSize(10).font('Helvetica').moveDown(0.3);
    doc.text(report.signature || '______________________');
    doc.moveDown(2);
    
    // Footer
    doc.fontSize(8).font('Helvetica').fillColor('gray')
       .text(`Report ID: ${report.id} | Generated: ${new Date().toLocaleString()}`, 
             { align: 'center' });
    
    return doc;
  }
  
  // Generate CSV for multiple reports
  generateReportsCSV(reports) {
    const columns = [
      'id', 'vehicle_number', 'inspection_date', 'inspector_name',
      'make', 'year', 'mileage', 'last_mileage_serviced', 'hour_meter', 'hours_pto',
      'steering_good', 'brakes_work', 'parking_brake_work',
      'headlights_working', 'parking_lights_working', 'taillights_working',
      'backup_lights_working', 'signal_devices_good', 'auxiliary_lights_working',
      'windshield_condition', 'windshield_wiper_working', 'tires_safe',
      'flags_flares_present', 'first_aid_kit_stocked', 'aed_location',
      'fire_extinguisher_condition', 'tire_pressure_rf', 'tire_pressure_rr',
      'tire_pressure_rr_outer', 'tire_pressure_lf', 'tire_pressure_lr',
      'tire_pressure_lr_outer', 'defects', 'signature', 'created_at'
    ];
    
    const data = reports.map(report => {
      const row = {};
      columns.forEach(col => {
        row[col] = report[col] ?? '';
      });
      return row;
    });
    
    return stringify(data, {
      header: true,
      columns: columns
    });
  }
  
  // Export single report as PDF
  async exportReportPDF(reportId) {
    const report = reportService.getReportById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }
    
    return this.generateReportPDF(report);
  }
  
  // Export multiple reports as CSV
  async exportReportsCSV(reportIds) {
    let reports;
    
    if (reportIds && reportIds.length > 0) {
      // Get specific reports
      reports = reportIds.map(id => reportService.getReportById(id)).filter(Boolean);
    } else {
      // Get all reports
      const result = reportService.getAllReports({ limit: 10000 });
      reports = result.reports;
    }
    
    return this.generateReportsCSV(reports);
  }
}

module.exports = new ExportService();

