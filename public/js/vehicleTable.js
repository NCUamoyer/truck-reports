class VehicleTable {
  constructor() {
    this.vehicles = [];
    this.filteredVehicles = [];
    this.currentPage = 1;
    this.pageSize = 100;
    this.sortBy = 'vehicle_number';
    this.sortOrder = 'ASC';
    this.filters = {
      search: '',
      status: '',
      location: ''
    };
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadVehicles();
  }

  setupEventListeners() {
    // Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filters.search = e.target.value;
        this.currentPage = 1;
        this.loadVehicles();
      });
    }

    // Status filter
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.filters.status = e.target.value;
        this.currentPage = 1;
        this.loadVehicles();
      });
    }

    // Location filter
    const locationFilter = document.getElementById('location-filter');
    if (locationFilter) {
      locationFilter.addEventListener('change', (e) => {
        this.filters.location = e.target.value;
        this.currentPage = 1;
        this.loadVehicles();
      });
    }

    // Clear filters
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        this.clearFilters();
      });
    }

    // Page size
    const pageSizeSelect = document.getElementById('page-size');
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener('change', (e) => {
        this.pageSize = parseInt(e.target.value);
        this.currentPage = 1;
        this.loadVehicles();
      });
    }

    // Sort headers
    const sortableHeaders = document.querySelectorAll('.sortable');
    sortableHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const sortField = header.dataset.sort;
        if (this.sortBy === sortField) {
          this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
        } else {
          this.sortBy = sortField;
          this.sortOrder = 'ASC';
        }
        this.updateSortUI();
        this.loadVehicles();
      });
    });

    // Export CSV
    const exportCsvBtn = document.getElementById('export-csv-btn');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => {
        this.exportToCSV();
      });
    }

    // Add New Vehicle
    const addVehicleBtn = document.getElementById('add-vehicle-btn');
    if (addVehicleBtn) {
      addVehicleBtn.addEventListener('click', () => {
        this.openAddVehicleModal();
      });
    }

    // Select all
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        this.toggleSelectAll(e.target.checked);
      });
    }
  }

  async loadVehicles() {
    try {
      this.showLoading();

      const params = new URLSearchParams({
        page: this.currentPage,
        limit: this.pageSize,
        sortBy: this.sortBy,
        order: this.sortOrder
      });

      if (this.filters.search) params.append('search', this.filters.search);
      if (this.filters.status) params.append('status', this.filters.status);
      if (this.filters.location) params.append('location', this.filters.location);

      const response = await fetch(`/api/vehicles?${params}`);
      const data = await response.json();

      this.vehicles = data.vehicles || [];
      this.renderTable(this.vehicles);
      this.renderPagination(data.pagination);
      this.updateStats(data.pagination);
      this.populateLocationFilter();

    } catch (error) {
      console.error('Error loading vehicles:', error);
      this.showError('Failed to load vehicles');
    }
  }

  renderTable(vehicles) {
    const tbody = document.getElementById('vehicles-tbody');
    const mobileCards = document.getElementById('mobile-cards');

    if (!tbody) return;

    if (vehicles.length === 0) {
      const emptyState = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i data-lucide="truck" style="width: 64px; height: 64px; stroke-width: 1.5;"></i>
          </div>
          <div class="empty-state-title">No vehicles found</div>
          <div class="empty-state-message">Try adjusting your filters</div>
        </div>
      `;

      tbody.innerHTML = `<tr><td colspan="8">${emptyState}</td></tr>`;

      if (mobileCards) {
        mobileCards.innerHTML = emptyState;
      }

      lucide.createIcons();
      return;
    }

    // Render desktop table rows
    tbody.innerHTML = vehicles.map(vehicle => this.renderRow(vehicle)).join('');

    // Render mobile cards
    if (mobileCards) {
      mobileCards.innerHTML = vehicles.map(vehicle => this.renderMobileCard(vehicle)).join('');
    }

    // Initialize icons
    lucide.createIcons();

    // Attach event listeners
    this.attachRowEventListeners();
  }

  renderRow(vehicle) {
    const statusClass = this.getStatusClass(vehicle.status);
    const makeModel = `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || vehicle.description || '-';

    return `
      <tr data-vehicle-id="${vehicle.id}">
        <td>
          <input type="checkbox" class="vehicle-checkbox" value="${vehicle.id}">
        </td>
        <td><strong>${vehicle.vehicle_number}</strong></td>
        <td>${makeModel}</td>
        <td>${vehicle.year || '-'}</td>
        <td><span class="status-badge status-${statusClass}">${this.formatStatus(vehicle.status)}</span></td>
        <td class="hide-mobile">${vehicle.assigned_to || vehicle.driver || '-'}</td>
        <td class="hide-mobile">${vehicle.current_mileage ? vehicle.current_mileage.toLocaleString() : '-'}</td>
        <td class="actions">
          <button class="btn btn-sm btn-primary view-btn" data-id="${vehicle.id}" title="View Details">
            <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
          </button>
          <button class="btn btn-sm btn-secondary edit-btn" data-id="${vehicle.id}" title="Quick Edit">
            <i data-lucide="edit" style="width: 14px; height: 14px;"></i>
          </button>
          <button class="btn btn-sm btn-danger permanent-delete-btn" data-id="${vehicle.id}" data-vehicle-number="${vehicle.vehicle_number}" title="Permanently Delete">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </td>
      </tr>
    `;
  }

  renderMobileCard(vehicle) {
    const statusClass = this.getStatusClass(vehicle.status);
    const makeModel = `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || vehicle.description || '-';

    return `
      <div class="mobile-card" data-vehicle-id="${vehicle.id}">
        <div class="mobile-card-header">
          <div>
            <div class="mobile-card-title">${vehicle.vehicle_number}</div>
            <div class="mobile-card-subtitle">${vehicle.year || ''} ${makeModel}</div>
          </div>
          <input type="checkbox" class="mobile-card-checkbox vehicle-checkbox" value="${vehicle.id}">
        </div>

        <div class="mobile-card-body">
          <div class="mobile-card-field">
            <span class="mobile-card-field-label">Status</span>
            <span class="status-badge status-${statusClass}">${this.formatStatus(vehicle.status)}</span>
          </div>
          <div class="mobile-card-field">
            <span class="mobile-card-field-label">Driver</span>
            <span class="mobile-card-field-value">${vehicle.assigned_to || vehicle.driver || '-'}</span>
          </div>
          <div class="mobile-card-field">
            <span class="mobile-card-field-label">Mileage</span>
            <span class="mobile-card-field-value">${vehicle.current_mileage ? vehicle.current_mileage.toLocaleString() : '-'}</span>
          </div>
        </div>

        <div class="mobile-card-actions">
          <button class="btn btn-sm btn-primary view-btn" data-id="${vehicle.id}">
            <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
            View Details
          </button>
          <button class="btn btn-sm btn-secondary edit-btn" data-id="${vehicle.id}">
            <i data-lucide="edit" style="width: 14px; height: 14px;"></i>
            Quick Edit
          </button>
          <button class="btn btn-sm btn-danger permanent-delete-btn" data-id="${vehicle.id}" data-vehicle-number="${vehicle.vehicle_number}">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            Delete
          </button>
        </div>
      </div>
    `;
  }

  attachRowEventListeners() {
    // View buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const vehicleId = btn.dataset.id;
        this.openVehicleModal(vehicleId);
      });
    });

    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const vehicleId = btn.dataset.id;
        this.openVehicleModal(vehicleId, 'edit');
      });
    });

    // Delete buttons
    document.querySelectorAll('.permanent-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const vehicleId = btn.dataset.id;
        const vehicleNumber = btn.dataset.vehicleNumber;
        this.confirmPermanentDelete(vehicleId, vehicleNumber);
      });
    });

    // Row click (also opens modal)
    document.querySelectorAll('tr[data-vehicle-id]').forEach(row => {
      row.addEventListener('click', (e) => {
        if (!e.target.matches('input, button, .btn')) {
          const vehicleId = row.dataset.vehicleId;
          this.openVehicleModal(vehicleId);
        }
      });
    });

    // Checkboxes for bulk actions
    document.querySelectorAll('.vehicle-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateBulkActions();
      });
    });
  }

  openVehicleModal(vehicleId, tab = 'overview') {
    // This will be handled by VehicleModal class
    if (window.VehicleModal) {
      const modal = new VehicleModal(vehicleId, tab);
      modal.open();
    } else {
      console.warn('VehicleModal class not loaded');
      alert('Modal functionality coming soon!');
    }
  }

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

  renderPagination(pagination) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer || !pagination) return;

    const { page, totalPages } = pagination;
    let html = '';

    // Previous button
    html += `
      <button class="pagination-btn" ${page === 1 ? 'disabled' : ''} data-page="${page - 1}">
        <i data-lucide="chevron-left" style="width: 16px; height: 16px;"></i>
      </button>
    `;

    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      html += `<button class="pagination-btn" data-page="1">1</button>`;
      if (startPage > 2) html += `<span style="padding: 0 8px;">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
      html += `
        <button class="pagination-btn ${i === page ? 'active' : ''}" data-page="${i}">
          ${i}
        </button>
      `;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) html += `<span style="padding: 0 8px;">...</span>`;
      html += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    // Next button
    html += `
      <button class="pagination-btn" ${page === totalPages ? 'disabled' : ''} data-page="${page + 1}">
        <i data-lucide="chevron-right" style="width: 16px; height: 16px;"></i>
      </button>
    `;

    paginationContainer.innerHTML = html;
    lucide.createIcons();

    // Attach event listeners
    paginationContainer.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!btn.disabled) {
          this.currentPage = parseInt(btn.dataset.page);
          this.loadVehicles();
        }
      });
    });
  }

  updateStats(pagination) {
    if (!pagination) return;

    const { page, limit, total } = pagination;
    const start = total === 0 ? 0 : (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);

    const showingStart = document.getElementById('showing-start');
    const showingEnd = document.getElementById('showing-end');
    const totalVehicles = document.getElementById('total-vehicles');

    if (showingStart) showingStart.textContent = start;
    if (showingEnd) showingEnd.textContent = end;
    if (totalVehicles) totalVehicles.textContent = total;
  }

  populateLocationFilter() {
    const locationFilter = document.getElementById('location-filter');
    if (!locationFilter) return;

    // Get unique locations from vehicles
    const locations = [...new Set(this.vehicles.map(v => v.location).filter(Boolean))];
    
    // Keep current selection
    const currentValue = locationFilter.value;
    
    // Clear and rebuild
    locationFilter.innerHTML = '<option value="">All Locations</option>';
    locations.sort().forEach(location => {
      const option = document.createElement('option');
      option.value = location;
      option.textContent = location;
      locationFilter.appendChild(option);
    });
    
    // Restore selection
    locationFilter.value = currentValue;
  }

  updateSortUI() {
    document.querySelectorAll('.sortable').forEach(header => {
      header.classList.remove('sort-asc', 'sort-desc');
      if (header.dataset.sort === this.sortBy) {
        header.classList.add(this.sortOrder === 'ASC' ? 'sort-asc' : 'sort-desc');
      }
    });
  }

  clearFilters() {
    this.filters = { search: '', status: '', location: '' };
    this.currentPage = 1;

    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const locationFilter = document.getElementById('location-filter');

    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    if (locationFilter) locationFilter.value = '';

    this.loadVehicles();
  }

  toggleSelectAll(checked) {
    document.querySelectorAll('.vehicle-checkbox').forEach(checkbox => {
      checkbox.checked = checked;
    });
    this.updateBulkActions();
  }

  updateBulkActions() {
    const bulkActions = document.getElementById('bulk-actions');
    const bulkCount = document.getElementById('bulk-actions-count');
    const selectedCheckboxes = document.querySelectorAll('.vehicle-checkbox:checked');

    if (bulkCount) {
      bulkCount.textContent = selectedCheckboxes.length;
    }

    if (bulkActions) {
      if (selectedCheckboxes.length > 0) {
        bulkActions.classList.add('visible');
      } else {
        bulkActions.classList.remove('visible');
      }
    }
  }

  openAddVehicleModal() {
    if (window.AddVehicleModal) {
      const modal = new AddVehicleModal();
      modal.open();
    } else {
      console.error('AddVehicleModal not loaded');
      alert('Add vehicle functionality is not available');
    }
  }

  confirmPermanentDelete(vehicleId, vehicleNumber) {
    // Create a custom confirmation dialog
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.zIndex = '10001'; // Higher than other modals
    
    const dialog = document.createElement('div');
    dialog.className = 'modal';
    dialog.style.maxWidth = '500px';
    dialog.innerHTML = `
      <div class="modal-header" style="border-bottom: 2px solid var(--error);">
        <div class="modal-title-section">
          <h2 class="modal-title" style="color: var(--error); display: flex; align-items: center; gap: var(--space-2);">
            <i data-lucide="alert-triangle" style="width: 24px; height: 24px;"></i>
            Permanent Delete Warning
          </h2>
          <p class="modal-subtitle">This action cannot be undone!</p>
        </div>
      </div>
      
      <div class="modal-body" style="padding: var(--space-6);">
        <div style="background: var(--error-light); border-left: 4px solid var(--error); padding: var(--space-4); border-radius: var(--radius-md); margin-bottom: var(--space-6);">
          <p style="margin: 0; font-weight: 600; color: var(--error);">
            ⚠️ This will permanently delete vehicle <strong>${vehicleNumber}</strong> and ALL associated data:
          </p>
          <ul style="margin: var(--space-3) 0 0 var(--space-6); color: var(--gray-800);">
            <li>All condition reports</li>
            <li>All uploaded documents</li>
            <li>All notes and maintenance records</li>
            <li>Complete vehicle history</li>
          </ul>
        </div>
        
        <p style="font-weight: 600; margin-bottom: var(--space-3);">
          To confirm deletion, please type the vehicle number: <code style="background: var(--gray-100); padding: 2px 8px; border-radius: 4px; font-weight: 700;">${vehicleNumber}</code>
        </p>
        
        <input 
          type="text" 
          id="delete-confirmation-input" 
          class="form-control" 
          placeholder="Type vehicle number to confirm"
          style="margin-bottom: var(--space-6);"
          autocomplete="off"
        >
        
        <div style="display: flex; gap: var(--space-3); justify-content: flex-end;">
          <button id="cancel-delete-btn" class="btn btn-secondary">Cancel</button>
          <button id="confirm-delete-btn" class="btn btn-danger" disabled>
            <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
            Permanently Delete
          </button>
        </div>
      </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    
    // Initialize icons
    if (window.lucide) {
      lucide.createIcons();
    }
    
    // Get elements
    const confirmInput = overlay.querySelector('#delete-confirmation-input');
    const confirmBtn = overlay.querySelector('#confirm-delete-btn');
    const cancelBtn = overlay.querySelector('#cancel-delete-btn');
    
    // Enable/disable confirm button based on input
    confirmInput.addEventListener('input', (e) => {
      confirmBtn.disabled = e.target.value.trim() !== vehicleNumber;
    });
    
    // Cancel button
    const closeDialog = () => {
      overlay.remove();
      document.body.style.overflow = '';
    };
    
    cancelBtn.addEventListener('click', closeDialog);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeDialog();
    });
    
    // Confirm button
    confirmBtn.addEventListener('click', async () => {
      if (confirmInput.value.trim() === vehicleNumber) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<div class="spinner" style="width: 16px; height: 16px; border-width: 2px; margin: 0 auto;"></div>';
        
        try {
          await this.permanentlyDeleteVehicle(vehicleId, vehicleNumber);
          closeDialog();
        } catch (error) {
          confirmBtn.disabled = false;
          confirmBtn.innerHTML = '<i data-lucide="trash-2" style="width: 16px; height: 16px;"></i> Permanently Delete';
          lucide.createIcons();
        }
      }
    });
    
    // Focus input
    setTimeout(() => confirmInput.focus(), 100);
  }

  async permanentlyDeleteVehicle(vehicleId, vehicleNumber) {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/permanent`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete vehicle');
      }
      
      // Show success message
      this.showToast(`Vehicle ${vehicleNumber} permanently deleted`, 'success');
      
      // Reload the table
      this.loadVehicles();
      
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      this.showToast(error.message || 'Failed to delete vehicle', 'error');
      throw error;
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
      z-index: 10002;
      animation: slideInRight 0.3s ease-out;
      font-weight: 600;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  async exportToCSV() {
    try {
      const selectedCheckboxes = document.querySelectorAll('.vehicle-checkbox:checked');
      const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);

      let vehiclesToExport = selectedIds.length > 0
        ? this.vehicles.filter(v => selectedIds.includes(v.id.toString()))
        : this.vehicles;

      if (vehiclesToExport.length === 0) {
        alert('No vehicles to export');
        return;
      }

      // Create CSV content
      const headers = ['Vehicle #', 'Make', 'Model', 'Year', 'Status', 'Driver', 'Mileage', 'Location', 'VIN'];
      const rows = vehiclesToExport.map(v => [
        v.vehicle_number,
        v.make || '',
        v.model || '',
        v.year || '',
        v.status || 'active',
        v.assigned_to || v.driver || '',
        v.current_mileage || '',
        v.location || '',
        v.vin || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vehicles-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export CSV');
    }
  }

  showLoading() {
    const tbody = document.getElementById('vehicles-tbody');
    const mobileCards = document.getElementById('mobile-cards');

    const loadingHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <div style="margin-top: 16px;">Loading vehicles...</div>
      </div>
    `;

    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="8">${loadingHTML}</td></tr>`;
    }
    if (mobileCards) {
      mobileCards.innerHTML = loadingHTML;
    }
  }

  showError(message) {
    const tbody = document.getElementById('vehicles-tbody');
    const mobileCards = document.getElementById('mobile-cards');

    const errorHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <i data-lucide="alert-circle" style="width: 64px; height: 64px; stroke-width: 1.5; color: var(--error);"></i>
        </div>
        <div class="empty-state-title">Error</div>
        <div class="empty-state-message">${message}</div>
      </div>
    `;

    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="8">${errorHTML}</td></tr>`;
    }
    if (mobileCards) {
      mobileCards.innerHTML = errorHTML;
    }

    lucide.createIcons();
  }
}

