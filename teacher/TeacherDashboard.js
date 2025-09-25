import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Card, Row, Col, Badge, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaPlus, FaQrcode, FaUsers, FaClock, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/authContext';

export default function TeacherDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get('/api/attendance/sessions/teacher');
        setSessions(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch sessions. Please try again.');
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const filteredSessions = sessions.filter(session => 
    session.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.sessionCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getSessionStatus = (session) => {
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    
    if (!session.isActive) {
      return <Badge bg="secondary">Inactive</Badge>;
    }
    
    if (now > expiresAt) {
      return <Badge bg="warning" text="dark">Expired</Badge>;
    }
    
    return <Badge bg="success">Active</Badge>;
  };

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Attendance Sessions</h2>
        <Button as={Link} to="/teacher/session/new" variant="primary">
          <FaPlus className="me-1" /> New Session
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="mb-4 g-4">
        <Col md={4}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <h1 className="display-4 text-primary">
                {sessions.length}
              </h1>
              <p className="mb-0">Total Sessions</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <h1 className="display-4 text-success">
                {sessions.filter(s => s.isActive && new Date(s.expiresAt) > new Date()).length}
              </h1>
              <p className="mb-0">Active Sessions</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <h1 className="display-4 text-info">
                {sessions.reduce((total, session) => total + (session.attendanceCount || 0), 0)}
              </h1>
              <p className="mb-0">Total Attendance Marked</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Recent Sessions</h5>
            <div className="w-50">
              <div className="input-group">
                <span className="input-group-text">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by subject or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="text-center py-4">
              <FaClock size={48} className="text-muted mb-3" />
              <h5>No sessions found</h5>
              <p>Create your first attendance session to get started</p>
              <Button as={Link} to="/teacher/session/new" variant="primary">
                <FaPlus className="me-1" /> Create Session
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Session Code</th>
                    <th>Created</th>
                    <th>Expires</th>
                    <th>Attendees</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session) => (
                    <tr key={session._id}>
                      <td>{session.subject}</td>
                      <td>
                        <code>{session.sessionCode}</code>
                      </td>
                      <td>{formatDate(session.createdAt)}</td>
                      <td>{formatDate(session.expiresAt)}</td>
                      <td>{session.attendanceCount || 0}</td>
                      <td>{getSessionStatus(session)}</td>
                      <td>
                        <Button
                          as={Link}
                          to={`/teacher/session/${session._id}`}
                          variant="outline-primary"
                          size="sm"
                          className="me-1"
                        >
                          <FaUsers className="me-1" /> View
                        </Button>
                        <Button
                          as={Link}
                          to={`/teacher/session/${session._id}?tab=qr`}
                          variant="outline-secondary"
                          size="sm"
                        >
                          <FaQrcode className="me-1" /> QR
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
