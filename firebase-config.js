// Firebase Configuration
// Replace with your Firebase project configuration
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};

// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, query, where, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Database functions
class DatabaseService {
    // Add student enrollment data
    static async addStudent(studentData) {
        try {
            // Convert Float32Array descriptors to regular arrays for Firebase
            const processedEmbeddings = studentData.faceEmbeddings.map(embedding => ({
                ...embedding,
                descriptor: Array.from(embedding.descriptor) // Convert Float32Array to regular array
            }));
            
            const docRef = await addDoc(collection(db, 'students'), {
                name: studentData.name,
                faceEmbeddings: processedEmbeddings,
                enrolledAt: new Date(),
                attendanceRecords: []
            });
            console.log('Student added with ID: ', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Error adding student: ', error);
            throw error;
        }
    }

    // Get all students
    static async getStudents() {
        try {
            const querySnapshot = await getDocs(collection(db, 'students'));
            const students = [];
            querySnapshot.forEach((doc) => {
                students.push({ id: doc.id, ...doc.data() });
            });
            return students;
        } catch (error) {
            console.error('Error getting students: ', error);
            throw error;
        }
    }

    // Add attendance record
    static async addAttendanceRecord(studentId, attendanceData) {
        try {
            const studentRef = doc(db, 'students', studentId);
            const studentData = await this.getStudentById(studentId);
            
            const attendanceRecord = {
                timestamp: new Date(),
                location: attendanceData.location,
                faceMatch: attendanceData.faceMatch,
                status: attendanceData.status
            };
            
            await updateDoc(studentRef, {
                attendanceRecords: [...studentData.attendanceRecords, attendanceRecord]
            });
            
            return true;
        } catch (error) {
            console.error('Error adding attendance record: ', error);
            throw error;
        }
    }

    // Get student by ID
    static async getStudentById(studentId) {
        try {
            const querySnapshot = await getDocs(collection(db, 'students'));
            let studentData = null;
            querySnapshot.forEach((doc) => {
                if (doc.id === studentId) {
                    studentData = { id: doc.id, ...doc.data() };
                }
            });
            return studentData;
        } catch (error) {
            console.error('Error getting student: ', error);
            throw error;
        }
    }

    // Get attendance records
    static async getAttendanceRecords() {
        try {
            const querySnapshot = await getDocs(collection(db, 'students'));
            const allRecords = [];
            querySnapshot.forEach((doc) => {
                const studentData = doc.data();
                studentData.attendanceRecords.forEach(record => {
                    allRecords.push({
                        studentName: studentData.name,
                        ...record
                    });
                });
            });
            return allRecords.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error('Error getting attendance records: ', error);
            throw error;
        }
    }

    // Set admin location
    static async setAdminLocation(locationData) {
        try {
            await addDoc(collection(db, 'adminSettings'), {
                allowedLocation: locationData,
                setAt: new Date()
            });
            return true;
        } catch (error) {
            console.error('Error setting admin location: ', error);
            throw error;
        }
    }

    // Get admin location
    static async getAdminLocation() {
        try {
            const querySnapshot = await getDocs(collection(db, 'adminSettings'));
            let latestLocation = null;
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (!latestLocation || data.setAt > latestLocation.setAt) {
                    latestLocation = data;
                }
            });
            return latestLocation;
        } catch (error) {
            console.error('Error getting admin location: ', error);
            throw error;
        }
    }
}

// Initialize authentication
async function initializeAuth() {
    try {
        await signInAnonymously(auth);
        console.log('Anonymous authentication successful');
    } catch (error) {
        console.error('Authentication error: ', error);
    }
}

// Initialize the app
initializeAuth();

// Export for use in other files
window.DatabaseService = DatabaseService;
window.db = db;
window.auth = auth;
