// Professional Autocomplete Component for Vehicle Selection

class VehicleAutocomplete {
  constructor(inputElement, options = {}) {
    this.input = inputElement;
    this.options = options;
    this.vehicles = [];
    this.filteredVehicles = [];
    this.selectedIndex = -1;
    this.selectedVehicle = null;
    this.onSelect = options.onSelect || (() => {});
    
    this.init();
  }
  
  async init() {
    // Create wrapper and dropdown
    this.createElements();
    
    // Load vehicles
    await this.loadVehicles();
    
    // Setup event listeners
    this.setupEventListeners();
  }
  
  createElements() {
    // Wrap input in container
    const wrapper = document.createElement('div');
    wrapper.className = 'autocomplete-wrapper';
    this.input.parentNode.insertBefore(wrapper, this.input);
    wrapper.appendChild(this.input);
    
    // Add icon
    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', 'search');
    icon.className = 'autocomplete-icon';
    wrapper.appendChild(icon);
    
    // Add clear button
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'autocomplete-clear';
    clearBtn.innerHTML = '<i data-lucide="x" style="width: 16px; height: 16px;"></i>';
    wrapper.appendChild(clearBtn);
    
    // Create dropdown
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'autocomplete-dropdown';
    wrapper.appendChild(this.dropdown);
    
    this.wrapper = wrapper;
    this.clearBtn = clearBtn;
    
    // Initialize icons
    lucide.createIcons();
  }
  
  async loadVehicles() {
    try {
      this.dropdown.innerHTML = '<div class="autocomplete-loading"><div class="spinner"></div></div>';
      const response = await api.getVehicles({ limit: 9999, order: 'ASC' });
      this.vehicles = response.vehicles || response || [];
      console.log(`[Autocomplete] Loaded ${this.vehicles.length} vehicles`);
      
      // Update placeholder with vehicle count
      this.input.placeholder = `Search ${this.vehicles.length} vehicles...`;
    } catch (error) {
      console.error('[Autocomplete] Error loading vehicles:', error);
      this.dropdown.innerHTML = '<div class="autocomplete-no-results">Error loading vehicles</div>';
      this.input.placeholder = 'Error loading vehicles';
    }
  }
  
  setupEventListeners() {
    // Input events
    this.input.addEventListener('input', () => this.handleInput());
    this.input.addEventListener('focus', () => this.handleFocus());
    this.input.addEventListener('blur', () => this.handleBlur());
    this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
    
    // Clear button
    this.clearBtn.addEventListener('click', () => this.clear());
    
    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!this.wrapper.contains(e.target)) {
        this.hideDropdown();
      }
    });
  }
  
  handleInput() {
    const query = this.input.value.trim().toLowerCase();
    
    if (query.length === 0) {
      this.hideDropdown();
      this.selectedVehicle = null;
      this.input.classList.remove('has-value');
      return;
    }
    
    // Filter vehicles
    this.filteredVehicles = this.vehicles.filter(vehicle => {
      const vehicleNumber = String(vehicle.vehicle_number).toLowerCase();
      const make = (vehicle.make || '').toLowerCase();
      const model = (vehicle.model || '').toLowerCase();
      const year = String(vehicle.year || '');
      const description = (vehicle.description || '').toLowerCase();
      
      return vehicleNumber.includes(query) ||
             make.includes(query) ||
             model.includes(query) ||
             year.includes(query) ||
             description.includes(query);
    });
    
    this.selectedIndex = -1;
    this.renderDropdown();
    this.showDropdown();
  }
  
  handleFocus() {
    if (this.input.value.trim()) {
      this.handleInput();
    }
  }
  
  handleBlur() {
    // Delay to allow click on dropdown
    setTimeout(() => {
      if (!this.wrapper.contains(document.activeElement)) {
        this.hideDropdown();
      }
    }, 200);
  }
  
  handleKeydown(e) {
    if (!this.dropdown.classList.contains('visible')) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectNext();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.selectPrevious();
        break;
      case 'Enter':
        e.preventDefault();
        if (this.selectedIndex >= 0) {
          this.selectVehicle(this.filteredVehicles[this.selectedIndex]);
        }
        break;
      case 'Escape':
        this.hideDropdown();
        break;
    }
  }
  
  selectNext() {
    if (this.selectedIndex < this.filteredVehicles.length - 1) {
      this.selectedIndex++;
      this.updateSelection();
    }
  }
  
  selectPrevious() {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      this.updateSelection();
    }
  }
  
  updateSelection() {
    const items = this.dropdown.querySelectorAll('.autocomplete-item');
    items.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });
  }
  
  renderDropdown() {
    if (this.filteredVehicles.length === 0) {
      this.dropdown.innerHTML = '<div class="autocomplete-no-results">No vehicles found</div>';
      return;
    }
    
    // Add count header
    const countHeader = `
      <div style="padding: 8px 16px; background: var(--gray-50); border-bottom: 2px solid var(--gray-200); font-size: 13px; color: var(--gray-600); font-weight: 600;">
        ${this.filteredVehicles.length} vehicle${this.filteredVehicles.length !== 1 ? 's' : ''} found
      </div>
    `;
    
    const items = this.filteredVehicles.map((vehicle, index) => {
      const year = vehicle.year || 'N/A';
      const make = vehicle.make || '';
      const model = vehicle.model || '';
      const description = `${year} ${make} ${model}`.trim() || vehicle.description || 'No details';
      
      // Status badge
      const status = vehicle.status || 'active';
      const statusClass = this.getStatusClass(status);
      const statusLabel = this.formatStatus(status);
      
      // Driver info
      const driver = vehicle.assigned_to || vehicle.driver || '';
      
      // Location
      const location = vehicle.location || '';
      
      // Mileage
      const mileage = vehicle.current_mileage ? `${vehicle.current_mileage.toLocaleString()} mi` : '';
      
      // Build metadata line
      const metadata = [];
      if (driver) metadata.push(`<span class="autocomplete-meta-item"><i data-lucide="user" style="width: 12px; height: 12px;"></i> ${driver}</span>`);
      if (location) metadata.push(`<span class="autocomplete-meta-item"><i data-lucide="map-pin" style="width: 12px; height: 12px;"></i> ${location}</span>`);
      if (mileage) metadata.push(`<span class="autocomplete-meta-item"><i data-lucide="gauge" style="width: 12px; height: 12px;"></i> ${mileage}</span>`);
      
      return `
        <div class="autocomplete-item" data-index="${index}">
          <div class="autocomplete-item-header">
            <div class="autocomplete-item-number">#${vehicle.vehicle_number}</div>
            <span class="autocomplete-status-badge status-${statusClass}">${statusLabel}</span>
          </div>
          <div class="autocomplete-item-details">${description}</div>
          ${metadata.length > 0 ? `
            <div class="autocomplete-item-meta">
              ${metadata.join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
    
    this.dropdown.innerHTML = countHeader + items;
    
    // Attach click listeners
    this.dropdown.querySelectorAll('.autocomplete-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        this.selectVehicle(this.filteredVehicles[index]);
      });
    });
    
    // Initialize Lucide icons for the new items
    if (window.lucide) {
      lucide.createIcons();
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
    if (!status || status === 'active') return 'Active';
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
  
  selectVehicle(vehicle) {
    this.selectedVehicle = vehicle;
    this.input.value = vehicle.vehicle_number;
    this.input.classList.add('has-value');
    this.hideDropdown();
    
    // Trigger callback
    this.onSelect(vehicle);
    
    // Dispatch custom event
    this.input.dispatchEvent(new CustomEvent('vehicle-selected', {
      detail: vehicle,
      bubbles: true
    }));
  }
  
  clear() {
    this.input.value = '';
    this.selectedVehicle = null;
    this.input.classList.remove('has-value');
    this.hideDropdown();
    this.input.focus();
    
    // Trigger callback with null
    this.onSelect(null);
  }
  
  showDropdown() {
    this.dropdown.classList.add('visible');
  }
  
  hideDropdown() {
    this.dropdown.classList.remove('visible');
    this.selectedIndex = -1;
  }
  
  getSelectedVehicle() {
    return this.selectedVehicle;
  }
}

