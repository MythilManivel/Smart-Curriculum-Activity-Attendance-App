import React from 'react';
import { Container, Card, Row, Col } from 'react-bootstrap';
import { useAuth } from '../context/authContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <Container className="py-4">
      <h1 className="mb-4">Welcome, {user?.name || 'User'}</h1>
      
      <Row className="g-4">
        {user?.role === 'teacher' && (
          <>
            <Col md={4}>
              <Card className="h-100">
                <Card.Body className="text-center">
                  <Card.Title>Create New Session</Card.Title>
                  <Card.Text>
                    Start a new attendance session and generate a QR code for your students to scan.
                  </Card.Text>
                  <a href="/teacher/session/new" className="btn btn-primary">
                    Create Session
                  </a>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100">
                <Card.Body className="text-center">
                  <Card.Title>View Sessions</Card.Title>
                  <Card.Text>
                    View and manage your previous and current attendance sessions.
                  </Card.Text>
                  <a href="/teacher" className="btn btn-secondary">
                    My Sessions
                  </a>
                </Card.Body>
              </Card>
            </Col>
          </>
        )}
        
        {user?.role === 'student' && (
          <>
            <Col md={4}>
              <Card className="h-100">
                <Card.Body className="text-center">
                  <Card.Title>Mark Attendance</Card.Title>
                  <Card.Text>
                    Scan the QR code provided by your teacher to mark your attendance.
                  </Card.Text>
                  <a href="/student/mark-attendance" className="btn btn-primary">
                    Scan QR Code
                  </a>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100">
                <Card.Body className="text-center">
                  <Card.Title>Attendance History</Card.Title>
                  <Card.Text>
                    View your attendance records and history across all your classes.
                  </Card.Text>
                  <a href="/student/history" className="btn btn-secondary">
                    View History
                  </a>
                </Card.Body>
              </Card>
            </Col>
          </>
        )}
        
        <Col md={4}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <Card.Title>Your Profile</Card.Title>
              <Card.Text>
                Update your profile information and account settings.
              </Card.Text>
              <a href="/profile" className="btn btn-outline-primary">
                View Profile
              </a>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Quick Stats</Card.Title>
              <Row className="text-center">
                <Col md={4}>
                  <h3>{user?.role === 'teacher' ? 'Sessions Created' : 'Classes Attended'}</h3>
                  <h2 className="text-primary">
                    {user?.role === 'teacher' ? '12' : '45'}
                  </h2>
                </Col>
                <Col md={4}>
                  <h3>This Month</h3>
                  <h2 className="text-success">{user?.role === 'teacher' ? '4' : '12'}</h2>
                </Col>
                <Col md={4}>
                  <h3>Today</h3>
                  <h2 className="text-info">{user?.role === 'teacher' ? '1' : '2'}</h2>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
