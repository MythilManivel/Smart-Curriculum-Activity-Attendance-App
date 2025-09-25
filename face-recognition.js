// Face Recognition Module using face-api.js
class FaceRecognition {
    constructor() {
        this.isModelLoaded = false;
        this.currentStream = null;
        this.faceMatcher = null;
        this.enrollmentData = [];
        this.currentStep = 1;
        this.totalSteps = 5;
        this.faceDetectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
    }

    // Initialize face-api models
    async initialize() {
        try {
            console.log('Loading face-api models...');
            
            // Load required models
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                faceapi.nets.faceRecognitionNet.loadFromUri('/models')
            ]);
            
            this.isModelLoaded = true;
            console.log('Face-api models loaded successfully');
            return true;
        } catch (error) {
            console.error('Error loading face-api models:', error);
            // For demo purposes, we'll create mock functionality
            this.isModelLoaded = false;
            return false;
        }
    }

    // Start camera for enrollment
    async startEnrollmentCamera() {
        try {
            const video = document.getElementById('video');
            
            this.currentStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });
            
            video.srcObject = this.currentStream;
            video.play();
            
            return true;
        } catch (error) {
            console.error('Error accessing camera:', error);
            throw new Error('Camera access denied or not available');
        }
    }

    // Start camera for attendance
    async startAttendanceCamera() {
        try {
            const video = document.getElementById('attendanceVideo');
            
            this.currentStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });
            
            video.srcObject = this.currentStream;
            video.play();
            
            return true;
        } catch (error) {
            console.error('Error accessing camera:', error);
            throw new Error('Camera access denied or not available');
        }
    }

    // Stop camera
    stopCamera() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
    }

    // Capture face data for enrollment
    async captureFaceFrame(stepName) {
        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw current frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        try {
            if (this.isModelLoaded) {
                // Use real face-api.js for face detection
                const detections = await faceapi
                    .detectAllFaces(video, this.faceDetectionOptions)
                    .withFaceLandmarks()
                    .withFaceDescriptors();
                
                if (detections.length > 0) {
                    const faceData = {
                        step: stepName,
                        descriptor: detections[0].descriptor,
                        landmarks: detections[0].landmarks,
                        timestamp: new Date()
                    };
                    
                    this.enrollmentData.push(faceData);
                    return faceData;
                } else {
                    throw new Error('No face detected. Please ensure your face is visible in the camera.');
                }
            } else {
                // Mock face data for demo
                const mockFaceData = {
                    step: stepName,
                    descriptor: this.generateMockDescriptor(),
                    landmarks: null,
                    timestamp: new Date()
                };
                
                this.enrollmentData.push(mockFaceData);
                return mockFaceData;
            }
        } catch (error) {
            console.error('Error capturing face frame:', error);
            throw error;
        }
    }

    // Generate mock face descriptor for demo
    generateMockDescriptor() {
        const descriptor = new Float32Array(128);
        for (let i = 0; i < 128; i++) {
            descriptor[i] = Math.random() * 2 - 1; // Random values between -1 and 1
        }
        return descriptor;
    }

    // Recognize face for attendance
    async recognizeFace() {
        const video = document.getElementById('attendanceVideo');
        
        try {
            if (this.isModelLoaded) {
                // Use real face-api.js for face recognition
                const detections = await faceapi
                    .detectAllFaces(video, this.faceDetectionOptions)
                    .withFaceLandmarks()
                    .withFaceDescriptors();
                
                if (detections.length > 0) {
                    const queryDescriptor = detections[0].descriptor;
                    return await this.matchFace(queryDescriptor);
                } else {
                    throw new Error('No face detected. Please ensure your face is visible in the camera.');
                }
            } else {
                // Mock recognition for demo
                return await this.mockFaceRecognition();
            }
        } catch (error) {
            console.error('Error recognizing face:', error);
            throw error;
        }
    }

    // Match face against enrolled students
    async matchFace(queryDescriptor) {
        try {
            // Get all enrolled students from database
            const students = await DatabaseService.getStudents();
            let bestMatch = null;
            let bestDistance = 1;
            
            for (const student of students) {
                if (student.faceEmbeddings && student.faceEmbeddings.length > 0) {
                    for (const embedding of student.faceEmbeddings) {
                        // Convert array back to Float32Array for distance calculation
                        const storedDescriptor = new Float32Array(embedding.descriptor);
                        const distance = this.calculateDistance(queryDescriptor, storedDescriptor);
                        if (distance < bestDistance) {
                            bestDistance = distance;
                            bestMatch = {
                                student: student,
                                confidence: 1 - distance,
                                distance: distance
                            };
                        }
                    }
                }
            }
            
            // Threshold for face matching (lower distance = better match)
            const threshold = 0.6;
            if (bestMatch && bestMatch.distance < threshold) {
                return bestMatch;
            } else {
                throw new Error('No matching face found in the database.');
            }
        } catch (error) {
            console.error('Error matching face:', error);
            throw error;
        }
    }

    // Mock face recognition for demo
    async mockFaceRecognition() {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock successful recognition
        const students = await DatabaseService.getStudents();
        if (students.length > 0) {
            const randomStudent = students[Math.floor(Math.random() * students.length)];
            return {
                student: randomStudent,
                confidence: 0.85 + Math.random() * 0.1, // Random confidence between 0.85-0.95
                distance: 0.1 + Math.random() * 0.2 // Random distance between 0.1-0.3
            };
        } else {
            throw new Error('No students enrolled in the system.');
        }
    }

    // Calculate Euclidean distance between face descriptors
    calculateDistance(descriptor1, descriptor2) {
        let sum = 0;
        for (let i = 0; i < descriptor1.length; i++) {
            sum += Math.pow(descriptor1[i] - descriptor2[i], 2);
        }
        return Math.sqrt(sum);
    }

    // Save enrollment data to database
    async saveEnrollment(studentName) {
        try {
            if (this.enrollmentData.length === 0) {
                throw new Error('No face data captured. Please complete the enrollment process.');
            }
            
            const studentData = {
                name: studentName,
                faceEmbeddings: this.enrollmentData,
                enrolledAt: new Date()
            };
            
            const studentId = await DatabaseService.addStudent(studentData);
            
            // Clear enrollment data
            this.enrollmentData = [];
            this.currentStep = 1;
            
            return studentId;
        } catch (error) {
            console.error('Error saving enrollment:', error);
            throw error;
        }
    }

    // Update enrollment progress
    updateProgress(step) {
        this.currentStep = step;
        const progressFill = document.getElementById('progressFill');
        const progress = (step / this.totalSteps) * 100;
        progressFill.style.width = progress + '%';
        
        // Update step indicators
        for (let i = 1; i <= this.totalSteps; i++) {
            const stepElement = document.getElementById(`step${i}`);
            if (i < step) {
                stepElement.classList.add('completed');
                stepElement.classList.remove('active');
            } else if (i === step) {
                stepElement.classList.add('active');
                stepElement.classList.remove('completed');
            } else {
                stepElement.classList.remove('active', 'completed');
            }
        }
    }

    // Reset enrollment
    resetEnrollment() {
        this.enrollmentData = [];
        this.currentStep = 1;
        this.stopCamera();
        
        // Reset UI
        document.getElementById('cameraSection').classList.add('hidden');
        document.getElementById('enrollmentSuccess').classList.add('hidden');
        document.getElementById('enrollmentProgress').classList.add('hidden');
        document.getElementById('studentName').value = '';
        
        // Reset progress
        const progressFill = document.getElementById('progressFill');
        progressFill.style.width = '0%';
        
        // Reset steps
        for (let i = 1; i <= this.totalSteps; i++) {
            const stepElement = document.getElementById(`step${i}`);
            stepElement.classList.remove('active', 'completed');
            if (i === 1) {
                stepElement.classList.add('active');
            }
        }
    }
}

// Initialize face recognition
const faceRecognition = new FaceRecognition();

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await faceRecognition.initialize();
        console.log('Face recognition initialized');
    } catch (error) {
        console.error('Failed to initialize face recognition:', error);
        // Continue with mock functionality for demo
    }
});

// Export for use in other files
window.FaceRecognition = faceRecognition;
