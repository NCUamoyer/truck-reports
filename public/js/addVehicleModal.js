// AddVehicleModal - Modal for creating new vehicles
// Version 1.0

class AddVehicleModal {
  constructor() {
    this.overlay = null;
  }

  open() {
    this.createModalHTML();
    this.setupEventListeners();
  }

  createModalHTML() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.maxWidth = '900px';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'add-vehicle-title');
    
    modal.innerHTML = `
      <div class="modal-header">
        <div class="modal-title-section">
          <h2 class="modal-title" id="add-vehicle-title">Add New Vehicle</h2>
          <p class="modal-subtitle">Enter vehicle information to add to the fleet</p>
        </div>
        <button class="modal-close-btn" aria-label="Close modal" type="button">✕</button>
      </div>
      
      <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
        <form id="add-vehicle-form" class="vehicle-edit-form">
          <h3 style="margin-bottom: var(--space-4); color: var(--gray-800); font-size: var(--text-lg);">
            Basic Information
          </h3>
          
          <div class="overview-grid">
            <div class="form-group">
              <label>Vehicle Number *</label>
              <input type="text" name="vehicle_number" class="form-control" required placeholder="e.g., T-101">
            </div>
            
            <div class="form-group">
              <label>Status *</label>
              <select name="status" class="form-control" required>
                <option value="active" selected>Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="out_of_service">Out of Service</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Make</label>
              <input type="text" name="make" class="form-control" placeholder="e.g., Ford">
            </div>
            
            <div class="form-group">
              <label>Model</label>
              <input type="text" name="model" class="form-control" placeholder="e.g., F-150">
            </div>
            
            <div class="form-group">
              <label>Year</label>
              <input type="number" name="year" class="form-control" min="1900" max="2100" placeholder="e.g., 2023">
            </div>
            
            <div class="form-group">
              <label>VIN</label>
              <input type="text" name="vin" class="form-control" maxlength="17" placeholder="17-character VIN">
            </div>
          </div>

          <h3 style="margin: var(--space-6) 0 var(--space-4) 0; color: var(--gray-800); font-size: var(--text-lg);">
            Assignment & Location
          </h3>
          
          <div class="overview-grid">
            <div class="form-group">
              <label>Assigned To / Driver</label>
              <input type="text" name="assigned_to" class="form-control" placeholder="Driver name">
            </div>
            
            <div class="form-group">
              <label>Location</label>
              <input type="text" name="location" class="form-control" placeholder="e.g., Main Depot">
            </div>
            
            <div class="form-group">
              <label>License Plate</label>
              <input type="text" name="license_plate" class="form-control" placeholder="License plate number">
            </div>
            
            <div class="form-group">
              <label>Service Station</label>
              <input type="text" name="service_station" class="form-control" placeholder="Service station">
            </div>
          </div>

          <h3 style="margin: var(--space-6) 0 var(--space-4) 0; color: var(--gray-800); font-size: var(--text-lg);">
            Additional Details
          </h3>
          
          <div class="overview-grid">
            <div class="form-group">
              <label>Current Mileage</label>
              <input type="number" name="current_mileage" class="form-control" min="0" placeholder="Odometer reading">
            </div>
            
            <div class="form-group">
              <label>Acquisition Date</label>
              <input type="date" name="acquisition_date" class="form-control">
            </div>
            
            <div class="form-group">
              <label>Last Service Date</label>
              <input type="date" name="last_service_date" class="form-control">
            </div>
            
            <div class="form-group">
              <label>Description</label>
              <input type="text" name="description" class="form-control" placeholder="Brief description">
            </div>
          </div>
          
          <div class="form-group" style="grid-column: 1 / -1;">
            <label>Notes</label>
            <textarea name="notes" class="form-control" rows="4" placeholder="Additional notes about this vehicle..."></textarea>
          </div>
          
          <div style="display: flex; gap: var(--space-3); justify-content: flex-end; margin-top: var(--space-6); padding-top: var(--space-6); border-top: 2px solid var(--gray-200);">
            <button type="button" class="btn btn-secondary" id="cancel-add-btn">Cancel</button>
            <button type="submit" class="btn btn-success">
              <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
              Add Vehicle
            </button>
          </div>
        </form>
      </div>
    `;
    
    this.overlay.appendChild(modal);
    document.body.appendChild(this.overlay);
    document.body.style.overflow = 'hidden';
    
    // Initialize Lucide icons
    if (window.lucide) {
      requestAnimationFrame(() => {
        lucide.createIcons({ attrs: { 'stroke-width': 2 } });
      });
    }
  }

  setupEventListeners() {
    // Close button
    const closeBtn = this.overlay.querySelector('.modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Cancel button
    const cancelBtn = this.overlay.querySelector('#cancel-add-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.close());
    }

    // Close on overlay click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // Form submission
    const form = this.overlay.querySelector('#add-vehicle-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // ESC key to close
    this.handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    document.addEventListener('keydown', this.handleKeyPress);
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    
    // Disable submit button and show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner" style="width: 16px; height: 16px; border-width: 2px; margin: 0 auto;"></div>';
    
    try {
      const formData = new FormData(form);
      const data = {};
      
      // Convert FormData to object, only including non-empty values
      for (const [key, value] of formData.entries()) {
        if (value && value.trim() !== '') {
          // Convert numbers
          if (key === 'year' || key === 'current_mileage') {
            data[key] = parseInt(value);
          } else {
            data[key] = value;
          }
        }
      }
      
      // Validate required fields
      if (!data.vehicle_number) {
        throw new Error('Vehicle number is required');
      }
      
      if (!data.status) {
        data.status = 'active'; // Default status
      }
      
      // Send POST request to create vehicle
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create vehicle');
      }
      
      const newVehicle = await response.json();
      
      // Show success message
      this.showToast(`Vehicle ${data.vehicle_number} added successfully!`, 'success');
      
      // Close modal
      this.close();
      
      // Reload the vehicle table
      if (window.location.pathname.includes('vehicle-management')) {
        // If on vehicle management page, reload the table
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
      
    } catch (error) {
      console.error('Error adding vehicle:', error);
      this.showToast(error.message || 'Failed to add vehicle', 'error');
      
      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      
      // Re-initialize icons
      if (window.lucide) {
        requestAnimationFrame(() => {
          lucide.createIcons({ attrs: { 'stroke-width': 2 } }, submitBtn);
        });
      }
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--error)' : 'var(--primary-blue)'};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
      font-weight: 600;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  close() {
    if (this.handleKeyPress) {
      document.removeEventListener('keydown', this.handleKeyPress);
    }
    
    if (this.overlay) {
      this.overlay.classList.add('fade-out');
      setTimeout(() => {
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.remove();
        }
        document.body.style.overflow = '';
      }, 200);
    }
  }
}

// Make it globally available
window.AddVehicleModal = AddVehicleModal;


