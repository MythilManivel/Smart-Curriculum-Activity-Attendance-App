import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Components
import Navbar from './components/layout/Navbar';
import PrivateRoute from './components/routing/PrivateRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import CreateSession from './pages/teacher/CreateSession';
import SessionDetails from './pages/teacher/SessionDetails';
import StudentDashboard from './pages/student/StudentDashboard';
import MarkAttendance from './pages/student/MarkAttendance';
import AttendanceHistory from './pages/student/AttendanceHistory';
import FacultyLogin from './pages/faculty/FacultyLogin';
import FacultyDashboard from './pages/faculty/FacultyDashboard';

function App() {
  return (
    <div className="App">
      <Navbar />
      <main className="container py-4">
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/faculty/login" element={<FacultyLogin />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            
            {/* Faculty Routes */}
            <Route 
              path="/faculty/dashboard" 
              element={
                <PrivateRoute role="faculty">
                  <FacultyDashboard />
                </PrivateRoute>
              } 
            />
            
            {/* Teacher Routes */}
            <Route 
              path="/teacher" 
              element={
                <PrivateRoute role="teacher">
                  <TeacherDashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/teacher/session/new" 
              element={
                <PrivateRoute role="teacher">
                  <CreateSession />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/teacher/session/:sessionId" 
              element={
                <PrivateRoute role="teacher">
                  <SessionDetails />
                </PrivateRoute>
              } 
            />
            
            {/* Student Routes */}
            <Route 
              path="/student" 
              element={
                <PrivateRoute role="student">
                  <StudentDashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/student/mark-attendance" 
              element={
                <PrivateRoute role="student">
                  <MarkAttendance />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/student/history" 
              element={
                <PrivateRoute role="student">
                  <AttendanceHistory />
                </PrivateRoute>
              } 
            />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    );
}

export default App;
