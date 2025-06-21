class ScoutingApp {
    constructor() {
        this.currentReportId = null;
        this.reports = [];
        this.currentUser = null;
        this.init();
    }

    init() {
        this.bindAuthEvents();
        this.checkAuthentication();
    }

    bindAuthEvents() {
        // Authentication form switches
        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });
        
        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });
        
        // Form submissions
        document.getElementById('loginFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        document.getElementById('registerFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
        
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });
        
        // Team selection change (for registration code)
        document.getElementById('registerGroup').addEventListener('change', (e) => {
            this.handleTeamSelection(e.target.value);
        });
        
        // Load groups for registration
        this.loadGroups();
    }

    bindAppEvents() {
        // Navigation
        document.getElementById('newReportBtn').addEventListener('click', () => this.showNewReportForm());
        document.getElementById('backBtn').addEventListener('click', () => this.showReportsView());
        
        // Admin navigation
        document.getElementById('adminBtn').addEventListener('click', () => this.showAdminView());
        document.getElementById('adminBackBtn').addEventListener('click', () => this.showReportsView());
        
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
        
        // Admin tabs
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchAdminTab(e.target.dataset.tab));
        });
        
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('scout_date').value = today;
    }

    async checkAuthentication() {
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.showMainApp();
            } else {
                this.showAuthView();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showAuthView();
        }
    }

    async loadGroups() {
        try {
            const response = await fetch('/api/groups');
            if (response.ok) {
                const groups = await response.json();
                const groupSelect = document.getElementById('registerGroup');
                groupSelect.innerHTML = '<option value="">Select your team...</option>';
                
                this.groups = groups; // Store for later use
                
                groups.forEach(group => {
                    const option = document.createElement('option');
                    option.value = group.id;
                    option.textContent = group.name;
                    option.dataset.requiresCode = group.requires_code;
                    groupSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to load groups:', error);
        }
    }

    handleTeamSelection(groupId) {
        const codeGroup = document.getElementById('registrationCodeGroup');
        const codeInput = document.getElementById('registrationCode');
        
        if (groupId) {
            const selectedGroup = this.groups?.find(g => g.id == groupId);
            if (selectedGroup && selectedGroup.requires_code) {
                codeGroup.style.display = 'block';
                codeInput.required = true;
            } else {
                codeGroup.style.display = 'none';
                codeInput.required = false;
                codeInput.value = '';
            }
        } else {
            codeGroup.style.display = 'none';
            codeInput.required = false;
            codeInput.value = '';
        }
    }

    showAuthView() {
        document.getElementById('authView').classList.add('active');
        document.getElementById('mainApp').classList.remove('active');
    }

    showMainApp() {
        document.getElementById('authView').classList.remove('active');
        document.getElementById('mainApp').classList.add('active');
        
        // Update UI with user info
        this.updateUserInfo();
        
        // Bind main app events
        this.bindAppEvents();
        
        // Load reports and show main view
        this.loadReports();
        this.showReportsView();
    }

    updateUserInfo() {
        if (this.currentUser) {
            const userInfoText = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
            document.getElementById('userInfo').textContent = userInfoText;
            
            if (this.currentUser.groupName) {
                document.getElementById('teamName').textContent = this.currentUser.groupName;
            }
            
            // Show admin button for admin users
            const adminBtn = document.getElementById('adminBtn');
            if (this.currentUser.isAdmin) {
                adminBtn.style.display = 'inline-block';
            } else {
                adminBtn.style.display = 'none';
            }
            
            // Handle unapproved users
            if (!this.currentUser.isApproved) {
                this.showPendingApprovalMessage();
            }
        }
    }

    showPendingApprovalMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'pending-approval-banner';
        messageDiv.innerHTML = `
            <div class="approval-message">
                <strong>⏳ Account Pending Approval</strong>
                <p>Your account is waiting for admin approval. You cannot create or view scouting reports until approved.</p>
            </div>
        `;
        
        const mainApp = document.getElementById('mainApp');
        mainApp.insertBefore(messageDiv, mainApp.firstChild);
    }

    showLoginForm() {
        document.getElementById('loginForm').classList.add('active');
        document.getElementById('registerForm').classList.remove('active');
    }

    showRegisterForm() {
        document.getElementById('registerForm').classList.add('active');
        document.getElementById('loginForm').classList.remove('active');
    }

    async handleLogin() {
        const form = document.getElementById('loginFormElement');
        const formData = new FormData(form);
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: formData.get('email'),
                    password: formData.get('password')
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.currentUser = data.user;
                this.showMainApp();
                this.showSuccess('Login successful!');
            } else {
                this.showError(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed. Please try again.');
        }
    }

    async handleRegister() {
        const form = document.getElementById('registerFormElement');
        const formData = new FormData(form);
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    firstName: formData.get('firstName'),
                    lastName: formData.get('lastName'),
                    email: formData.get('email'),
                    password: formData.get('password'),
                    groupId: formData.get('groupId'),
                    registrationCode: formData.get('registrationCode')
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                if (data.requiresApproval) {
                    this.showSuccess('Registration successful! Your account is pending admin approval. Please contact your team administrator.');
                } else {
                    this.showSuccess('Registration successful! You can now login.');
                }
                this.showLoginForm();
                form.reset();
                this.handleTeamSelection(''); // Reset registration code visibility
            } else {
                this.showError(data.error || 'Registration failed');
                
                // If registration code is required, show the field
                if (data.requiresCode) {
                    document.getElementById('registrationCodeGroup').style.display = 'block';
                    document.getElementById('registrationCode').required = true;
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('Registration failed. Please try again.');
        }
    }

    async handleLogout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            
            this.currentUser = null;
            this.showAuthView();
            this.showLoginForm();
            
            // Clear any cached data
            this.reports = [];
            this.currentReportId = null;
            
        } catch (error) {
            console.error('Logout error:', error);
            this.showError('Logout failed');
        }
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
            const response = await fetch('/api/reports', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.showAuthView();
                    return;
                }
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
                    ${report.first_name && report.last_name ? 
                        `<br>Scout: ${report.first_name} ${report.last_name}` : ''}
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
        document.getElementById('adminView').classList.remove('active');
        
        // Only load reports if user is approved
        if (this.currentUser && this.currentUser.isApproved) {
            this.loadReports();
        } else {
            // Show message for unapproved users
            const reportsContainer = document.getElementById('reportsList');
            reportsContainer.innerHTML = `
                <div class="no-reports">
                    <h3>Account Pending Approval</h3>
                    <p>You cannot view scouting reports until your account is approved by a team administrator.</p>
                </div>
            `;
        }
    }

    showAdminView() {
        document.getElementById('reportsView').classList.remove('active');
        document.getElementById('formView').classList.remove('active');
        document.getElementById('adminView').classList.add('active');
        
        // Load admin data
        this.loadPendingUsers();
        this.loadTeamsAdmin();
    }

    switchAdminTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');
        
        // Load appropriate data
        if (tabName === 'pending') {
            this.loadPendingUsers();
        } else if (tabName === 'teams') {
            this.loadTeamsAdmin();
        }
    }

    async loadPendingUsers() {
        try {
            const response = await fetch('/api/admin/pending-users', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const users = await response.json();
                this.renderPendingUsers(users);
            } else {
                console.error('Failed to load pending users');
            }
        } catch (error) {
            console.error('Error loading pending users:', error);
        }
    }

    renderPendingUsers(users) {
        const container = document.getElementById('pendingUsersList');
        
        if (users.length === 0) {
            container.innerHTML = `
                <div class="no-pending-users">
                    <h3>No pending approvals</h3>
                    <p>All registered users have been approved.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = users.map(user => `
            <div class="pending-user-card">
                <div class="user-info-header">
                    <div>
                        <div class="user-name">${user.first_name} ${user.last_name}</div>
                        <div class="user-email">${user.email} • ${user.group_name}</div>
                        <small>Registered: ${this.formatDate(user.created_at)}</small>
                    </div>
                    <div class="approval-actions">
                        <button class="btn btn-approve" onclick="app.approveUser(${user.id}, true)">
                            Approve
                        </button>
                        <button class="btn btn-deny" onclick="app.approveUser(${user.id}, false)">
                            Deny
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async approveUser(userId, approved) {
        try {
            const response = await fetch(`/api/admin/approve-user/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ approved })
            });
            
            if (response.ok) {
                const message = approved ? 'User approved successfully!' : 'User registration denied and removed.';
                this.showSuccess(message);
                this.loadPendingUsers(); // Refresh the list
            } else {
                this.showError('Failed to process user approval');
            }
        } catch (error) {
            console.error('Error processing user approval:', error);
            this.showError('Failed to process user approval');
        }
    }

    async loadTeamsAdmin() {
        try {
            const response = await fetch('/api/admin/teams', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const teams = await response.json();
                this.renderTeamsAdmin(teams);
            } else {
                console.error('Failed to load teams');
            }
        } catch (error) {
            console.error('Error loading teams:', error);
        }
    }

    renderTeamsAdmin(teams) {
        const container = document.getElementById('teamsList');
        
        container.innerHTML = teams.map(team => `
            <div class="team-card">
                <div class="team-info-header">
                    <div>
                        <div class="team-name">${team.name}</div>
                        <div class="team-details">${team.description || 'No description'}</div>
                        <small>${team.member_count} members</small>
                    </div>
                    <div class="team-actions">
                        ${team.registration_code ? 
                            `<span class="team-code">${team.registration_code}</span>` : 
                            '<span class="status-badge">No Code Required</span>'
                        }
                    </div>
                </div>
                <div class="team-settings">
                    <div class="setting-row">
                        <span class="setting-label">Registration Code:</span>
                        <span class="setting-value">${team.registration_code || 'None'}</span>
                    </div>
                    <div class="setting-row">
                        <span class="setting-label">Public Registration:</span>
                        <span class="setting-value">${team.allow_public_registration ? 'Enabled' : 'Disabled'}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    showNewReportForm() {
        // Check if user is approved
        if (!this.currentUser || !this.currentUser.isApproved) {
            this.showError('You cannot create reports until your account is approved.');
            return;
        }
        
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
        // Check if user is approved
        if (!this.currentUser || !this.currentUser.isApproved) {
            this.showError('You cannot edit reports until your account is approved.');
            return;
        }
        
        try {
            this.currentReportId = reportId;
            document.getElementById('formTitle').textContent = 'Edit Scouting Report';
            document.getElementById('deleteBtn').style.display = 'inline-block';
            
            const response = await fetch(`/api/reports/${reportId}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.showAuthView();
                    return;
                }
                if (response.status === 403) {
                    this.showError('You do not have permission to edit this report.');
                    return;
                }
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
        
        // Set scout name to current user if available
        if (this.currentUser) {
            document.getElementById('scout_name').value = 
                `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        }
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
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.showAuthView();
                    return;
                }
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
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.showAuthView();
                    return;
                }
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
        
        // Find the active container
        const authView = document.getElementById('authView');
        const mainApp = document.getElementById('mainApp');
        const container = authView.classList.contains('active') ? 
            authView.querySelector('.auth-container') : 
            document.querySelector('.view.active') || mainApp;
        
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