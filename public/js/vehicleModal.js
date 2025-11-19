// VehicleModal - Comprehensive vehicle detail modal
// Version 2.1 - Fixed edit mode from table
class VehicleModal {
  constructor(vehicleId, initialTab = 'overview') {
    this.vehicleId = vehicleId;
    this.currentTab = initialTab === 'edit' ? 'overview' : initialTab;
    this.openInEditMode = initialTab === 'edit'; // Flag to open directly in edit mode
    this.vehicleData = null;
    this.documents = [];
    this.reports = [];
    this.notes = [];
    this.maintenance = [];
    this.overlay = null;
    this.loadedTabs = {}; // Track which tabs have been loaded to avoid re-rendering
  }

  async open() {
    try {
      // Create modal structure (instant - no icon processing)
      this.createModalHTML();
      
      // Setup event listeners (instant)
      this.setupEventListeners();
      
      // Load data asynchronously (non-blocking)
      this.loadData().then(() => {
        // After data loads, render the initial tab
        this.switchTab(this.currentTab);
        
        // If opened in edit mode, show edit form immediately
        if (this.openInEditMode) {
          setTimeout(() => this.showEditForm(), 100);
        }
      }).catch(error => {
        console.error('[VehicleModal] Error loading vehicle data:', error);
        this.showError('Failed to load vehicle data');
      });
      
    } catch (error) {
      console.error('[VehicleModal] Error opening modal:', error);
      this.showError('Failed to open modal');
    }
  }

  createModalHTML() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    
    // Create absolute minimal structure first
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    
    modal.innerHTML = `
      <div class="modal-header">
        <div class="modal-title-section">
          <h2 class="modal-title" id="modal-title">Loading...</h2>
          <p class="modal-subtitle" id="modal-subtitle">Please wait...</p>
        </div>
        <button class="modal-close-btn" aria-label="Close modal">✕</button>
      </div>
      <div class="modal-tabs" id="modal-tabs">
        <button class="modal-tab active" data-tab="overview">Overview</button>
        <button class="modal-tab" data-tab="documents">Documents <span class="modal-tab-badge" id="documents-count">0</span></button>
        <button class="modal-tab" data-tab="reports">Reports <span class="modal-tab-badge" id="reports-count">0</span></button>
        <button class="modal-tab" data-tab="notes">Notes <span class="modal-tab-badge" id="notes-count">0</span></button>
        <button class="modal-tab" data-tab="maintenance">Maintenance <span class="modal-tab-badge" id="maintenance-count">0</span></button>
      </div>
      <div class="modal-body" id="modal-body">
        <div id="tab-overview" class="modal-tab-content active">
          <div class="modal-loading">
            <div class="spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    `;
    
    this.overlay.appendChild(modal);
    document.body.appendChild(this.overlay);
    document.body.style.overflow = 'hidden';
  }

  setupEventListeners() {
    // Close button
    const closeBtn = this.overlay.querySelector('.modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Close on overlay click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // Tab buttons
    const tabButtons = this.overlay.querySelectorAll('.modal-tab');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Keyboard shortcuts
    this.handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        this.close();
      } else if (e.key === 'ArrowRight') {
        this.nextTab();
      } else if (e.key === 'ArrowLeft') {
        this.previousTab();
      }
    };
    document.addEventListener('keydown', this.handleKeyPress);
  }

  async loadData() {
    try {
      // Load vehicle summary
      const response = await fetch(`/api/vehicles/${this.vehicleId}/summary`);
      const data = await response.json();
      
      this.vehicleData = data;
      this.reports = data.recentReports || [];
      
      // Update header
      this.updateHeader();
      
      // Update counts
      this.updateCounts(data.stats);
      
    } catch (error) {
      console.error('[VehicleModal] Error loading data:', error);
      throw error;
    }
  }

  updateHeader() {
    const vehicle = this.vehicleData;
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    
    if (title) {
      title.textContent = `Vehicle #${vehicle.vehicle_number}`;
    }
    
    if (subtitle) {
      const makeModel = `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim();
      subtitle.textContent = makeModel || vehicle.description || 'Vehicle Details';
    }
    
    // Add edit button to header (only if it doesn't exist)
    let editBtn = document.getElementById('header-edit-btn');
    if (!editBtn) {
      const titleSection = document.querySelector('.modal-title-section');
      if (titleSection) {
        editBtn = document.createElement('button');
        editBtn.id = 'header-edit-btn';
        editBtn.className = 'btn btn-sm btn-primary';
        editBtn.style.cssText = 'margin-left: auto;';
        editBtn.innerHTML = 'Edit Vehicle';
        editBtn.onclick = () => this.showEditForm();
        
        const headerContent = titleSection.parentElement;
        if (headerContent) {
          headerContent.style.display = 'flex';
          headerContent.style.alignItems = 'center';
          headerContent.style.gap = 'var(--space-4)';
          headerContent.insertBefore(editBtn, headerContent.querySelector('.modal-close-btn'));
        }
      }
    }
  }

  updateCounts(stats) {
    if (!stats) return;
    
    document.getElementById('documents-count').textContent = stats.documentsCount || 0;
    document.getElementById('reports-count').textContent = stats.reportsCount || 0;
    document.getElementById('notes-count').textContent = stats.notesCount || 0;
    document.getElementById('maintenance-count').textContent = stats.maintenanceCount || 0;
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    
    // Update tab buttons (instant, no blocking)
    const tabButtons = this.overlay.querySelectorAll('.modal-tab');
    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Ensure tab container exists (lazy creation)
    this.ensureTabContainerExists(tabName);
    
    // Update tab content visibility (instant, no blocking)
    const tabContents = this.overlay.querySelectorAll('.modal-tab-content');
    tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tabName}`);
    });
    
    // Load tab data asynchronously (non-blocking for instant UI update)
    this.loadTabData(tabName).catch(err => {
      console.error(`Error loading tab ${tabName}:`, err);
    });
  }
  
  ensureTabContainerExists(tabName) {
    const tabId = `tab-${tabName}`;
    let container = document.getElementById(tabId);
    
    if (!container) {
      // Create container on demand
      const modalBody = document.getElementById('modal-body');
      container = document.createElement('div');
      container.id = tabId;
      container.className = 'modal-tab-content';
      container.innerHTML = `
        <div class="modal-loading">
          <div class="spinner"></div>
          <p>Loading ${tabName}...</p>
        </div>
      `;
      modalBody.appendChild(container);
    }
    
    return container;
  }

  async loadTabData(tabName) {
    // Skip if tab is already loaded (performance optimization)
    if (this.loadedTabs[tabName]) {
      return;
    }

    const container = document.getElementById(`tab-${tabName}`);
    if (!container) return;

    try {
      switch (tabName) {
        case 'overview':
          await this.renderOverviewTab(container);
          break;
        case 'documents':
          await this.renderDocumentsTab(container);
          break;
        case 'reports':
          await this.renderReportsTab(container);
          break;
        case 'notes':
          await this.renderNotesTab(container);
          break;
        case 'maintenance':
          await this.renderMaintenanceTab(container);
          break;
      }
      
      // Mark tab as loaded
      this.loadedTabs[tabName] = true;
      
      // Initialize icons ONLY in this container (fast and scoped)
      if (window.lucide && container.querySelector('[data-lucide]')) {
        requestAnimationFrame(() => {
          lucide.createIcons({ attrs: { 'stroke-width': 2 } }, container);
        });
      }
    } catch (error) {
      console.error(`[VehicleModal] Error rendering ${tabName} tab:`, error);
      container.innerHTML = `
        <div class="modal-empty">
          <svg xmlns="http://www.w3.org/2000/svg" class="modal-empty-icon" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p>Failed to load ${tabName} data</p>
        </div>
      `;
    }
  }

  async renderOverviewTab(container) {
    const v = this.vehicleData;
    const stats = v.stats || {};
    
    container.innerHTML = `
      <div class="vehicle-overview">
        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-value">${stats.reportsCount || 0}</div>
            <div class="stat-card-label">Inspection Reports</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-value">${stats.documentsCount || 0}</div>
            <div class="stat-card-label">Documents</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-value">${stats.notesCount || 0}</div>
            <div class="stat-card-label">Notes</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-value">${stats.maintenanceCount || 0}</div>
            <div class="stat-card-label">Maintenance Items</div>
          </div>
        </div>

        <!-- Vehicle Details -->
        <div class="overview-grid">
          <div class="overview-card">
            <div class="overview-card-title">Vehicle Number</div>
            <div class="overview-card-value">${v.vehicle_number}</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-title">Make</div>
            <div class="overview-card-value">${v.make || '-'}</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-title">Model</div>
            <div class="overview-card-value">${v.model || '-'}</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-title">Year</div>
            <div class="overview-card-value">${v.year || '-'}</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-title">Status</div>
            <div class="overview-card-value">
              <span class="status-badge status-${this.getStatusClass(v.status)}">
                ${this.formatStatus(v.status)}
              </span>
            </div>
          </div>
          <div class="overview-card">
            <div class="overview-card-title">Current Mileage</div>
            <div class="overview-card-value">${v.current_mileage ? v.current_mileage.toLocaleString() : '-'}</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-title">VIN</div>
            <div class="overview-card-value" style="font-size: var(--text-sm);">${v.vin || '-'}</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-title">License Plate</div>
            <div class="overview-card-value">${v.license_plate || '-'}</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-title">Driver</div>
            <div class="overview-card-value">${v.assigned_to || v.driver || '-'}</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-title">Location</div>
            <div class="overview-card-value">${v.location || '-'}</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-title">Service Station</div>
            <div class="overview-card-value">${v.service_station || '-'}</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-title">Last Service</div>
            <div class="overview-card-value">${v.last_service_date ? this.formatDate(v.last_service_date) : '-'}</div>
          </div>
        </div>

        ${v.notes ? `
          <div class="overview-card">
            <div class="overview-card-title">Notes</div>
            <div style="color: var(--gray-700); white-space: pre-wrap;">${v.notes}</div>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  showEditForm() {
    console.log('[VehicleModal] Opening edit form for vehicle:', this.vehicleId);
    const container = document.getElementById('tab-overview');
    const v = this.vehicleData;
    
    if (!v) {
      console.error('[VehicleModal] No vehicle data available for editing');
      container.innerHTML = '<div class="modal-empty"><p>Error: Vehicle data not loaded</p></div>';
      return;
    }
    
    // Hide the edit button in header while editing
    const headerEditBtn = document.getElementById('header-edit-btn');
    if (headerEditBtn) {
      headerEditBtn.style.display = 'none';
    }
    
    container.innerHTML = `
      <form id="vehicle-edit-form" class="vehicle-edit-form">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6);">
          <h3 style="margin: 0;">Edit Vehicle Information</h3>
          <button type="button" class="btn btn-secondary" id="cancel-edit-btn">Cancel</button>
        </div>
        
        <div class="overview-grid">
          <div class="form-group">
            <label>Vehicle Number *</label>
            <input type="text" name="vehicle_number" class="form-control" value="${v.vehicle_number}" required>
          </div>
          
          <div class="form-group">
            <label>Status</label>
            <select name="status" class="form-control">
              <option value="active" ${v.status === 'active' ? 'selected' : ''}>Active</option>
              <option value="maintenance" ${v.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
              <option value="out_of_service" ${v.status === 'out_of_service' ? 'selected' : ''}>Out of Service</option>
              <option value="retired" ${v.status === 'retired' ? 'selected' : ''}>Retired</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Assigned To / Driver</label>
            <input type="text" name="assigned_to" class="form-control" value="${v.assigned_to || v.driver || ''}">
          </div>
          
          <div class="form-group">
            <label>Location</label>
            <input type="text" name="location" class="form-control" value="${v.location || ''}">
          </div>
          
          <div class="form-group">
            <label>Current Mileage</label>
            <input type="number" name="current_mileage" class="form-control" value="${v.current_mileage || ''}">
          </div>
          
          <div class="form-group">
            <label>License Plate</label>
            <input type="text" name="license_plate" class="form-control" value="${v.license_plate || ''}">
          </div>
          
          <div class="form-group">
            <label>VIN</label>
            <input type="text" name="vin" class="form-control" value="${v.vin || ''}">
          </div>
          
          <div class="form-group">
            <label>Service Station</label>
            <input type="text" name="service_station" class="form-control" value="${v.service_station || ''}">
          </div>
          
          <div class="form-group">
            <label>Last Service Date</label>
            <input type="date" name="last_service_date" class="form-control" value="${v.last_service_date || ''}">
          </div>
        </div>
        
        <div class="form-group" style="grid-column: 1 / -1;">
          <label>Notes</label>
          <textarea name="notes" class="form-control" rows="4" style="width: 100%;">${v.notes || ''}</textarea>
        </div>
        
        <div style="display: flex; gap: var(--space-3); justify-content: flex-end; margin-top: var(--space-6);">
          <button type="button" class="btn btn-secondary" id="cancel-edit-btn-bottom">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `;
    
    // Add form event listeners
    const form = container.querySelector('#vehicle-edit-form');
    const cancelBtns = container.querySelectorAll('[id^="cancel-edit-btn"]');
    
    form.addEventListener('submit', (e) => this.handleEditSubmit(e));
    cancelBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.loadedTabs['overview'] = false; // Force re-render
        this.renderOverviewTab(container);
        // Show edit button again
        const headerEditBtn = document.getElementById('header-edit-btn');
        if (headerEditBtn) {
          headerEditBtn.style.display = '';
        }
      });
    });
  }
  
  async handleEditSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    try {
      const response = await fetch(`/api/vehicles/${this.vehicleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to update vehicle');
      
      // Reload vehicle data
      await this.loadData();
      
      // Update header with new vehicle number (in case it changed)
      this.updateHeader();
      
      // Re-render overview tab
      const container = document.getElementById('tab-overview');
      this.loadedTabs['overview'] = false; // Force re-render
      await this.renderOverviewTab(container);
      
      // Show edit button again
      const headerEditBtn = document.getElementById('header-edit-btn');
      if (headerEditBtn) {
        headerEditBtn.style.display = '';
      }
      
      // Show success message
      this.showToast('Vehicle updated successfully!', 'success');
      
    } catch (error) {
      console.error('Error updating vehicle:', error);
      this.showToast('Failed to update vehicle', 'error');
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
      background: ${type === 'success' ? 'var(--success)' : 'var(--error)'};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  async renderDocumentsTab(container) {
    // Load documents
    const response = await fetch(`/api/documents/vehicle/${this.vehicleId}`);
    this.documents = await response.json();
    
    container.innerHTML = `
      <div class="documents-header">
        <h3 style="margin: 0;">Documents</h3>
        <button class="btn btn-primary" id="show-upload-form-btn">
          <i data-lucide="upload" style="width: 16px; height: 16px;"></i>
          Upload Document
        </button>
      </div>

      <!-- Upload Form (hidden by default) -->
      <div id="document-upload-form" style="display: none; background: var(--gray-50); padding: var(--space-6); border-radius: var(--radius-lg); margin-bottom: var(--space-6); border: 2px solid var(--gray-200);">
        <h4 style="margin: 0 0 var(--space-4) 0;">Upload New Document</h4>
        
        <!-- Drag and Drop Area -->
        <div id="drop-zone" style="border: 3px dashed var(--gray-300); border-radius: var(--radius-lg); padding: var(--space-8); text-align: center; background: var(--white); cursor: pointer; transition: all 0.2s; margin-bottom: var(--space-4);">
          <i data-lucide="upload-cloud" style="width: 48px; height: 48px; color: var(--gray-400); margin: 0 auto var(--space-3);"></i>
          <p style="font-weight: 600; color: var(--gray-700); margin: 0 0 var(--space-2) 0;">Click to upload or drag and drop</p>
          <p style="font-size: var(--text-sm); color: var(--gray-500); margin: 0;">PDF, Images, Office Documents (Max 10MB)</p>
          <input type="file" id="file-input" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" style="display: none;">
        </div>
        
        <!-- Selected File Info -->
        <div id="selected-file-info" style="display: none; background: var(--white); padding: var(--space-4); border-radius: var(--radius-md); margin-bottom: var(--space-4); border: 2px solid var(--primary-blue);">
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <i data-lucide="file" style="width: 24px; height: 24px; color: var(--primary-blue);"></i>
            <div style="flex: 1;">
              <div id="file-name" style="font-weight: 600; color: var(--gray-900);"></div>
              <div id="file-size" style="font-size: var(--text-sm); color: var(--gray-600);"></div>
            </div>
            <button type="button" id="remove-file-btn" class="btn btn-sm btn-danger">
              <i data-lucide="x" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
          <div id="upload-progress" style="display: none; margin-top: var(--space-3);">
            <div style="background: var(--gray-200); height: 8px; border-radius: 4px; overflow: hidden;">
              <div id="progress-bar" style="background: var(--primary-blue); height: 100%; width: 0%; transition: width 0.3s;"></div>
            </div>
            <div id="progress-text" style="font-size: var(--text-sm); color: var(--gray-600); margin-top: var(--space-2); text-align: center;"></div>
          </div>
        </div>
        
        <!-- Metadata Form -->
        <div id="metadata-form" style="display: none;">
          <div class="overview-grid" style="margin-bottom: var(--space-4);">
            <div class="form-group">
              <label>Title *</label>
              <input type="text" id="doc-title" class="form-control" required placeholder="Document title">
            </div>
            
            <div class="form-group">
              <label>Category *</label>
              <select id="doc-category" class="form-control" required>
                <option value="">Select category...</option>
                <option value="service_report">Service Report</option>
                <option value="invoice">Invoice</option>
                <option value="oil_sample">Oil Sample Test</option>
                <option value="inspection">Inspection</option>
                <option value="registration">Registration</option>
                <option value="insurance">Insurance</option>
                <option value="receipt">Receipt</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Document Date</label>
              <input type="date" id="doc-date" class="form-control">
            </div>
            
            <div class="form-group">
              <label>Cost</label>
              <input type="number" id="doc-cost" class="form-control" step="0.01" placeholder="0.00">
            </div>
            
            <div class="form-group" style="grid-column: 1 / -1;">
              <label>Vendor</label>
              <input type="text" id="doc-vendor" class="form-control" placeholder="Vendor or service provider">
            </div>
            
            <div class="form-group" style="grid-column: 1 / -1;">
              <label>Description</label>
              <textarea id="doc-description" class="form-control" rows="3" placeholder="Additional notes or description..."></textarea>
            </div>
          </div>
          
          <div style="display: flex; gap: var(--space-3); justify-content: flex-end;">
            <button type="button" id="cancel-upload-btn" class="btn btn-secondary">Cancel</button>
            <button type="button" id="upload-btn" class="btn btn-success">
              <i data-lucide="upload" style="width: 16px; height: 16px;"></i>
              Upload Document
            </button>
          </div>
        </div>
      </div>

      ${this.documents.length === 0 ? `
        <div class="modal-empty">
          <i data-lucide="file-text" class="modal-empty-icon"></i>
          <p>No documents uploaded yet</p>
          <p style="font-size: var(--text-sm); color: var(--gray-500);">
            Upload service reports, invoices, and other documents
          </p>
        </div>
      ` : `
        <div class="document-list">
          ${this.documents.map(doc => this.renderDocumentItem(doc)).join('')}
        </div>
      `}
    `;
    
    // Setup upload functionality
    this.setupDocumentUpload(container);
  }
  
  setupDocumentUpload(container) {
    let selectedFile = null;
    
    const showUploadBtn = container.querySelector('#show-upload-form-btn');
    const uploadForm = container.querySelector('#document-upload-form');
    const dropZone = container.querySelector('#drop-zone');
    const fileInput = container.querySelector('#file-input');
    const selectedFileInfo = container.querySelector('#selected-file-info');
    const metadataForm = container.querySelector('#metadata-form');
    const cancelBtn = container.querySelector('#cancel-upload-btn');
    const uploadBtn = container.querySelector('#upload-btn');
    const removeFileBtn = container.querySelector('#remove-file-btn');
    
    // Show upload form
    if (showUploadBtn) {
      showUploadBtn.addEventListener('click', () => {
        uploadForm.style.display = 'block';
        showUploadBtn.style.display = 'none';
        lucide.createIcons();
      });
    }
    
    // Cancel upload
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.resetUploadForm(uploadForm, showUploadBtn, selectedFile, fileInput);
        selectedFile = null;
      });
    }
    
    // Remove selected file
    if (removeFileBtn) {
      removeFileBtn.addEventListener('click', () => {
        selectedFile = null;
        fileInput.value = '';
        selectedFileInfo.style.display = 'none';
        metadataForm.style.display = 'none';
        dropZone.style.display = 'block';
      });
    }
    
    // Click to upload
    if (dropZone) {
      dropZone.addEventListener('click', () => {
        fileInput.click();
      });
    }
    
    // File input change
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const validation = this.validateFile(file);
          if (validation.valid) {
            selectedFile = file;
            this.showSelectedFile(file, selectedFileInfo, metadataForm, dropZone);
          } else {
            alert(validation.error);
            fileInput.value = '';
          }
        }
      });
    }
    
    // Drag and drop
    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--primary-blue)';
        dropZone.style.background = 'rgba(37, 99, 235, 0.05)';
      });
      
      dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--gray-300)';
        dropZone.style.background = 'var(--white)';
      });
      
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--gray-300)';
        dropZone.style.background = 'var(--white)';
        
        const file = e.dataTransfer.files[0];
        if (file) {
          const validation = this.validateFile(file);
          if (validation.valid) {
            selectedFile = file;
            fileInput.files = e.dataTransfer.files; // Update file input
            this.showSelectedFile(file, selectedFileInfo, metadataForm, dropZone);
          } else {
            alert(validation.error);
          }
        }
      });
    }
    
    // Upload button
    if (uploadBtn) {
      uploadBtn.addEventListener('click', async () => {
        if (!selectedFile) {
          alert('Please select a file first');
          return;
        }
        
        const title = container.querySelector('#doc-title').value.trim();
        const category = container.querySelector('#doc-category').value;
        
        if (!title || !category) {
          alert('Please fill in title and category');
          return;
        }
        
        await this.uploadDocument(selectedFile, container, uploadForm, showUploadBtn);
        selectedFile = null;
      });
    }
    
    // Setup delete buttons for existing documents
    container.querySelectorAll('.delete-document-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const docId = btn.dataset.id;
        const docTitle = btn.dataset.title;
        
        if (confirm(`Are you sure you want to delete "${docTitle}"? This action cannot be undone.`)) {
          await this.deleteDocument(docId, container);
        }
      });
    });
  }
  
  validateFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not allowed. Please upload PDF, images, or Office documents.' };
    }
    
    return { valid: true };
  }
  
  showSelectedFile(file, selectedFileInfo, metadataForm, dropZone) {
    const fileName = selectedFileInfo.querySelector('#file-name');
    const fileSize = selectedFileInfo.querySelector('#file-size');
    
    fileName.textContent = file.name;
    fileSize.textContent = this.formatFileSize(file.size);
    
    dropZone.style.display = 'none';
    selectedFileInfo.style.display = 'block';
    metadataForm.style.display = 'block';
    
    lucide.createIcons();
  }
  
  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
  
  async uploadDocument(file, container, uploadForm, showUploadBtn) {
    const progressDiv = container.querySelector('#upload-progress');
    const progressBar = container.querySelector('#progress-bar');
    const progressText = container.querySelector('#progress-text');
    const uploadBtn = container.querySelector('#upload-btn');
    
    // Show progress
    progressDiv.style.display = 'block';
    uploadBtn.disabled = true;
    
    // Prepare form data
    const formData = new FormData();
    formData.append('document', file);
    formData.append('vehicle_id', this.vehicleId); // Required field
    formData.append('title', container.querySelector('#doc-title').value.trim());
    formData.append('category', container.querySelector('#doc-category').value);
    formData.append('description', container.querySelector('#doc-description').value.trim());
    formData.append('document_date', container.querySelector('#doc-date').value);
    formData.append('cost', container.querySelector('#doc-cost').value);
    formData.append('vendor', container.querySelector('#doc-vendor').value.trim());
    
    try {
      // Simulate progress (since we can't get real progress with fetch easily)
      progressBar.style.width = '30%';
      progressText.textContent = 'Uploading...';
      
      const response = await fetch(`/api/documents/upload`, {
        method: 'POST',
        body: formData
      });
      
      progressBar.style.width = '100%';
      progressText.textContent = 'Processing...';
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      // Success
      this.showToast('Document uploaded successfully!', 'success');
      
      // Reset and reload
      this.resetUploadForm(uploadForm, showUploadBtn, file, container.querySelector('#file-input'));
      
      // Reload documents tab
      setTimeout(async () => {
        await this.renderDocumentsTab(container);
        this.loadedTabs['documents'] = false; // Force reload next time
        lucide.createIcons();
      }, 300);
      
    } catch (error) {
      console.error('Upload error:', error);
      this.showToast(error.message || 'Failed to upload document', 'error');
      uploadBtn.disabled = false;
      progressDiv.style.display = 'none';
    }
  }
  
  resetUploadForm(uploadForm, showUploadBtn, file, fileInput) {
    uploadForm.style.display = 'none';
    showUploadBtn.style.display = 'block';
    
    if (fileInput) fileInput.value = '';
    
    const fields = ['#doc-title', '#doc-category', '#doc-description', '#doc-date', '#doc-cost', '#doc-vendor'];
    fields.forEach(selector => {
      const field = uploadForm.querySelector(selector);
      if (field) {
        if (field.tagName === 'SELECT') {
          field.selectedIndex = 0;
        } else {
          field.value = '';
        }
      }
    });
    
    const selectedFileInfo = uploadForm.querySelector('#selected-file-info');
    const metadataForm = uploadForm.querySelector('#metadata-form');
    const dropZone = uploadForm.querySelector('#drop-zone');
    const progressDiv = uploadForm.querySelector('#upload-progress');
    
    if (selectedFileInfo) selectedFileInfo.style.display = 'none';
    if (metadataForm) metadataForm.style.display = 'none';
    if (dropZone) dropZone.style.display = 'block';
    if (progressDiv) progressDiv.style.display = 'none';
  }
  
  async deleteDocument(docId, container) {
    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
      
      this.showToast('Document deleted successfully', 'success');
      
      // Reload documents tab
      await this.renderDocumentsTab(container);
      this.loadedTabs['documents'] = false; // Force reload next time
      lucide.createIcons();
      
    } catch (error) {
      console.error('Delete error:', error);
      this.showToast('Failed to delete document', 'error');
    }
  }

  renderDocumentItem(doc) {
    return `
      <div class="document-item">
        <div class="document-icon">
          <i data-lucide="file-text" style="width: 24px; height: 24px;"></i>
        </div>
        <div class="document-info">
          <div class="document-title">${doc.title}</div>
          <div class="document-meta">
            <span>${doc.category.replace(/_/g, ' ')}</span>
            <span>${this.formatDate(doc.upload_date)}</span>
            ${doc.cost ? `<span>$${doc.cost.toFixed(2)}</span>` : ''}
          </div>
          ${doc.description ? `<div style="font-size: var(--text-sm); color: var(--gray-600); margin-top: var(--space-2);">${doc.description}</div>` : ''}
        </div>
        <div class="document-actions">
          <a href="/api/documents/${doc.id}/download" class="btn btn-sm btn-primary" target="_blank" title="Download">
            <i data-lucide="download" style="width: 14px; height: 14px;"></i>
          </a>
          <button class="btn btn-sm btn-danger delete-document-btn" data-id="${doc.id}" data-title="${doc.title}" title="Delete">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      </div>
    `;
  }

  async renderReportsTab(container) {
    // Load reports
    const response = await fetch(`/api/vehicles/${this.vehicleId}/reports`);
    this.reports = await response.json();
    
    container.innerHTML = `
      <div style="margin-bottom: var(--space-6);">
        <h3 style="margin: 0 0 var(--space-2) 0;">Condition Reports</h3>
        <p style="color: var(--gray-600); font-size: var(--text-sm);">
          ${this.reports.length} total report${this.reports.length !== 1 ? 's' : ''}
        </p>
      </div>

      ${this.reports.length === 0 ? `
        <div class="modal-empty">
          <i data-lucide="clipboard-check" class="modal-empty-icon"></i>
          <p>No condition reports yet</p>
          <a href="/report-form?vehicle=${this.vehicleData.vehicle_number}" class="btn btn-primary" style="margin-top: var(--space-4);">
            Create First Report
          </a>
        </div>
      ` : `
        <div class="reports-timeline">
          ${this.reports.map(report => this.renderReportItem(report)).join('')}
        </div>
      `}
    `;
  }

  renderReportItem(report) {
    const status = report.defects ? 'ATTENTION' : 'PASS';
    const statusClass = report.defects ? 'attention' : 'pass';
    
    return `
      <div class="timeline-item">
        <div class="timeline-content">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--space-3);">
            <div>
              <div style="font-weight: 700; color: var(--gray-900); margin-bottom: var(--space-1);">
                ${this.formatDate(report.inspection_date)}
              </div>
              <div style="font-size: var(--text-sm); color: var(--gray-600);">
                Inspector: ${report.inspector_name}
              </div>
            </div>
            <span class="status-badge status-${statusClass}">${status}</span>
          </div>
          
          ${report.mileage ? `
            <div style="font-size: var(--text-sm); color: var(--gray-600); margin-bottom: var(--space-2);">
              Mileage: ${report.mileage.toLocaleString()}
            </div>
          ` : ''}
          
          ${report.defects ? `
            <div style="background: var(--warning-light); padding: var(--space-3); border-radius: var(--radius-md); margin-bottom: var(--space-3); font-size: var(--text-sm);">
              <strong>Defects:</strong> ${report.defects}
            </div>
          ` : ''}
          
          <div style="display: flex; gap: var(--space-2);">
            <a href="/api/export/report/${report.id}/pdf" class="btn btn-sm btn-primary" target="_blank">
              <i data-lucide="file-text" style="width: 14px; height: 14px;"></i>
              View PDF
            </a>
          </div>
        </div>
      </div>
    `;
  }

  async renderNotesTab(container) {
    // Load notes
    const response = await fetch(`/api/notes/vehicle/${this.vehicleId}`);
    this.notes = await response.json();
    
    container.innerHTML = `
      <div style="margin-bottom: var(--space-6);">
        <button class="btn btn-primary" onclick="alert('Add note feature coming soon!')">
          <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
          Add Note
        </button>
      </div>

      ${this.notes.length === 0 ? `
        <div class="modal-empty">
          <i data-lucide="sticky-note" class="modal-empty-icon"></i>
          <p>No notes yet</p>
          <p style="font-size: var(--text-sm); color: var(--gray-500);">
            Add notes about maintenance, incidents, or general information
          </p>
        </div>
      ` : `
        <div class="notes-list">
          ${this.notes.map(note => this.renderNoteItem(note)).join('')}
        </div>
      `}
    `;
  }

  renderNoteItem(note) {
    return `
      <div class="note-item">
        <div class="note-header">
          <div>
            <div class="note-title">${note.title}</div>
            <div class="note-meta">
              ${note.created_by} • ${this.formatDate(note.created_at)}
            </div>
          </div>
          <span class="status-badge status-pass">${note.note_type}</span>
        </div>
        <div class="note-content">${note.content}</div>
        <div class="note-actions">
          <button class="btn btn-sm btn-secondary" onclick="alert('Edit note feature coming soon!')">
            <i data-lucide="edit" style="width: 14px; height: 14px;"></i>
            Edit
          </button>
          <button class="btn btn-sm btn-danger" onclick="if(confirm('Delete this note?')) { /* delete logic */ }">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            Delete
          </button>
        </div>
      </div>
    `;
  }

  async renderMaintenanceTab(container) {
    // Load maintenance
    const response = await fetch(`/api/maintenance/vehicle/${this.vehicleId}`);
    this.maintenance = await response.json();
    
    container.innerHTML = `
      <div style="margin-bottom: var(--space-6);">
        <button class="btn btn-primary" onclick="alert('Add maintenance item feature coming soon!')">
          <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
          Add Maintenance Item
        </button>
      </div>

      ${this.maintenance.length === 0 ? `
        <div class="modal-empty">
          <i data-lucide="wrench" class="modal-empty-icon"></i>
          <p>No maintenance schedule set</p>
          <p style="font-size: var(--text-sm); color: var(--gray-500);">
            Add maintenance items to track service schedules
          </p>
        </div>
      ` : `
        <div class="notes-list">
          ${this.maintenance.map(item => this.renderMaintenanceItem(item)).join('')}
        </div>
      `}
    `;
  }

  renderMaintenanceItem(item) {
    const statusColors = {
      scheduled: 'pass',
      due: 'attention',
      overdue: 'fail',
      completed: 'pass'
    };
    
    return `
      <div class="note-item">
        <div class="note-header">
          <div>
            <div class="note-title">${item.maintenance_type}</div>
            <div class="note-meta">
              ${item.next_due_date ? `Due: ${this.formatDate(item.next_due_date)}` : ''}
              ${item.next_due_mileage ? `@ ${item.next_due_mileage.toLocaleString()} miles` : ''}
            </div>
          </div>
          <span class="status-badge status-${statusColors[item.status]}">${item.status}</span>
        </div>
        ${item.notes ? `<div class="note-content">${item.notes}</div>` : ''}
      </div>
    `;
  }

  // Utility methods
  getStatusClass(status) {
    const statusMap = {
      'active': 'pass',
      'maintenance': 'attention',
      'out_of_service': 'fail',
      'retired': 'fail'
    };
    return statusMap[status] || 'pass';
  }

  formatStatus(status) {
    if (!status) return 'Active';
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  nextTab() {
    const tabs = ['overview', 'documents', 'reports', 'notes', 'maintenance'];
    const currentIndex = tabs.indexOf(this.currentTab);
    const nextIndex = (currentIndex + 1) % tabs.length;
    this.switchTab(tabs[nextIndex]);
  }

  previousTab() {
    const tabs = ['overview', 'documents', 'reports', 'notes', 'maintenance'];
    const currentIndex = tabs.indexOf(this.currentTab);
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    this.switchTab(tabs[prevIndex]);
  }

  showError(message) {
    const modal = this.overlay.querySelector('.modal');
    if (modal) {
      modal.innerHTML = `
        <div class="modal-empty">
          <svg xmlns="http://www.w3.org/2000/svg" class="modal-empty-icon" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p>${message}</p>
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove(); document.body.style.overflow='';">
            Close
          </button>
        </div>
      `;
    }
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
window.VehicleModal = VehicleModal;

