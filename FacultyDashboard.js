import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { toast } from 'react-toastify';
import { Container, Card, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { FaQrcode, FaMapMarkerAlt, FaSyncAlt, FaClipboard, FaCheck } from 'react-icons/fa';
import QRCode from 'qrcode.react';

const FacultyDashboard = () => {
  // State hooks must be called at the top level
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [qrData, setQrData] = useState('');
  const [sessionActive, setSessionActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [locationError, setLocationError] = useState('');
  
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();

  // Redirect if not authenticated or not faculty
  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'faculty')) {
      toast.error('Please log in as faculty to access this page');
      navigate('/faculty/login');
    }
  }, [isAuthenticated, user, loading, navigate]);

  if (loading || !isAuthenticated || user?.role !== 'faculty') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Get current location
  const getLocation = () => {
    setIsLoading(true);
    setLocationError('');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Unable to retrieve your location. Please enable location services.');
          setIsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
      setIsLoading(false);
    }
  };

  // Generate QR Code with location data
  const generateQRCode = () => {
    if (!location) {
      toast.error('Please enable location services first');
      return;
    }
    
    // Create a unique session ID
    const sessionId = `sess_${Date.now()}`;
    
    // Create QR data with location and session info
    const qrData = {
      sessionId,
      timestamp: new Date().toISOString(),
      location: {
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy
      },
      type: 'attendance',
      facultyId: 'faculty_123' // Replace with actual faculty ID from auth
    };
    
    setQrData(JSON.stringify(qrData));
    setSessionActive(true);
    toast.success('QR Code generated successfully!');
  };

  // Copy QR data to clipboard
  const copyToClipboard = () => {
    if (!qrData) return;
    
    navigator.clipboard.writeText(qrData).then(() => {
      setCopied(true);
      toast.success('QR data copied to clipboard!');
      
      // Reset copied state after 3 seconds
      setTimeout(() => setCopied(false), 3000);
    });
  };

  // Stop the session
  const stopSession = () => {
    setSessionActive(false);
    setQrData('');
    setLocation(null);
    toast.info('Attendance session ended');
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">Faculty Dashboard</h2>
      
      <Row className="mb-4">
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <FaMapMarkerAlt className="me-2" />
                Location Information
              </h5>
            </Card.Header>
            <Card.Body>
              {locationError && <Alert variant="danger">{locationError}</Alert>}
              
              {location ? (
                <div>
                  <p><strong>Latitude:</strong> {location.lat.toFixed(6)}</p>
                  <p><strong>Longitude:</strong> {location.lng.toFixed(6)}</p>
                  <p><strong>Accuracy:</strong> {Math.round(location.accuracy)} meters</p>
                  <Button 
                    variant="outline-primary" 
                    onClick={getLocation}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Spinner as="span" size="sm" animation="border" role="status" className="me-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FaSyncAlt className="me-2" />
                        Update Location
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="primary" 
                  onClick={getLocation}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner as="span" size="sm" animation="border" role="status" className="me-2" />
                      Getting Location...
                    </>
                  ) : (
                    <>
                      <FaMapMarkerAlt className="me-2" />
                      Get Current Location
                    </>
                  )}
                </Button>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <FaQrcode className="me-2" />
                Attendance QR Code
              </h5>
            </Card.Header>
            <Card.Body className="d-flex flex-column align-items-center">
              {sessionActive ? (
                <>
                  <div className="mb-3">
                    <QRCode 
                      value={qrData} 
                      size={200} 
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="outline-primary" 
                      onClick={copyToClipboard}
                      disabled={!qrData}
                    >
                      {copied ? (
                        <>
                          <FaCheck className="me-2" /> Copied!
                        </>
                      ) : (
                        <>
                          <FaClipboard className="me-2" /> Copy QR Data
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="danger" 
                      onClick={stopSession}
                    >
                      Stop Session
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-muted mb-4">
                    Generate a QR code to start an attendance session. Students will scan this code to mark their attendance.
                  </p>
                  <Button 
                    variant="success" 
                    onClick={generateQRCode}
                    disabled={!location || isLoading}
                  >
                    <FaQrcode className="me-2" />
                    Generate QR Code
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {sessionActive && (
        <Card className="shadow-sm">
          <Card.Header className="bg-info text-white">
            <h5 className="mb-0">Active Session</h5>
          </Card.Header>
          <Card.Body>
            <p>Session is active. Students can now scan the QR code to mark attendance.</p>
            <p className="text-muted small">
              <strong>Note:</strong> Keep this page open to maintain the active session.
            </p>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default FacultyDashboard;
