class ScoutingApp {
    constructor() {
        this.currentReportId = null;
        this.reports = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadReports();
        this.showReportsView();
    }

    bindEvents() {
        // Navigation
        document.getElementById('newReportBtn').addEventListener('click', () => this.showNewReportForm());
        document.getElementById('backBtn').addEventListener('click', () => this.showReportsView());
        
        // Form actions
        document.getElementById('saveBtn').addEventListener('click', () => this.saveReport());
        document.getElementById('deleteBtn').addEventListener('click', () => this.deleteReport());
        
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => this.filterReports(e.target.value));
        
        // Form validation
        document.getElementById('scoutingForm').addEventListener('input', () => this.validateForm());
        
        // Auto-calculate age when date of birth changes
        document.getElementById('date_of_birth').addEventListener('change', () => this.calculateAge());
        
        // Auto-save draft every 30 seconds
        setInterval(() => this.saveDraft(), 30000);
        
        // Handle checkbox groups for recommended focus
        this.handleCheckboxGroup();
        
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('scout_date').value = today;
    }

    handleCheckboxGroup() {
        const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateRecommendedFocus();
            });
        });
    }

    updateRecommendedFocus() {
        const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked');
        const values = Array.from(checkboxes).map(cb => cb.value);
        const focusField = document.getElementById('recommended_focus');
        if (focusField) {
            focusField.value = values.join(', ');
        }
    }

    calculateAge() {
        const dobInput = document.getElementById('date_of_birth');
        const ageInput = document.getElementById('age');
        
        if (!dobInput.value) {
            ageInput.value = '';
            return;
        }
        
        const birthDate = new Date(dobInput.value);
        const today = new Date();
        
        // Calculate age
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        // Adjust if birthday hasn't occurred this year yet
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        // Only set age if it's reasonable (between 0 and 18 for youth baseball)
        if (age >= 0 && age <= 18) {
            ageInput.value = age;
            
            // Add a subtle visual feedback
            ageInput.style.backgroundColor = '#e8f5e8';
            setTimeout(() => {
                ageInput.style.backgroundColor = '';
            }, 1000);
        } else {
            ageInput.value = '';
        }
    }

    async loadReports() {
        try {
            this.showLoading('reportsList');
            const response = await fetch('/api/reports');
            
            if (!response.ok) {
                throw new Error('Failed to load reports');
            }
            
            this.reports = await response.json();
            this.renderReports();
        } catch (error) {
            this.showError('Failed to load reports: ' + error.message);
            console.error('Error loading reports:', error);
        }
    }

    renderReports(filteredReports = null) {
        const reportsContainer = document.getElementById('reportsList');
        const reportsToShow = filteredReports || this.reports;
        
        if (reportsToShow.length === 0) {
            reportsContainer.innerHTML = `
                <div class="no-reports">
                    <h3>No scouting reports found</h3>
                    <p>Click "New Report" to create your first scouting report.</p>
                </div>
            `;
            return;
        }
        
        reportsContainer.innerHTML = reportsToShow.map(report => `
            <div class="report-card" onclick="app.editReport(${report.id})">
                <h3>${report.player_name || 'Unnamed Player'}</h3>
                <div class="report-meta">
                    ${this.formatDate(report.scout_date)} • ${report.team || 'No Team'}
                </div>
                <div class="report-info">
                    <span class="position-badge">${report.primary_position || 'N/A'}</span>
                    <small>Created: ${this.formatDate(report.created_at)}</small>
                </div>
            </div>
        `).join('');
    }

    filterReports(searchTerm) {
        if (!searchTerm.trim()) {
            this.renderReports();
            return;
        }
        
        const filtered = this.reports.filter(report => 
            (report.player_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (report.team || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (report.primary_position || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.renderReports(filtered);
    }

    showReportsView() {
        document.getElementById('reportsView').classList.add('active');
        document.getElementById('formView').classList.remove('active');
        this.loadReports();
    }

    showNewReportForm() {
        this.currentReportId = null;
        document.getElementById('formTitle').textContent = 'New Scouting Report';
        document.getElementById('deleteBtn').style.display = 'none';
        this.clearForm();
        this.showFormView();
    }

    showFormView() {
        document.getElementById('reportsView').classList.remove('active');
        document.getElementById('formView').classList.add('active');
        
        // Focus on player name field
        setTimeout(() => {
            document.getElementById('player_name').focus();
        }, 100);
    }

    async editReport(reportId) {
        try {
            this.currentReportId = reportId;
            document.getElementById('formTitle').textContent = 'Edit Scouting Report';
            document.getElementById('deleteBtn').style.display = 'inline-block';
            
            const response = await fetch(`/api/reports/${reportId}`);
            if (!response.ok) {
                throw new Error('Failed to load report');
            }
            
            const report = await response.json();
            this.populateForm(report);
            this.showFormView();
        } catch (error) {
            this.showError('Failed to load report: ' + error.message);
            console.error('Error loading report:', error);
        }
    }

    populateForm(report) {
        // Populate all form fields
        Object.keys(report).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = report[key];
                } else {
                    element.value = report[key] || '';
                }
            }
        });
        
        // Handle recommended focus checkboxes
        if (report.recommended_focus) {
            const focusAreas = report.recommended_focus.split(', ');
            const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = focusAreas.includes(checkbox.value);
            });
            
            // Update the hidden field
            const focusField = document.getElementById('recommended_focus');
            if (focusField) {
                focusField.value = report.recommended_focus;
            }
        }
        
        // Format dates properly
        if (report.scout_date) {
            document.getElementById('scout_date').value = this.formatDateForInput(report.scout_date);
        }
        if (report.date_of_birth) {
            document.getElementById('date_of_birth').value = this.formatDateForInput(report.date_of_birth);
        }
        if (report.next_evaluation_date) {
            document.getElementById('next_evaluation_date').value = this.formatDateForInput(report.next_evaluation_date);
        }
    }

    clearForm() {
        document.getElementById('scoutingForm').reset();
        
        // Clear checkboxes
        const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Set default date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('scout_date').value = today;
    }

    async saveReport() {
        if (!this.validateForm()) {
            this.showError('Please fill in all required fields');
            return;
        }
        
        try {
            const formData = this.getFormData();
            const url = this.currentReportId ? `/api/reports/${this.currentReportId}` : '/api/reports';
            const method = this.currentReportId ? 'PUT' : 'POST';
            
            document.getElementById('saveBtn').textContent = 'Saving...';
            document.getElementById('saveBtn').disabled = true;
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to save report');
            }
            
            const result = await response.json();
            
            this.showSuccess(this.currentReportId ? 'Report updated successfully!' : 'Report created successfully!');
            
            // If it's a new report, set the current ID
            if (!this.currentReportId && result.id) {
                this.currentReportId = result.id;
                document.getElementById('formTitle').textContent = 'Edit Scouting Report';
                document.getElementById('deleteBtn').style.display = 'inline-block';
            }
            
            // Clear any draft
            this.clearDraft();
            
        } catch (error) {
            this.showError('Failed to save report: ' + error.message);
            console.error('Error saving report:', error);
        } finally {
            document.getElementById('saveBtn').textContent = 'Save Report';
            document.getElementById('saveBtn').disabled = false;
        }
    }

    async deleteReport() {
        if (!this.currentReportId) return;
        
        if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
            return;
        }
        
        try {
            document.getElementById('deleteBtn').textContent = 'Deleting...';
            document.getElementById('deleteBtn').disabled = true;
            
            const response = await fetch(`/api/reports/${this.currentReportId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete report');
            }
            
            this.showSuccess('Report deleted successfully!');
            this.showReportsView();
            
        } catch (error) {
            this.showError('Failed to delete report: ' + error.message);
            console.error('Error deleting report:', error);
        } finally {
            document.getElementById('deleteBtn').textContent = 'Delete';
            document.getElementById('deleteBtn').disabled = false;
        }
    }

    getFormData() {
        const formData = {};
        const form = document.getElementById('scoutingForm');
        const formElements = form.querySelectorAll('input, select, textarea');
        
        formElements.forEach(element => {
            if (element.type === 'checkbox' && !element.name.startsWith('focus_')) {
                formData[element.name] = element.checked;
            } else if (element.type !== 'checkbox') {
                formData[element.name] = element.value || null;
            }
        });
        
        // Handle recommended focus areas
        this.updateRecommendedFocus();
        const focusField = document.getElementById('recommended_focus');
        if (focusField) {
            formData.recommended_focus = focusField.value;
        }
        
        return formData;
    }

    validateForm() {
        const playerName = document.getElementById('player_name').value.trim();
        return playerName.length > 0;
    }

    saveDraft() {
        if (!this.currentReportId) {
            const formData = this.getFormData();
            if (formData.player_name && formData.player_name.trim()) {
                localStorage.setItem('scoutingDraft', JSON.stringify(formData));
            }
        }
    }

    clearDraft() {
        localStorage.removeItem('scoutingDraft');
    }

    loadDraft() {
        const draft = localStorage.getItem('scoutingDraft');
        if (draft && !this.currentReportId) {
            try {
                const formData = JSON.parse(draft);
                Object.keys(formData).forEach(key => {
                    const element = document.getElementById(key);
                    if (element && formData[key]) {
                        element.value = formData[key];
                    }
                });
                this.showSuccess('Draft loaded automatically');
            } catch (error) {
                console.error('Error loading draft:', error);
            }
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }

    showLoading(containerId) {
        document.getElementById(containerId).innerHTML = `
            <div class="loading">
                <div>Loading...</div>
            </div>
        `;
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        // Remove any existing messages
        const existingMessages = document.querySelectorAll('.error, .success');
        existingMessages.forEach(msg => msg.remove());
        
        const messageDiv = document.createElement('div');
        messageDiv.className = type;
        messageDiv.textContent = message;
        
        const container = document.querySelector('.view.active');
        container.insertBefore(messageDiv, container.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
        
        // Scroll to top to show message
        container.scrollTop = 0;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ScoutingApp();
});

// Add some additional CSS for the no-reports message
const style = document.createElement('style');
style.textContent = `
    .no-reports {
        text-align: center;
        padding: 3rem;
        color: #7f8c8d;
    }
    
    .no-reports h3 {
        margin-bottom: 1rem;
        color: #2c3e50;
    }
    
    .no-reports p {
        font-size: 1.1rem;
    }
`;
document.head.appendChild(style);