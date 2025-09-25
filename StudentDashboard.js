import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { FaQrcode, FaHistory, FaClipboardCheck, FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/authContext';

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    thisWeek: 0
  });
  const [error, setError] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // In a real app, you would fetch this data from your API
        // const response = await axios.get('/api/attendance/student/stats');
        // setStats(response.data.stats);
        // setRecentAttendance(response.data.recent);
        
        // Mock data for now
        setTimeout(() => {
          setStats({
            total: 24,
            thisMonth: 8,
            thisWeek: 2
          });
          
          setRecentAttendance([
            { id: 1, subject: 'Mathematics', date: '2023-10-15T10:30:00Z', status: 'present' },
            { id: 2, subject: 'Physics', date: '2023-10-14T14:15:00Z', status: 'present' },
            { id: 3, subject: 'Chemistry', date: '2023-10-12T09:00:00Z', status: 'late' },
          ]);
          
          setLoading(false);
        }, 500);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'present':
        return <span className="badge bg-success">Present</span>;
      case 'late':
        return <span className="badge bg-warning text-dark">Late</span>;
      case 'absent':
        return <span className="badge bg-danger">Absent</span>;
      default:
        return <span className="badge bg-secondary">Unknown</span>;
    }
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">Welcome back, {user?.name || 'Student'}!</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row className="mb-4 g-4">
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-4 text-primary mb-2">
                {loading ? '-' : stats.total}
              </div>
              <h5 className="text-muted mb-0">Total Classes Attended</h5>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-4 text-success mb-2">
                {loading ? '-' : stats.thisMonth}
              </div>
              <h5 className="text-muted mb-0">This Month</h5>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="display-4 text-info mb-2">
                {loading ? '-' : stats.thisWeek}
              </div>
              <h5 className="text-muted mb-0">This Week</h5>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="g-4">
        <Col lg={8}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Quick Actions</h5>
              </div>
              
              <Row className="g-3">
                <Col md={6}>
                  <Button 
                    variant="outline-primary" 
                    className="w-100 py-4 d-flex flex-column align-items-center"
                    onClick={() => navigate('/student/mark-attendance')}
                  >
                    <FaQrcode size={32} className="mb-2" />
                    <span>Mark Attendance</span>
                    <small className="text-muted mt-1">Scan QR Code</small>
                  </Button>
                </Col>
                
                <Col md={6}>
                  <Button 
                    variant="outline-secondary" 
                    className="w-100 py-4 d-flex flex-column align-items-center"
                    onClick={() => navigate('/student/history')}
                  >
                    <FaHistory size={32} className="mb-2" />
                    <span>View History</span>
                    <small className="text-muted mt-1">Attendance Records</small>
                  </Button>
                </Col>
                
                <Col md={6}>
                  <Button 
                    variant="outline-success" 
                    className="w-100 py-4 d-flex flex-column align-items-center"
                    onClick={() => window.alert('This feature is coming soon!')}
                  >
                    <FaClipboardCheck size={32} className="mb-2" />
                    <span>Request Leave</span>
                    <small className="text-muted mt-1">Submit leave application</small>
                  </Button>
                </Col>
                
                <Col md={6}>
                  <Button 
                    variant="outline-info" 
                    className="w-100 py-4 d-flex flex-column align-items-center"
                    onClick={() => window.alert('This feature is coming soon!')}
                  >
                    <FaClipboardCheck size={32} className="mb-2" />
                    <span>View Schedule</span>
                    <small className="text-muted mt-1">Class timetable</small>
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Recent Attendance</h5>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0"
                  onClick={() => navigate('/student/history')}
                >
                  View All
                </Button>
              </div>
              
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : recentAttendance.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  No recent attendance records found
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {recentAttendance.map((record) => (
                    <div 
                      key={record.id} 
                      className="list-group-item list-group-item-action border-0 px-0 py-3"
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">{record.subject}</h6>
                          <small className="text-muted">
                            {formatDate(record.date)}
                          </small>
                        </div>
                        {getStatusBadge(record.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-3 text-center">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => navigate('/student/history')}
                >
                  View Full History <FaArrowRight className="ms-1" />
                </Button>
              </div>
            </Card.Body>
          </Card>
          
          <Card className="mt-4 border-0 shadow-sm">
            <Card.Body>
              <h5 className="mb-3">Quick Stats</h5>
              
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>Attendance Rate</span>
                  <span>92%</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar bg-success" 
                    role="progressbar" 
                    style={{ width: '92%' }}
                    aria-valuenow={92} 
                    aria-valuemin={0} 
                    aria-valuemax={100}
                  ></div>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>On Time</span>
                  <span>85%</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar bg-info" 
                    role="progressbar" 
                    style={{ width: '85%' }}
                    aria-valuenow={85} 
                    aria-valuemin={0} 
                    aria-valuemax={100}
                  ></div>
                </div>
              </div>
              
              <div className="text-center mt-4">
                <Button variant="outline-secondary" size="sm">
                  View Detailed Report
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
