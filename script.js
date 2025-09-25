// Smart Attendance System - JavaScript
let attendance = {};
let attendanceChart = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadAttendanceFromStorage();
    updateDisplay();
    initializeChart();
});

// Mark student as present
function markAttendance() {
    const name = document.getElementById('studentName').value.trim();
    if (name) {
        attendance[name] = {
            status: 'Present',
            timestamp: new Date().toLocaleTimeString(),
            date: new Date().toLocaleDateString()
        };
        document.getElementById('studentName').value = '';
        updateDisplay();
        saveAttendanceToStorage();
        showNotification(`${name} marked as Present!`, 'success');
    } else {
        showNotification('Please enter a student name!', 'error');
    }
}

// Mark student as absent
function markAbsent() {
    const name = document.getElementById('studentName').value.trim();
    if (name) {
        attendance[name] = {
            status: 'Absent',
            timestamp: new Date().toLocaleTimeString(),
            date: new Date().toLocaleDateString()
        };
        document.getElementById('studentName').value = '';
        updateDisplay();
        saveAttendanceToStorage();
        showNotification(`${name} marked as Absent!`, 'warning');
    } else {
        showNotification('Please enter a student name!', 'error');
    }
}

// Remove student from attendance
function removeStudent(name) {
    delete attendance[name];
    updateDisplay();
    saveAttendanceToStorage();
    showNotification(`${name} removed from attendance!`, 'info');
}

// Update all displays
function updateDisplay() {
    updateTable();
    updateStats();
    updateChart();
    updateMotivationalMessage();
}

// Update the attendance table
function updateTable() {
    const tbody = document.querySelector('#attendanceTable tbody');
    tbody.innerHTML = '';
    
    const sortedAttendance = Object.entries(attendance).sort((a, b) => 
        a[1].timestamp.localeCompare(b[1].timestamp)
    );
    
    sortedAttendance.forEach(([name, data]) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${name}</td>
            <td><span class="status-${data.status.toLowerCase()}">${data.status}</span></td>
            <td>${data.timestamp}</td>
            <td><button class="remove-btn" onclick="removeStudent('${name}')">Remove</button></td>
        `;
    });
}

// Update statistics
function updateStats() {
    const totalStudents = Object.keys(attendance).length;
    const presentCount = Object.values(attendance).filter(data => data.status === 'Present').length;
    const absentCount = Object.values(attendance).filter(data => data.status === 'Absent').length;
    const attendancePercent = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
    
    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('presentCount').textContent = presentCount;
    document.getElementById('absentCount').textContent = absentCount;
    document.getElementById('attendancePercent').textContent = attendancePercent + '%';
}

// Initialize Chart.js
function initializeChart() {
    const ctx = document.getElementById('attendanceChart').getContext('2d');
    
    attendanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Present',
                data: [],
                backgroundColor: 'rgba(72, 187, 120, 0.8)',
                borderColor: 'rgba(72, 187, 120, 1)',
                borderWidth: 2
            }, {
                label: 'Absent',
                data: [],
                backgroundColor: 'rgba(245, 101, 101, 0.8)',
                borderColor: 'rgba(245, 101, 101, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Student Attendance Overview'
                }
            }
        }
    });
}

// Update the chart
function updateChart() {
    if (!attendanceChart) return;
    
    const names = Object.keys(attendance);
    const presentData = names.map(name => attendance[name].status === 'Present' ? 1 : 0);
    const absentData = names.map(name => attendance[name].status === 'Absent' ? 1 : 0);
    
    attendanceChart.data.labels = names;
    attendanceChart.data.datasets[0].data = presentData;
    attendanceChart.data.datasets[1].data = absentData;
    attendanceChart.update();
}

// Update motivational message based on attendance
function updateMotivationalMessage() {
    const messageElement = document.getElementById('motivationalMessage');
    const totalStudents = Object.keys(attendance).length;
    const presentCount = Object.values(attendance).filter(data => data.status === 'Present').length;
    const attendancePercent = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;
    
    let message = '';
    if (totalStudents === 0) {
        message = '🎯 Ready to start tracking attendance!';
    } else if (attendancePercent === 100) {
        message = '🎉 Perfect attendance! Outstanding work!';
    } else if (attendancePercent >= 90) {
        message = '🌟 Excellent attendance rate! Keep it up!';
    } else if (attendancePercent >= 80) {
        message = '👍 Good attendance! Almost there!';
    } else if (attendancePercent >= 70) {
        message = '📈 Attendance is improving! Keep going!';
    } else {
        message = '💪 Let\'s work on improving attendance together!';
    }
    
    messageElement.textContent = message;
}

// Add sample data for demo purposes
function addSampleData() {
    const sampleStudents = [
        'Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 
        'Emma Brown', 'Frank Miller', 'Grace Lee', 'Henry Taylor'
    ];
    
    const statuses = ['Present', 'Present', 'Present', 'Present', 'Present', 'Absent', 'Present', 'Absent'];
    
    sampleStudents.forEach((name, index) => {
        attendance[name] = {
            status: statuses[index],
            timestamp: new Date(Date.now() - (sampleStudents.length - index) * 60000).toLocaleTimeString(),
            date: new Date().toLocaleDateString()
        };
    });
    
    updateDisplay();
    saveAttendanceToStorage();
    showNotification('Sample data added for demo!', 'success');
}

// Clear all attendance data
function clearAllAttendance() {
    if (Object.keys(attendance).length === 0) {
        showNotification('No attendance data to clear!', 'info');
        return;
    }
    
    if (confirm('Are you sure you want to clear all attendance data?')) {
        attendance = {};
        updateDisplay();
        saveAttendanceToStorage();
        showNotification('All attendance data cleared!', 'info');
    }
}

// Show notification messages
function showNotification(message, type) {
    // Create notification element
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
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Save attendance to localStorage
function saveAttendanceToStorage() {
    localStorage.setItem('smartAttendance', JSON.stringify(attendance));
}

// Load attendance from localStorage
function loadAttendanceFromStorage() {
    const saved = localStorage.getItem('smartAttendance');
    if (saved) {
        attendance = JSON.parse(saved);
    }
}

// Add CSS animations for notifications
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

// Allow Enter key to mark attendance
document.getElementById('studentName').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        markAttendance();
    }
});
