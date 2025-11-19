// API Client

const API_BASE = '/api';

class ApiClient {
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Request failed');
      }
      
      // Handle different content types
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
  
  // Reports
  async getReports(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reports${query ? '?' + query : ''}`);
  }
  
  async getReport(id) {
    return this.request(`/reports/${id}`);
  }
  
  async createReport(data) {
    return this.request('/reports', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  async updateReport(id, data) {
    return this.request(`/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  async deleteReport(id) {
    return this.request(`/reports/${id}`, {
      method: 'DELETE'
    });
  }
  
  async getStatistics() {
    return this.request('/reports/statistics');
  }
  
  // Vehicles
  async getVehicles(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/vehicles?${queryString}` : '/vehicles';
    return this.request(url);
  }
  
  async getVehicle(number) {
    return this.request(`/vehicles/${number}`);
  }
  
  // Export
  async exportReportPDF(id) {
    const response = await fetch(`${API_BASE}/export/report/${id}/pdf`);
    if (!response.ok) {
      throw new Error('Export failed');
    }
    return response.blob();
  }
  
  async exportReportsCSV(reportIds = []) {
    const response = await fetch(`${API_BASE}/export/reports/csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportIds })
    });
    if (!response.ok) {
      throw new Error('Export failed');
    }
    return response.blob();
  }
  
  async exportAllReportsCSV() {
    const response = await fetch(`${API_BASE}/export/reports/csv`);
    if (!response.ok) {
      throw new Error('Export failed');
    }
    return response.blob();
  }
}

const api = new ApiClient();

