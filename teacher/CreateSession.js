import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Card, 
  Form, 
  Button, 
  Row, 
  Col, 
  Alert, 
  Spinner,
  Modal,
  Badge
} from 'react-bootstrap';
import { FaQrcode, FaMapMarkerAlt, FaCopy, FaCheck, FaArrowLeft } from 'react-icons/fa';
import QRCode from 'qrcode.react';
import axios from 'axios';

// Default coordinates (can be set to your institution's location)
const DEFAULT_COORDS = {
  latitude: 28.6139,  // Example: New Delhi
  longitude: 77.2090
};

export default function CreateSession() {
  const [formData, setFormData] = useState({
    subject: '',
    duration: 60, // in minutes
    enableLocation: true,
    location: {
      latitude: null,
      longitude: null,
      name: ''
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locationError, setLocationError] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const navigate = useNavigate();
  
  // Get user's current location
  useEffect(() => {
    if (formData.enableLocation && navigator.geolocation) {
      setLoading(true);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              name: 'Current Location'
            }
          }));
          setLocationError('');
          setLoading(false);
        },
        (err) => {
          console.error('Error getting location:', err);
          setLocationError('Could not get your location. Using default location.');
          
          // Set default coordinates if location access is denied
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              latitude: DEFAULT_COORDS.latitude,
              longitude: DEFAULT_COORDS.longitude,
              name: 'Default Location'
            }
          }));
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }
  }, [formData.enableLocation]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else if (name.startsWith('location.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          [field]: field === 'name' ? value : parseFloat(value) || 0
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'number' ? parseInt(value, 10) : value
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject.trim()) {
      setError('Please enter a subject');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const sessionData = {
        subject: formData.subject,
        durationMinutes: formData.duration,
        location: formData.enableLocation ? {
          type: 'Point',
          coordinates: [
            parseFloat(formData.location.longitude),
            parseFloat(formData.location.latitude)
          ],
          name: formData.location.name || 'Class Location',
          radius: 5 // Default radius in meters
        } : null
      };
      
      console.log('Sending session data:', sessionData);
      
      const response = await axios.post('/api/attendance/sessions', sessionData);
      
      console.log('Session created:', response.data);
      
      if (response.data.success && response.data.qrCode) {
        setQrData({
          sessionId: response.data.session._id,
          sessionCode: response.data.session.sessionCode,
          qrCode: response.data.qrCode,
          qrData: response.data.qrData
        });
        
        setSuccess('Attendance session created successfully!');
        setShowQRModal(true);
      } else {
        throw new Error('Failed to generate QR code');
      }
    } catch (err) {
      console.error('Error creating session:', err);
      setError(err.response?.data?.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };
  
  const copyToClipboard = () => {
    if (qrData) {
      navigator.clipboard.writeText(JSON.stringify(qrData.qrData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleCloseQRModal = () => {
    setShowQRModal(false);
    navigate('/teacher');
  };

  return (
    <Container className="py-4">
      <Button 
        variant="outline-secondary" 
        className="mb-3" 
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft className="me-1" /> Back to Dashboard
      </Button>
      
      <h2 className="mb-4">Create New Attendance Session</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="subject">
                  <Form.Label>Subject/Class Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="e.g., Mathematics 101"
                    required
                  />
                  <Form.Text className="text-muted">
                    Enter a descriptive name for this session
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="duration">
                  <Form.Label>Session Duration (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    name="duration"
                    min="1"
                    max="1440"
                    value={formData.duration}
                    onChange={handleChange}
                  />
                  <Form.Text className="text-muted">
                    How long should this session remain active? (Max 24 hours)
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="enableLocation">
                  <Form.Check
                    type="checkbox"
                    name="enableLocation"
                    label="Enable Location Verification"
                    checked={formData.enableLocation}
                    onChange={handleChange}
                  />
                  <Form.Text className="text-muted">
                    When enabled, students must be near this location to mark attendance
                  </Form.Text>
                </Form.Group>
                
                {formData.enableLocation && (
                  <div className="p-3 border rounded">
                    <h5><FaMapMarkerAlt className="me-2" />Location Details</h5>
                    
                    {locationError && (
                      <Alert variant="warning" className="small">
                        {locationError}
                      </Alert>
                    )}
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Latitude</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.000001"
                            name="location.latitude"
                            value={formData.location.latitude || ''}
                            onChange={handleChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Longitude</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.000001"
                            name="location.longitude"
                            value={formData.location.longitude || ''}
                            onChange={handleChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Form.Group>
                      <Form.Label>Location Name (Optional)</Form.Label>
                      <Form.Control
                        type="text"
                        name="location.name"
                        value={formData.location.name || ''}
                        onChange={handleChange}
                        placeholder="e.g., Room 101, Main Building"
                      />
                    </Form.Group>
                    
                    {formData.location.latitude && formData.location.longitude && (
                      <div className="mt-3">
                        <a
                          href={`https://www.google.com/maps?q=${formData.location.latitude},${formData.location.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary"
                        >
                          <FaMapMarkerAlt className="me-1" />
                          View on Map
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="d-grid gap-2 mt-4">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Creating Session...
                      </>
                    ) : (
                      <>
                        <FaQrcode className="me-2" />
                        Generate QR Code
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card>
            <Card.Header className="bg-light">
              <h5 className="mb-0">Quick Tips</h5>
            </Card.Header>
            <Card.Body>
              <ul className="list-unstyled">
                <li className="mb-3">
                  <strong>1. Display the QR Code</strong>
                  <p className="small mb-0">Project it on a screen or share it with students via your preferred method.</p>
                </li>
                <li className="mb-3">
                  <strong>2. Location Verification</strong>
                  <p className="small mb-0">
                    When enabled, students must be within ~100 meters of the specified location to mark attendance.
                  </p>
                </li>
                <li className="mb-3">
                  <strong>3. Session Duration</strong>
                  <p className="small mb-0">
                    Set an appropriate duration based on your class length. The session will automatically expire after this time.
                  </p>
                </li>
                <li>
                  <strong>4. View Attendance</strong>
                  <p className="small mb-0">
                    After the session, you can view and download attendance records from the session details page.
                  </p>
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* QR Code Modal */}
      <Modal show={showQRModal} onHide={handleCloseQRModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Attendance QR Code</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p className="lead">Scan this QR code with your device's camera to mark attendance</p>
          
          <div className="d-flex justify-content-center my-4">
            <div className="border p-3 bg-white">
              {qrData?.qrCode ? (
                <>
                  <img 
                    src={qrData.qrCode} 
                    alt="QR Code" 
                    className="img-fluid" 
                    style={{ maxWidth: '300px' }}
                  />
                  <div className="mt-2 small text-muted">
                    Session: {qrData.sessionCode}
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <Spinner animation="border" variant="primary" />
                  <div className="mt-2">Generating QR Code...</div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-3">
            <h5>Session Code: <Badge bg="primary">{qrData?.sessionCode}</Badge></h5>
            <p className="text-muted">Students can also enter this code manually</p>
          </div>
          
          <div className="mb-3">
            <Button 
              variant="outline-primary" 
              className="me-2"
              onClick={() => {
                // This would trigger a download in a real app
                const link = document.createElement('a');
                link.href = qrData?.qrCode || '#';
                link.download = `attendance-${qrData?.sessionCode}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              Download QR Code
            </Button>
            
            <Button 
              variant="outline-secondary" 
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
          </div>
          
          <div className="alert alert-info small text-start">
            <strong>Note:</strong> This QR code will be valid until the session expires. 
            You can view and manage this session from your dashboard.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseQRModal}>
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={() => navigate(`/teacher/session/${qrData?.sessionId}`)}
          >
            View Session Details
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
