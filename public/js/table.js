// Table rendering and interaction

class ReportsTable {
  constructor() {
    this.currentPage = 1;
    this.pageSize = 25;
    this.sortBy = 'inspection_date';
    this.sortOrder = 'DESC';
    this.filters = {};
    this.selectedReports = new Set();
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.loadReports();
  }
  
  setupEventListeners() {
    // Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.filters.search = e.target.value;
          this.currentPage = 1;
          this.loadReports();
        }, 300);
      });
    }
    
    // Filters
    const vehicleFilter = document.getElementById('vehicle-filter');
    if (vehicleFilter) {
      vehicleFilter.addEventListener('change', (e) => {
        this.filters.vehicle = e.target.value;
        this.currentPage = 1;
        this.loadReports();
      });
    }
    
    const dateFromFilter = document.getElementById('date-from-filter');
    if (dateFromFilter) {
      dateFromFilter.addEventListener('change', (e) => {
        this.filters.dateFrom = e.target.value;
        this.currentPage = 1;
        this.loadReports();
      });
    }
    
    const dateToFilter = document.getElementById('date-to-filter');
    if (dateToFilter) {
      dateToFilter.addEventListener('change', (e) => {
        this.filters.dateTo = e.target.value;
        this.currentPage = 1;
        this.loadReports();
      });
    }
    
    // Page size
    const pageSizeSelect = document.getElementById('page-size');
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener('change', (e) => {
        this.pageSize = Number(e.target.value);
        this.currentPage = 1;
        this.loadReports();
      });
    }
    
    // Export buttons
    document.getElementById('export-all-btn')?.addEventListener('click', () => {
      this.exportAll();
    });
    
    document.getElementById('export-selected-btn')?.addEventListener('click', () => {
      this.exportSelected();
    });
    
    // Clear filters
    document.getElementById('clear-filters-btn')?.addEventListener('click', () => {
      this.clearFilters();
    });
  }
  
  async loadReports() {
    this.showLoading();
    
    try {
      const params = {
        page: this.currentPage,
        limit: this.pageSize,
        sortBy: this.sortBy,
        order: this.sortOrder,
        ...this.filters
      };
      
      const result = await api.getReports(params);
      this.renderTable(result.reports);
      this.renderPagination(result.pagination);
      
    } catch (error) {
      this.showError(error.message);
    }
  }
  
  renderTable(reports) {
    const tbody = document.getElementById('reports-tbody');
    const mobileCards = document.getElementById('mobile-cards');
    
    if (!tbody) return;
    
    if (reports.length === 0) {
      const emptyState = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i data-lucide="clipboard" style="width: 64px; height: 64px; stroke-width: 1.5;"></i>
          </div>
          <div class="empty-state-title">No reports found</div>
          <div class="empty-state-message">Try adjusting your filters or create a new report</div>
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
    tbody.innerHTML = reports.map(report => this.renderRow(report)).join('');
    
    // Render mobile cards
    if (mobileCards) {
      mobileCards.innerHTML = reports.map(report => this.renderMobileCard(report)).join('');
    }
    
    // Initialize icons
    lucide.createIcons();
    
    // Attach event listeners to action buttons
    this.attachRowEventListeners();
  }
  
  renderRow(report) {
    const status = this.getReportStatus(report);
    const statusClass = status.toLowerCase();
    
    return `
      <tr data-report-id="${report.id}">
        <td>
          <input type="checkbox" class="report-checkbox" value="${report.id}">
        </td>
        <td>${report.id}</td>
        <td><strong>${report.vehicle_number}</strong></td>
        <td>${this.formatDate(report.inspection_date)}</td>
        <td>${report.inspector_name}</td>
        <td class="hide-mobile">${report.mileage || '-'}</td>
        <td>
          <span class="status-badge status-${statusClass}">${status}</span>
        </td>
        <td class="actions">
          <button class="btn btn-sm btn-primary view-vehicle-btn" data-vehicle-number="${report.vehicle_number}" title="View Vehicle Details">
            <i data-lucide="truck" style="width: 14px; height: 14px;"></i>
            Vehicle
          </button>
          <button class="btn btn-sm btn-secondary view-btn" data-id="${report.id}">
            <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
            View
          </button>
          <button class="btn btn-sm btn-secondary edit-btn" data-id="${report.id}">
            <i data-lucide="edit" style="width: 14px; height: 14px;"></i>
            Edit
          </button>
          <button class="btn btn-sm btn-primary export-pdf-btn" data-id="${report.id}">
            <i data-lucide="file-text" style="width: 14px; height: 14px;"></i>
            PDF
          </button>
          <button class="btn btn-sm btn-danger delete-btn" data-id="${report.id}">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            Delete
          </button>
        </td>
      </tr>
    `;
  }
  
  renderMobileCard(report) {
    const status = this.getReportStatus(report);
    const statusClass = status.toLowerCase();
    
    return `
      <div class="mobile-card" data-report-id="${report.id}">
        <div class="mobile-card-header">
          <div>
            <div class="mobile-card-title">${report.vehicle_number}</div>
            <div class="mobile-card-subtitle">Report #${report.id}</div>
          </div>
          <input type="checkbox" class="mobile-card-checkbox report-checkbox" value="${report.id}">
        </div>
        
        <div class="mobile-card-body">
          <div class="mobile-card-field">
            <span class="mobile-card-field-label">Date</span>
            <span class="mobile-card-field-value">${this.formatDate(report.inspection_date)}</span>
          </div>
          <div class="mobile-card-field">
            <span class="mobile-card-field-label">Inspector</span>
            <span class="mobile-card-field-value">${report.inspector_name}</span>
          </div>
          <div class="mobile-card-field">
            <span class="mobile-card-field-label">Mileage</span>
            <span class="mobile-card-field-value">${report.mileage || '-'}</span>
          </div>
          <div class="mobile-card-field">
            <span class="mobile-card-field-label">Status</span>
            <span class="status-badge status-${statusClass}">${status}</span>
          </div>
        </div>
        
        <div class="mobile-card-actions">
          <button class="btn btn-sm btn-primary view-vehicle-btn" data-vehicle-number="${report.vehicle_number}">
            <i data-lucide="truck" style="width: 14px; height: 14px;"></i>
            View Vehicle
          </button>
          <button class="btn btn-sm btn-secondary view-btn" data-id="${report.id}">
            <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
            View
          </button>
          <button class="btn btn-sm btn-secondary edit-btn" data-id="${report.id}">
            <i data-lucide="edit" style="width: 14px; height: 14px;"></i>
            Edit
          </button>
          <button class="btn btn-sm btn-primary export-pdf-btn" data-id="${report.id}">
            <i data-lucide="file-text" style="width: 14px; height: 14px;"></i>
            PDF
          </button>
          <button class="btn btn-sm btn-danger delete-btn" data-id="${report.id}">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            Delete
          </button>
        </div>
      </div>
    `;
  }
  
  attachRowEventListeners() {
    // Checkboxes
    document.querySelectorAll('.report-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const id = e.target.value;
        if (e.target.checked) {
          this.selectedReports.add(id);
        } else {
          this.selectedReports.delete(id);
        }
        this.updateBulkActions();
      });
    });
    
    // View Vehicle buttons
    document.querySelectorAll('.view-vehicle-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const vehicleNumber = e.target.closest('button').dataset.vehicleNumber;
        await this.viewVehicle(vehicleNumber);
      });
    });
    
    // View buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('button').dataset.id;
        this.viewReport(id);
      });
    });
    
    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('button').dataset.id;
        this.editReport(id);
      });
    });
    
    // Export PDF buttons
    document.querySelectorAll('.export-pdf-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('button').dataset.id;
        this.exportReportPDF(id);
      });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('button').dataset.id;
        this.deleteReport(id);
      });
    });
    
    // Sortable headers
    document.querySelectorAll('.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const sortField = th.dataset.sort;
        this.handleSort(sortField);
      });
    });
  }
  
  renderPagination(pagination) {
    const info = document.getElementById('pagination-info');
    const controls = document.getElementById('pagination-controls');
    
    if (!info || !controls) return;
    
    // Update info
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    info.textContent = `Showing ${start}-${end} of ${pagination.total} reports`;
    
    // Render pagination buttons
    const pages = [];
    const maxButtons = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxButtons / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    // Previous button
    pages.push(`
      <button class="pagination-btn" ${pagination.page === 1 ? 'disabled' : ''} 
              onclick="reportsTable.goToPage(${pagination.page - 1})">
        ‹
      </button>
    `);
    
    // First page
    if (startPage > 1) {
      pages.push(`
        <button class="pagination-btn" onclick="reportsTable.goToPage(1)">1</button>
      `);
      if (startPage > 2) {
        pages.push(`<span class="pagination-ellipsis">...</span>`);
      }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(`
        <button class="pagination-btn ${i === pagination.page ? 'active' : ''}" 
                onclick="reportsTable.goToPage(${i})">
          ${i}
        </button>
      `);
    }
    
    // Last page
    if (endPage < pagination.totalPages) {
      if (endPage < pagination.totalPages - 1) {
        pages.push(`<span class="pagination-ellipsis">...</span>`);
      }
      pages.push(`
        <button class="pagination-btn" onclick="reportsTable.goToPage(${pagination.totalPages})">
          ${pagination.totalPages}
        </button>
      `);
    }
    
    // Next button
    pages.push(`
      <button class="pagination-btn" ${pagination.page === pagination.totalPages ? 'disabled' : ''} 
              onclick="reportsTable.goToPage(${pagination.page + 1})">
        ›
      </button>
    `);
    
    controls.innerHTML = pages.join('');
  }
  
  goToPage(page) {
    this.currentPage = page;
    this.loadReports();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  handleSort(field) {
    if (this.sortBy === field) {
      // Toggle order
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = field;
      this.sortOrder = 'DESC';
    }
    
    // Update UI
    document.querySelectorAll('.sortable').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (th.dataset.sort === field) {
        th.classList.add(this.sortOrder === 'ASC' ? 'sort-asc' : 'sort-desc');
      }
    });
    
    this.currentPage = 1;
    this.loadReports();
  }
  
  async viewReport(id) {
    try {
      const report = await api.getReport(id);
      this.showReportModal(report);
    } catch (error) {
      alert('Failed to load report: ' + error.message);
    }
  }
  
  editReport(id) {
    // Redirect to form with report ID as query parameter
    window.location.href = `/report-form?edit=${id}`;
  }
  
  showReportModal(report) {
    // Create a simple modal to display report details
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 32px;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      width: 100%;
    `;
    
    modalContent.innerHTML = `
      <h2 style="margin-bottom: 24px;">Report #${report.id} - ${report.vehicle_number}</h2>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; font-size: 14px;">
        <div><strong>Date:</strong> ${this.formatDate(report.inspection_date)}</div>
        <div><strong>Inspector:</strong> ${report.inspector_name}</div>
        <div><strong>Make:</strong> ${report.make || 'N/A'}</div>
        <div><strong>Year:</strong> ${report.year || 'N/A'}</div>
        <div><strong>Mileage:</strong> ${report.mileage || 'N/A'}</div>
        <div><strong>Status:</strong> ${this.getReportStatus(report)}</div>
      </div>
      ${report.defects ? `<div style="margin-top: 20px;"><strong>Defects:</strong><br>${report.defects}</div>` : ''}
      <div style="margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end;">
        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
        <button class="btn btn-primary" onclick="reportsTable.exportReportPDF(${report.id})">
          <i data-lucide="file-text" style="width: 16px; height: 16px;"></i>
          Export PDF
        </button>
      </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    lucide.createIcons();
    
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  async exportReportPDF(id) {
    try {
      const blob = await api.exportReportPDF(id);
      this.downloadFile(blob, `report-${id}.pdf`);
    } catch (error) {
      alert('Failed to export report: ' + error.message);
    }
  }
  
  async exportSelected() {
    if (this.selectedReports.size === 0) {
      alert('Please select reports to export');
      return;
    }
    
    try {
      const reportIds = Array.from(this.selectedReports);
      const blob = await api.exportReportsCSV(reportIds);
      this.downloadFile(blob, 'selected-reports.csv');
    } catch (error) {
      alert('Failed to export reports: ' + error.message);
    }
  }
  
  async exportAll() {
    try {
      const blob = await api.exportAllReportsCSV();
      this.downloadFile(blob, 'all-reports.csv');
    } catch (error) {
      alert('Failed to export reports: ' + error.message);
    }
  }
  
  async deleteReport(id) {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }
    
    try {
      await api.deleteReport(id);
      this.loadReports();
    } catch (error) {
      alert('Failed to delete report: ' + error.message);
    }
  }
  
  downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
  
  clearFilters() {
    this.filters = {};
    this.currentPage = 1;
    
    // Clear filter inputs
    document.getElementById('search-input').value = '';
    document.getElementById('vehicle-filter').value = '';
    document.getElementById('date-from-filter').value = '';
    document.getElementById('date-to-filter').value = '';
    
    this.loadReports();
  }
  
  updateBulkActions() {
    const bulkActions = document.getElementById('bulk-actions');
    if (bulkActions) {
      if (this.selectedReports.size > 0) {
        bulkActions.classList.add('visible');
        document.getElementById('bulk-actions-count').textContent = this.selectedReports.size;
      } else {
        bulkActions.classList.remove('visible');
      }
    }
  }
  
  getReportStatus(report) {
    if (report.defects && report.defects.trim()) {
      return 'ATTENTION';
    }
    return 'PASS';
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
  
  showLoading() {
    const tbody = document.getElementById('reports-tbody');
    const mobileCards = document.getElementById('mobile-cards');
    
    const loadingHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p style="margin-top: 16px;">Loading reports...</p>
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
    const tbody = document.getElementById('reports-tbody');
    const mobileCards = document.getElementById('mobile-cards');
    
    const errorHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <i data-lucide="alert-triangle" style="width: 64px; height: 64px; stroke-width: 1.5; color: var(--error);"></i>
        </div>
        <div class="empty-state-title">Error Loading Reports</div>
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
  
  async viewVehicle(vehicleNumber) {
    try {
      // Fetch all vehicles and find the one with this vehicle_number
      const response = await api.getVehicles({ search: vehicleNumber, limit: 1 });
      const vehicle = response.vehicles?.[0];
      
      if (vehicle && vehicle.vehicle_number === vehicleNumber) {
        // Redirect to vehicle management page with the vehicle ID
        window.location.href = `/vehicle-management?vehicleId=${vehicle.id}`;
      } else {
        alert(`Vehicle ${vehicleNumber} not found in the system.`);
      }
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      alert('Failed to load vehicle details. Please try again.');
    }
  }
}

// Initialize table when DOM is ready
let reportsTable;
document.addEventListener('DOMContentLoaded', () => {
  reportsTable = new ReportsTable();
});

