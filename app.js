// Main Application Logic for Smart Attendance System
class SmartAttendanceApp {
    constructor() {
        this.currentPage = 'home';
        this.faceRecognition = null;
        this.geolocationService = null;
        this.databaseService = null;
        this.isInitialized = false;
    }

    // Initialize the application
    async initialize() {
        try {
            console.log('Initializing Smart Attendance System...');
            
            // Wait for Firebase to be available
            await this.waitForFirebase();
            
            // Initialize services
            this.faceRecognition = window.FaceRecognition;
            this.geolocationService = window.GeolocationService;
            this.databaseService = window.DatabaseService;
            
            // Load admin location settings
            await this.geolocationService.loadAllowedLocation();
            
            // Load initial data
            await this.loadInitialData();
            
            this.isInitialized = true;
            console.log('Smart Attendance System initialized successfully');
            
            // Show initialization success
            this.showNotification('System initialized successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showNotification('System initialization failed. Demo mode enabled.', 'warning');
        }
    }

    // Wait for Firebase to be available
    async waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (window.DatabaseService) {
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }

    // Load initial data for home page
    async loadInitialData() {
        try {
            const students = await this.databaseService.getStudents();
            const records = await this.databaseService.getAttendanceRecords();
            
            // Update home page stats
            document.getElementById('totalEnrolled').textContent = students.length;
            
            // Count today's attendance
            const today = new Date().toDateString();
            const todayRecords = records.filter(record => 
                new Date(record.timestamp.toDate()).toDateString() === today
            );
            document.getElementById('todayAttendance').textContent = todayRecords.length;
            
            // Update system status
            document.getElementById('systemStatus').textContent = '🟢';
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            // Set default values for demo
            document.getElementById('totalEnrolled').textContent = '0';
            document.getElementById('todayAttendance').textContent = '0';
            document.getElementById('systemStatus').textContent = '🟡';
        }
    }

    // Show page navigation
    showPage(pageName) {
        // Hide all pages
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => page.classList.remove('active'));
        
        // Show selected page
        document.getElementById(pageName).classList.add('active');
        
        // Update navigation buttons
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        this.currentPage = pageName;
        
        // Load page-specific data
        this.loadPageData(pageName);
    }

    // Load data specific to each page
    async loadPageData(pageName) {
        switch (pageName) {
            case 'admin':
                await this.loadAdminData();
                break;
            case 'attendance':
                await this.loadAttendanceData();
                break;
            case 'home':
                await this.loadInitialData();
                break;
        }
    }

    // Load admin page data
    async loadAdminData() {
        try {
            console.log('Loading admin data...');
            
            // Load students list
            await this.loadStudentsList();
            
            // Load attendance records
            await this.loadAttendanceRecords();
            
            // Load current location settings
            await this.loadLocationSettings();
            
            console.log('Admin data loaded successfully');
            
        } catch (error) {
            console.error('Error loading admin data:', error);
        }
    }

    // Load students list
    async loadStudentsList() {
        try {
            console.log('Loading students list...');
            const students = await this.databaseService.getStudents();
            const studentsList = document.getElementById('studentsList');
            
            if (students.length === 0) {
                studentsList.innerHTML = '<p class="loading">No students enrolled yet.</p>';
                return;
            }
            
            console.log(`Found ${students.length} students`);
            
            studentsList.innerHTML = students.map(student => {
                const enrollmentDate = student.enrolledAt?.toDate ? 
                    new Date(student.enrolledAt.toDate()).toLocaleDateString() : 
                    'Unknown';
                
                const recordCount = student.attendanceRecords ? student.attendanceRecords.length : 0;
                
                return `
                    <div class="student-item">
                        <div>
                            <div class="student-name">${student.name}</div>
                            <div class="student-date">Enrolled: ${enrollmentDate}</div>
                        </div>
                        <div>
                            <span class="attendance-count">${recordCount} records</span>
                        </div>
                    </div>
                `;
            }).join('');
            
            console.log('Students list loaded successfully');
            
        } catch (error) {
            console.error('Error loading students list:', error);
            document.getElementById('studentsList').innerHTML = '<p class="error">Error loading students</p>';
        }
    }

    // Load attendance records
    async loadAttendanceRecords() {
        try {
            console.log('Loading attendance records...');
            const records = await this.databaseService.getAttendanceRecords();
            const recordsContainer = document.getElementById('attendanceRecords');
            
            if (records.length === 0) {
                recordsContainer.innerHTML = '<p class="loading">No attendance records yet.</p>';
                return;
            }
            
            console.log(`Found ${records.length} attendance records`);
            
            recordsContainer.innerHTML = records.slice(0, 20).map(record => {
                const timestamp = record.timestamp?.toDate ? 
                    new Date(record.timestamp.toDate()).toLocaleString() : 
                    'Unknown time';
                
                return `
                    <div class="record-item">
                        <div>
                            <div class="record-info">${record.studentName}</div>
                            <div class="record-time">${timestamp}</div>
                        </div>
                        <div>
                            <span class="status-${record.status.toLowerCase()}">${record.status}</span>
                        </div>
                    </div>
                `;
            }).join('');
            
            console.log('Attendance records loaded successfully');
            
        } catch (error) {
            console.error('Error loading attendance records:', error);
            document.getElementById('attendanceRecords').innerHTML = '<p class="error">Error loading records</p>';
        }
    }

    // Load location settings
    async loadLocationSettings() {
        try {
            const locationData = await this.geolocationService.loadAllowedLocation();
            if (locationData) {
                document.getElementById('adminLat').value = this.geolocationService.allowedLocation.latitude;
                document.getElementById('adminLng').value = this.geolocationService.allowedLocation.longitude;
                document.getElementById('adminRadius').value = this.geolocationService.allowedLocation.radius;
                
                const locationInfo = document.getElementById('currentLocationInfo');
                locationInfo.innerHTML = `
                    <strong>Current Allowed Location:</strong><br>
                    Latitude: ${this.geolocationService.allowedLocation.latitude.toFixed(6)}<br>
                    Longitude: ${this.geolocationService.allowedLocation.longitude.toFixed(6)}<br>
                    Radius: ${this.geolocationService.allowedLocation.radius}m
                `;
                locationInfo.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error loading location settings:', error);
        }
    }

    // Load attendance page data
    async loadAttendanceData() {
        try {
            // Reset attendance steps
            this.resetAttendanceSteps();
            
            // Load students for verification
            const students = await this.databaseService.getStudents();
            if (students.length === 0) {
                this.showNotification('No students enrolled. Please enroll students first.', 'warning');
                this.showPage('enroll');
            }
            
        } catch (error) {
            console.error('Error loading attendance data:', error);
        }
    }

    // Reset attendance steps
    resetAttendanceSteps() {
        const steps = document.querySelectorAll('.att-step');
        steps.forEach((step, index) => {
            step.classList.remove('active', 'completed');
            if (index === 0) {
                step.classList.add('active');
            }
        });
        
        // Show location check section
        document.getElementById('locationCheck').classList.remove('hidden');
        document.getElementById('faceRecognition').classList.add('hidden');
        document.getElementById('attendanceResult').classList.add('hidden');
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        `;
        
        // Set background color based on type
        const colors = {
            success: '#48bb78',
            error: '#f56565',
            warning: '#ed8936',
            info: '#4299e1'
        };
        notification.style.backgroundColor = colors[type];
        
        // Add to page
        document.body.appendChild(notification);
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
}

// Initialize the application
const app = new SmartAttendanceApp();

// Page Navigation Functions
function showPage(pageName) {
    app.showPage(pageName);
}

// Enrollment Functions
async function startEnrollment() {
    const studentName = document.getElementById('studentName').value.trim();
    if (!studentName) {
        app.showNotification('Please enter a student name', 'error');
        return;
    }

    try {
        // Start camera
        await app.faceRecognition.startEnrollmentCamera();
        
        // Show camera section
        document.getElementById('cameraSection').classList.remove('hidden');
        document.getElementById('startEnrollment').classList.add('hidden');
        
        app.showNotification('Camera started. Follow the instructions to complete enrollment.', 'success');
        
    } catch (error) {
        app.showNotification(`Camera error: ${error.message}`, 'error');
    }
}

async function captureFrame() {
    try {
        const steps = ['straight', 'left', 'right', 'up', 'down'];
        const currentStep = app.faceRecognition.currentStep;
        
        if (currentStep > steps.length) {
            app.showNotification('All steps completed!', 'success');
            document.getElementById('captureFrame').classList.add('hidden');
            document.getElementById('saveEnrollment').classList.remove('hidden');
            return;
        }
        
        // Capture face frame
        await app.faceRecognition.captureFaceFrame(steps[currentStep - 1]);
        
        // Update progress
        app.faceRecognition.updateProgress(currentStep + 1);
        
        app.showNotification(`Step ${currentStep} captured!`, 'success');
        
    } catch (error) {
        app.showNotification(`Capture error: ${error.message}`, 'error');
    }
}

async function saveEnrollment() {
    const studentName = document.getElementById('studentName').value.trim();
    
    try {
        // Show progress
        document.getElementById('enrollmentProgress').classList.remove('hidden');
        
        // Save to database
        await app.faceRecognition.saveEnrollment(studentName);
        
        // Show success
        document.getElementById('cameraSection').classList.add('hidden');
        document.getElementById('enrollmentProgress').classList.add('hidden');
        document.getElementById('enrollmentSuccess').classList.remove('hidden');
        document.getElementById('enrolledStudentName').textContent = studentName;
        
        app.showNotification(`${studentName} enrolled successfully!`, 'success');
        
        // Update home page stats and admin data
        await app.loadInitialData();
        
        // Refresh admin panel if it's currently active
        if (app.currentPage === 'admin') {
            await app.loadAdminData();
        }
        
    } catch (error) {
        app.showNotification(`Enrollment error: ${error.message}`, 'error');
        document.getElementById('enrollmentProgress').classList.add('hidden');
    }
}

function resetEnrollment() {
    app.faceRecognition.resetEnrollment();
    document.getElementById('startEnrollment').classList.remove('hidden');
}

// Attendance Functions
async function checkLocation() {
    try {
        document.getElementById('checkLocation').disabled = true;
        document.getElementById('checkLocation').textContent = 'Checking...';
        
        // Check location
        const result = await app.geolocationService.mockLocationVerification();
        
        const locationStatus = document.getElementById('locationStatus');
        locationStatus.classList.remove('hidden');
        locationStatus.textContent = result.message;
        locationStatus.className = `location-status ${result.isValid ? 'success' : 'error'}`;
        
        if (result.isValid) {
            // Move to next step
            document.querySelectorAll('.att-step')[0].classList.add('completed');
            document.querySelectorAll('.att-step')[1].classList.add('active');
            
            // Show face recognition section
            document.getElementById('faceRecognition').classList.remove('hidden');
            
            app.showNotification('Location verified successfully!', 'success');
        } else {
            app.showNotification('Location verification failed!', 'error');
        }
        
    } catch (error) {
        app.showNotification(`Location error: ${error.message}`, 'error');
    } finally {
        document.getElementById('checkLocation').disabled = false;
        document.getElementById('checkLocation').textContent = 'Check My Location';
    }
}

async function startRecognition() {
    try {
        document.getElementById('startRecognition').disabled = true;
        document.getElementById('recognitionStatus').textContent = 'Starting face recognition...';
        
        // Start camera
        await app.faceRecognition.startAttendanceCamera();
        
        // Start recognition process
        document.getElementById('recognitionStatus').textContent = 'Looking for face... Please look at the camera.';
        
        const result = await app.faceRecognition.recognizeFace();
        
        // Stop camera
        app.faceRecognition.stopCamera();
        
        // Show result
        await showAttendanceResult(result);
        
    } catch (error) {
        app.showNotification(`Recognition error: ${error.message}`, 'error');
        document.getElementById('recognitionStatus').textContent = 'Recognition failed. Please try again.';
    } finally {
        document.getElementById('startRecognition').disabled = false;
    }
}

async function showAttendanceResult(recognitionResult) {
    try {
        // Move to final step
        document.querySelectorAll('.att-step')[1].classList.add('completed');
        document.querySelectorAll('.att-step')[2].classList.add('active');
        
        // Hide face recognition section
        document.getElementById('faceRecognition').classList.add('hidden');
        
        // Show result
        const resultContainer = document.getElementById('attendanceResult');
        const resultIcon = document.getElementById('resultIcon');
        const resultTitle = document.getElementById('resultTitle');
        const resultMessage = document.getElementById('resultMessage');
        
        // Save attendance record
        const attendanceData = {
            status: 'Present',
            location: app.geolocationService.currentLocation,
            faceMatch: {
                confidence: recognitionResult.confidence,
                distance: recognitionResult.distance
            }
        };
        
        await app.databaseService.addAttendanceRecord(recognitionResult.student.id, attendanceData);
        
        // Show success result
        resultContainer.classList.remove('hidden');
        resultContainer.classList.add('success');
        resultIcon.textContent = '✅';
        resultTitle.textContent = 'Attendance Marked Successfully!';
        resultMessage.textContent = `${recognitionResult.student.name} - Confidence: ${(recognitionResult.confidence * 100).toFixed(1)}%`;
        
        app.showNotification(`Attendance marked for ${recognitionResult.student.name}!`, 'success');
        
        // Update home page stats and admin data
        await app.loadInitialData();
        
        // Refresh admin panel if it's currently active
        if (app.currentPage === 'admin') {
            await app.loadAdminData();
        }
        
    } catch (error) {
        console.error('Error showing attendance result:', error);
        app.showNotification('Error saving attendance record', 'error');
    }
}

function resetAttendance() {
    app.resetAttendanceSteps();
    document.getElementById('locationStatus').classList.add('hidden');
    document.getElementById('attendanceResult').classList.add('hidden');
}

// Admin Functions
async function refreshAdminData() {
    try {
        console.log('Refreshing admin data...');
        await app.loadAdminData();
        app.showNotification('Admin data refreshed successfully!', 'success');
    } catch (error) {
        console.error('Error refreshing admin data:', error);
        app.showNotification('Error refreshing data', 'error');
    }
}

async function setLocation() {
    const lat = parseFloat(document.getElementById('adminLat').value);
    const lng = parseFloat(document.getElementById('adminLng').value);
    const radius = parseInt(document.getElementById('adminRadius').value);
    
    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
        app.showNotification('Please enter valid location coordinates', 'error');
        return;
    }
    
    try {
        app.geolocationService.setAllowedLocation(lat, lng, radius);
        await app.geolocationService.saveAllowedLocation();
        
        app.showNotification('Location settings saved successfully!', 'success');
        await app.loadLocationSettings();
        
    } catch (error) {
        app.showNotification(`Error saving location: ${error.message}`, 'error');
    }
}

async function useCurrentLocation() {
    try {
        document.getElementById('useCurrentLocation').disabled = true;
        document.getElementById('useCurrentLocation').textContent = 'Getting Location...';
        
        const location = await app.geolocationService.getCurrentLocation();
        
        document.getElementById('adminLat').value = location.latitude;
        document.getElementById('adminLng').value = location.longitude;
        
        app.showNotification('Current location set!', 'success');
        
    } catch (error) {
        app.showNotification(`Location error: ${error.message}`, 'error');
    } finally {
        document.getElementById('useCurrentLocation').disabled = false;
        document.getElementById('useCurrentLocation').textContent = 'Use Current Location';
    }
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Add event listeners
    document.getElementById('startEnrollment').addEventListener('click', startEnrollment);
    document.getElementById('captureFrame').addEventListener('click', captureFrame);
    document.getElementById('saveEnrollment').addEventListener('click', saveEnrollment);
    document.getElementById('checkLocation').addEventListener('click', checkLocation);
    document.getElementById('startRecognition').addEventListener('click', startRecognition);
    document.getElementById('setLocation').addEventListener('click', setLocation);
    document.getElementById('useCurrentLocation').addEventListener('click', useCurrentLocation);
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Initialize the application
    await app.initialize();
});

// Export app for global access
window.SmartAttendanceApp = app;
