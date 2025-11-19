// Form handling and validation

class ReportForm {
  constructor(formId) {
    this.form = document.getElementById(formId);
    this.autosaveKey = 'vehicle_report_draft';
    this.autosaveInterval = null;
    this.editMode = false;
    this.reportId = null;
    
    this.init();
  }
  
  init() {
    if (!this.form) return;
    
    // Check if we're in edit mode
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    
    if (editId) {
      this.editMode = true;
      this.reportId = editId;
      this.loadReportForEdit(editId);
    }
    
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    this.setupValidation();
    this.setupAutosave();
    
    // Only check for draft if not in edit mode
    if (!this.editMode) {
      this.checkForDraft();
    }
    
    this.setupVehicleAutocomplete();
  }
  
  setupValidation() {
    // Add validation listeners to required fields
    const requiredFields = this.form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
      field.addEventListener('blur', () => this.validateField(field));
      field.addEventListener('input', () => {
        if (field.classList.contains('error')) {
          this.validateField(field);
        }
      });
    });
  }
  
  validateField(field) {
    const errorElement = field.parentElement.querySelector('.form-error');
    let isValid = true;
    let errorMessage = '';
    
    // Required check
    if (field.hasAttribute('required') && !field.value.trim()) {
      isValid = false;
      errorMessage = 'This field is required';
    }
    
    // Type-specific validation
    if (field.value) {
      if (field.type === 'date') {
        const date = new Date(field.value);
        if (date > new Date()) {
          isValid = false;
          errorMessage = 'Date cannot be in the future';
        }
      }
      
      if (field.type === 'number') {
        const value = Number(field.value);
        if (value < 0) {
          isValid = false;
          errorMessage = 'Value must be positive';
        }
        if (field.max && value > Number(field.max)) {
          isValid = false;
          errorMessage = `Value must not exceed ${field.max}`;
        }
      }
    }
    
    // Update UI
    if (isValid) {
      field.classList.remove('error');
      if (errorElement) errorElement.classList.remove('visible');
    } else {
      field.classList.add('error');
      if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.classList.add('visible');
      }
    }
    
    return isValid;
  }
  
  validateForm() {
    const requiredFields = this.form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });
    
    return isValid;
  }
  
  async handleSubmit(e) {
    e.preventDefault();
    
    if (!this.validateForm()) {
      this.showAlert('Please fill in all required fields correctly', 'error');
      return;
    }
    
    const formData = this.getFormData();
    const submitBtn = this.form.querySelector('button[type="submit"]');
    
    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Saving...';
      
      if (this.editMode && this.reportId) {
        // Update existing report
        await api.updateReport(this.reportId, formData);
        this.showAlert('Report updated successfully!', 'success');
      } else {
        // Create new report
        await api.createReport(formData);
        this.showAlert('Report created successfully!', 'success');
        // Clear draft only for new reports
        this.clearDraft();
      }
      
      // Redirect after short delay
      setTimeout(() => {
        window.location.href = '/reports-table';
      }, 1500);
      
    } catch (error) {
      this.showAlert(error.message || 'Failed to save report', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = this.editMode ? 'Update Report' : 'Submit Report';
    }
  }
  
  getFormData() {
    const formData = new FormData(this.form);
    const data = {};
    
    // Convert FormData to object
    for (let [key, value] of formData.entries()) {
      // Handle checkboxes
      if (this.form.elements[key]?.type === 'checkbox') {
        data[key] = this.form.elements[key].checked ? 1 : 0;
      }
      // Handle empty values
      else if (value === '') {
        data[key] = null;
      }
      // Handle numbers
      else if (this.form.elements[key]?.type === 'number') {
        data[key] = value ? Number(value) : null;
      }
      else {
        data[key] = value;
      }
    }
    
    return data;
  }
  
  setupAutosave() {
    // Save every 30 seconds
    this.autosaveInterval = setInterval(() => {
      this.saveDraft();
    }, 30000);
    
    // Also save when leaving page
    window.addEventListener('beforeunload', () => {
      this.saveDraft();
    });
  }
  
  saveDraft() {
    const data = this.getFormData();
    localStorage.setItem(this.autosaveKey, JSON.stringify(data));
    this.showAutosaveIndicator();
  }
  
  checkForDraft() {
    const draft = localStorage.getItem(this.autosaveKey);
    if (draft) {
      this.showDraftBanner();
    }
  }
  
  loadDraft() {
    const draft = localStorage.getItem(this.autosaveKey);
    if (!draft) return;
    
    try {
      const data = JSON.parse(draft);
      
      // Populate form fields
      Object.keys(data).forEach(key => {
        const field = this.form.elements[key];
        if (field) {
          if (field.type === 'checkbox') {
            field.checked = data[key] === 1;
          } else {
            field.value = data[key] || '';
          }
        }
      });
      
      this.hideDraftBanner();
      this.showAlert('Draft loaded successfully', 'success');
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  }
  
  clearDraft() {
    localStorage.removeItem(this.autosaveKey);
    this.hideDraftBanner();
  }
  
  showDraftBanner() {
    const banner = document.getElementById('draft-banner');
    if (banner) {
      banner.classList.add('visible');
      
      document.getElementById('load-draft-btn')?.addEventListener('click', () => {
        this.loadDraft();
      });
      
      document.getElementById('discard-draft-btn')?.addEventListener('click', () => {
        this.clearDraft();
      });
    }
  }
  
  hideDraftBanner() {
    const banner = document.getElementById('draft-banner');
    if (banner) {
      banner.classList.remove('visible');
    }
  }
  
  showAutosaveIndicator() {
    const indicator = document.getElementById('autosave-indicator');
    if (indicator) {
      indicator.classList.add('visible', 'success');
      indicator.innerHTML = '<i data-lucide="check" style="width: 16px; height: 16px;"></i> Draft saved';
      lucide.createIcons();
      
      setTimeout(() => {
        indicator.classList.remove('visible');
      }, 2000);
    }
  }
  
  async loadReportForEdit(id) {
    try {
      const report = await api.getReport(id);
      
      // Update page title and button
      document.querySelector('h1').textContent = `Edit Report #${id}`;
      const submitBtn = this.form.querySelector('button[type="submit"]');
      submitBtn.textContent = 'Update Report';
      
      // Populate form fields
      Object.keys(report).forEach(key => {
        const field = this.form.elements[key];
        if (field) {
          if (field.type === 'checkbox') {
            field.checked = report[key] === 1;
          } else if (report[key] !== null && report[key] !== undefined) {
            field.value = report[key];
          }
        }
      });
      
    } catch (error) {
      this.showAlert('Failed to load report for editing: ' + error.message, 'error');
      setTimeout(() => {
        window.location.href = '/reports-table';
      }, 2000);
    }
  }
  
  setupVehicleAutocomplete() {
    const vehicleInput = this.form.elements['vehicle_number'];
    if (!vehicleInput) return;
    
    // Initialize custom autocomplete
    this.vehicleAutocomplete = new VehicleAutocomplete(vehicleInput, {
      onSelect: (vehicle) => {
        if (vehicle) {
          // Auto-fill fields from vehicle database
          this.autoFillVehicleInfo(vehicle);
        } else {
          // Clear auto-filled fields
          this.clearAutoFilledFields();
        }
      }
    });
  }
  
  autoFillVehicleInfo(vehicle) {
    console.log('[Form] Auto-filling vehicle info:', vehicle);
    
    // Auto-fill make
    if (vehicle.make && this.form.elements['make']) {
      this.form.elements['make'].value = vehicle.make;
      this.form.elements['make'].dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Auto-fill year
    if (vehicle.year && this.form.elements['year']) {
      this.form.elements['year'].value = vehicle.year;
      this.form.elements['year'].dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Show success indicator
    this.showAutoFillNotification(vehicle);
  }
  
  clearAutoFilledFields() {
    // Don't clear make/year in case user wants to keep them
    // Just clear the notification
  }
  
  showAutoFillNotification(vehicle) {
    const existing = document.getElementById('autofill-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.id = 'autofill-notification';
    notification.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 24px;
      background: var(--success);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      animation: slideIn 0.3s ease-out;
    `;
    notification.innerHTML = `
      <i data-lucide="check-circle" style="width: 20px; height: 20px;"></i>
      <span>Vehicle info loaded: ${vehicle.year || ''} ${vehicle.make || ''}</span>
    `;
    
    document.body.appendChild(notification);
    lucide.createIcons();
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Create new alert
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    // Insert at top of form
    this.form.insertBefore(alert, this.form.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      alert.remove();
    }, 5000);
  }
  
  destroy() {
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
    }
  }
}

// Initialize form when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const form = new ReportForm('report-form');
});

