import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Container, 
  Card, 
  Table, 
  Button, 
  Badge, 
  Alert, 
  Spinner, 
  Row, 
  Col,
  Tabs,
  Tab,
  ListGroup,
  Form,
  Modal
} from 'react-bootstrap';
import { 
  FaQrcode, 
  FaUsers, 
  FaDownload, 
  FaTrash, 
  FaArrowLeft,
  FaClipboardList,
  FaMapMarkerAlt,
  FaCopy,
  FaCheck,
  FaExclamationTriangle
} from 'react-icons/fa';
import { BsQrCodeScan } from 'react-icons/bs';
import QRCode from 'qrcode.react';
import axios from 'axios';
import { useAuth } from '../../context/authContext';
import { toast } from 'react-toastify';

export default function SessionDetails() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [session, setSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('attendance');
  const [showQRModal, setShowQRModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    if (location.search.includes('tab=qr')) {
      setActiveTab('qr');
    }
  }, [location]);
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setLoading(true);
        
        // Fetch session details
        const sessionRes = await axios.get(`/api/attendance/sessions/teacher`);
        const foundSession = sessionRes.data.find(s => s._id === sessionId);
        
        if (!foundSession) {
          throw new Error('Session not found');
        }
        
        setSession(foundSession);
        
        // Fetch attendance records for this session
        const recordsRes = await axios.get(`/api/attendance/sessions/${sessionId}/records`);
        setRecords(recordsRes.data.records || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching session data:', err);
        setError(err.response?.data?.message || 'Failed to load session data');
        setLoading(false);
      }
    };
    
    fetchSessionData();
  }, [sessionId]);
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  const getSessionStatus = () => {
    if (!session) return null;
    
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
  
  const handleEndSession = async () => {
    if (!window.confirm('Are you sure you want to end this session? This cannot be undone.')) {
      return;
    }
    
    try {
      await axios.put(`/api/attendance/sessions/${sessionId}/end`);
      setSession({ ...session, isActive: false });
      toast.success('Session ended successfully');
    } catch (err) {
      console.error('Error ending session:', err);
      toast.error(err.response?.data?.message || 'Failed to end session');
    }
  };
  
  const handleDeleteSession = async () => {
    try {
      setDeleting(true);
      await axios.delete(`/api/attendance/sessions/${sessionId}`);
      toast.success('Session deleted successfully');
      navigate('/teacher');
    } catch (err) {
      console.error('Error deleting session:', err);
      toast.error(err.response?.data?.message || 'Failed to delete session');
      setDeleting(false);
    }
  };
  
  const exportToCSV = () => {
    if (!records.length) return;
    
    // Create CSV header
    let csvContent = 'data:text/csv;charset=utf-8,';
    const headers = ['Name', 'Email', 'Student ID', 'Department', 'Marked At', 'Status'];
    csvContent += headers.join(',') + '\r\n';
    
    // Add data rows
    records.forEach(record => {
      const row = [
        `"${record.studentDetails?.name || 'N/A'}"`,
        `"${record.studentDetails?.email || 'N/A'}"`,
        `"${record.studentDetails?.studentId || 'N/A'}"`,
        `"${record.studentDetails?.department || 'N/A'}"`,
        `"${formatDate(record.markedAt)}"`,
        `"${record.status || 'present'}"`
      ];
      csvContent += row.join(',') + '\r\n';
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance-${session?.sessionCode || 'session'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const copyToClipboard = () => {
    if (!session) return;
    
    const qrData = {
      sessionId: session._id,
      sessionCode: session.sessionCode,
      subject: session.subject,
      expiresAt: session.expiresAt,
      location: session.location
    };
    
    navigator.clipboard.writeText(JSON.stringify(qrData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading session details...</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Session</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => navigate('/teacher')}>
            Back to Dashboard
          </Button>
        </Alert>
      </Container>
    );
  }
  
  if (!session) {
    return (
      <Container className="py-4">
        <Alert variant="warning">
          Session not found
        </Alert>
        <Button variant="outline-secondary" onClick={() => navigate('/teacher')}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Button 
        variant="outline-secondary" 
        className="mb-3" 
        onClick={() => navigate('/teacher')}
      >
        <FaArrowLeft className="me-1" /> Back to Sessions
      </Button>
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">{session.subject}</h2>
          <div className="d-flex align-items-center mt-1">
            <code className="me-2">{session.sessionCode}</code>
            {getSessionStatus()}
          </div>
        </div>
        
        <div>
          <Button 
            variant="outline-primary" 
            className="me-2"
            onClick={() => setShowQRModal(true)}
          >
            <FaQrcode className="me-1" /> Show QR
          </Button>
          
          <Button 
            variant="outline-success" 
            className="me-2"
            onClick={exportToCSV}
            disabled={!records.length}
          >
            <FaDownload className="me-1" /> Export CSV
          </Button>
          
          {session.isActive && new Date(session.expiresAt) > new Date() && (
            <Button 
              variant="outline-warning" 
              className="me-2"
              onClick={handleEndSession}
            >
              End Session
            </Button>
          )}
          
          <Button 
            variant="outline-danger"
            onClick={() => setShowDeleteModal(true)}
          >
            <FaTrash className="me-1" /> Delete
          </Button>
        </div>
      </div>
      
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Created:</strong> {formatDate(session.createdAt)}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Expires:</strong> {formatDate(session.expiresAt)}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Status:</strong> {getSessionStatus()}
                </ListGroup.Item>
              </ListGroup>
            </Col>
            <Col md={6}>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Total Attendance:</strong> {records.length} students
                </ListGroup.Item>
                {session.location && (
                  <ListGroup.Item>
                    <div className="d-flex align-items-center">
                      <FaMapMarkerAlt className="me-2 text-danger" />
                      <div>
                        <div>{session.location.name || 'Class Location'}</div>
                        <small className="text-muted">
                          {session.location.coordinates[1].toFixed(6)}, {session.location.coordinates[0].toFixed(6)}
                        </small>
                      </div>
                    </div>
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3"
      >
        <Tab eventKey="attendance" title={
          <>
            <FaUsers className="me-1" /> Attendance ({records.length})
          </>
        }>
          {records.length === 0 ? (
            <Card>
              <Card.Body className="text-center py-5">
                <BsQrCodeScan size={48} className="text-muted mb-3" />
                <h5>No attendance records yet</h5>
                <p className="text-muted">
                  Share the QR code with students to start marking attendance
                </p>
                <Button 
                  variant="primary" 
                  onClick={() => setShowQRModal(true)}
                >
                  <FaQrcode className="me-1" /> Show QR Code
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Attendance Records</h5>
                <div>
                  <Form.Select size="sm" className="d-inline-block me-2" style={{ width: 'auto' }}>
                    <option>All Students</option>
                    <option>Present Only</option>
                    <option>Late</option>
                  </Form.Select>
                  <Button variant="outline-primary" size="sm" onClick={exportToCSV}>
                    <FaDownload className="me-1" /> Export
                  </Button>
                </div>
              </div>
              
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Student ID</th>
                      <th>Department</th>
                      <th>Marked At</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, index) => (
                      <tr key={record._id}>
                        <td>{index + 1}</td>
                        <td>
                          {record.studentDetails?.name || 'N/A'}
                        </td>
                        <td>{record.studentDetails?.studentId || 'N/A'}</td>
                        <td>{record.studentDetails?.department || 'N/A'}</td>
                        <td>{formatDate(record.markedAt)}</td>
                        <td>
                          <Badge bg={record.status === 'present' ? 'success' : 'warning'}>
                            {record.status || 'present'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </Tab>
        
        <Tab eventKey="qr" title={
          <>
            <FaQrcode className="me-1" /> QR Code
          </>
        }>
          <Card>
            <Card.Body className="text-center py-5">
              <div className="d-flex justify-content-center mb-4">
                <div className="border p-3 bg-white">
                  <QRCode 
                    value={JSON.stringify({
                      sessionId: session._id,
                      sessionCode: session.sessionCode,
                      subject: session.subject,
                      expiresAt: session.expiresAt,
                      location: session.location
                    })} 
                    size={256} 
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>
              
              <h4>{session.subject}</h4>
              <p className="text-muted">
                Session Code: <code>{session.sessionCode}</code>
              </p>
              
              <div className="d-flex justify-content-center gap-2">
                <Button 
                  variant="outline-primary" 
                  onClick={copyToClipboard}
                  disabled={copied}
                >
                  {copied ? (
                    <>
                      <FaCheck className="me-1" /> Copied!
                    </>
                  ) : (
                    <>
                      <FaCopy className="me-1" /> Copy Session Data
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="primary"
                  onClick={() => {
                    // This would trigger a download in a real app
                    const link = document.createElement('a');
                    const canvas = document.querySelector('canvas');
                    if (canvas) {
                      link.href = canvas.toDataURL('image/png');
                      link.download = `attendance-${session.sessionCode}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                >
                  <FaDownload className="me-1" /> Download QR Code
                </Button>
              </div>
              
              {session.location && (
                <div className="mt-4 alert alert-info text-start">
                  <div className="d-flex align-items-center">
                    <FaMapMarkerAlt className="me-2" size={20} />
                    <div>
                      <strong>Location Verification Enabled</strong>
                      <div className="small">
                        Students must be within 100m of the specified location to mark attendance.
                      </div>
                      <div className="small mt-1">
                        Location: {session.location.name || 'No name specified'} 
                        ({session.location.coordinates[1].toFixed(6)}, {session.location.coordinates[0].toFixed(6)})
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-4 text-muted small">
                <FaExclamationTriangle className="me-1" />
                This QR code will expire on {new Date(session.expiresAt).toLocaleString()}
              </div>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
      
      {/* QR Code Modal */}
      <Modal show={showQRModal} onHide={() => setShowQRModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Attendance QR Code</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <div className="d-flex justify-content-center mb-4">
            <div className="border p-3 bg-white">
              <QRCode 
                value={JSON.stringify({
                  sessionId: session._id,
                  sessionCode: session.sessionCode,
                  subject: session.subject,
                  expiresAt: session.expiresAt,
                  location: session.location
                })} 
                size={256} 
                level="H"
                includeMargin={true}
              />
            </div>
          </div>
          
          <div className="mb-3">
            <h5>Session Code: <Badge bg="primary">{session.sessionCode}</Badge></h5>
            <p className="text-muted">Students can scan this code or enter the session code manually</p>
          </div>
          
          <div className="d-flex justify-content-center gap-2">
            <Button 
              variant="outline-primary" 
              onClick={() => {
                const link = document.createElement('a');
                const canvas = document.querySelector('canvas');
                if (canvas) {
                  link.href = canvas.toDataURL('image/png');
                  link.download = `attendance-${session.sessionCode}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}
            >
              <FaDownload className="me-1" /> Download
            </Button>
            
            <Button 
              variant="primary" 
              onClick={() => {
                setShowQRModal(false);
                setActiveTab('attendance');
              }}
            >
              View Attendance
            </Button>
          </div>
        </Modal.Body>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Session</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this session? This action cannot be undone.</p>
          <p className="text-danger">
            <FaExclamationTriangle className="me-1" />
            This will permanently delete all attendance records for this session.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowDeleteModal(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteSession}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Session'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
