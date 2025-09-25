import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Card, 
  Button, 
  Alert, 
  Spinner, 
  Modal,
  Row,
  Col,
  Badge,
  Form,
  ListGroup
} from 'react-bootstrap';
import { 
  FaQrcode, 
  FaCamera, 
  FaCheck, 
  FaTimes, 
  FaArrowLeft, 
  FaMapMarkerAlt
} from 'react-icons/fa';
import QrScanner from 'qr-scanner';
import axios from 'axios';
import { toast } from 'react-toastify';

// Default coordinates (used as fallback)
const DEFAULT_COORDS = {
  latitude: 28.6139,  // Example: New Delhi
  longitude: 77.2090,
  accuracy: 100,     // Default accuracy in meters
  maxDistance: 50    // Default max allowed distance in meters
};

// Helper function to calculate distance between two points (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180; // Convert to radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
};

export default function MarkAttendance() {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [location, setLocation] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [distance, setDistance] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState({
    location: false,
    distance: null,
    maxDistance: DEFAULT_COORDS.maxDistance,
    message: ''
  });
  
  const qrScannerRef = useRef(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const isMounted = useRef(true);
  
  // Clean up on unmount and when scanning state changes
  useEffect(() => {
    return () => {
      isMounted.current = false;
      stopScanning();
    };
  }, [stopScanning]);
  
  // Request camera permission and start scanning
  const startScanning = useCallback(async () => {
    try {
      // Stop any existing scanner first
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current = null;
      }
      
      setScanning(true);
      setError('');
      setSuccess('');
      setSessionData(null);
      setCameraError('');
      
      // Get the video element
      const videoElement = document.getElementById('qr-video');
      if (!videoElement) return;
      
      // Initialize QR Scanner
      qrScannerRef.current = new QrScanner(
        videoElement,
        (result) => handleScan(result),
        {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5,
          returnDetailedScanResult: true
        }
      );
      
      // Start the scanner
      await qrScannerRef.current.start();
      
    } catch (err) {
      console.error('QR Scanner error:', err);
      handleError(err);
      stopScanning();
    }
  }, [handleScan, stopScanning]);
  
  // Get user's current location
  const getCurrentLocation = useCallback(async (sessionLocation) => {
    setLoading(true);
    setLocationError('');
    
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }
      
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      if (!isMounted.current) return;
      
      const { latitude, longitude, accuracy } = position.coords;
      const currentLocation = { latitude, longitude, accuracy };
      
      setLocation(currentLocation);
      
      // If we have session location, verify the distance
      if (sessionLocation?.coordinates) {
        const [sessionLng, sessionLat] = sessionLocation.coordinates;
        const distance = calculateDistance(
          sessionLat,
          sessionLng,
          latitude,
          longitude
        );
        
        const maxDistance = sessionLocation.radius || DEFAULT_COORDS.maxDistance;
        const isWithinDistance = distance <= maxDistance;
        
        setDistance(distance);
        
        setVerificationStatus({
          location: isWithinDistance,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
          maxDistance,
          message: isWithinDistance 
            ? 'You are within the allowed distance.' 
            : `You are ${Math.round(distance - maxDistance)}m outside the allowed area.`
        });
        
        // Automatically mark attendance if within distance
        if (isWithinDistance && sessionData) {
          await markAttendance(sessionData.sessionId, currentLocation);
        }
      }
      
    } catch (err) {
      console.error('Geolocation error:', err);
      if (!isMounted.current) return;
      
      let errorMessage = 'Could not get your location. ';
      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage += 'Please enable location services and refresh the page.';
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage += 'Location information is unavailable.';
          break;
        case err.TIMEOUT:
          errorMessage += 'The request to get your location timed out.';
          break;
        default:
          errorMessage += 'Please try again.';
      }
      
      setLocationError(errorMessage);
      setVerificationStatus(prev => ({
        ...prev,
        location: false,
        message: errorMessage
      }));
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [sessionData]);
  
  // Handle QR code scan
  const handleScan = useCallback((result) => {
    if (result) {
      try {
        const parsedData = JSON.parse(result.data);
        
        // Validate the QR code data
        if (!parsedData.sessionId || !parsedData.sessionCode) {
          throw new Error('Invalid QR code format');
        }
        
        setSessionData(parsedData);
        setScanning(false);
        
        // Get user's current location
        getCurrentLocation(parsedData.location);
        
      } catch (err) {
        console.error('Error parsing QR code:', err);
        setError('Invalid QR code. Please scan a valid attendance QR code.');
        setScanning(false);
      }
    }
  }, [getCurrentLocation]);
  
  // Mark attendance
  const markAttendance = async (sessionId, locationData) => {
    if (!sessionId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      const response = await axios.post(
        '/api/attendance/mark',
        {
          sessionId,
          location: {
            coordinates: [locationData.longitude, locationData.latitude],
            accuracy: locationData.accuracy || 0
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          }
        }
      );
      
      if (!isMounted.current) return;
      
      const { data } = response;
      
      if (data.success) {
        setAttendanceRecord(data.data.attendance);
        setSuccess(data.message || 'Attendance marked successfully!');
        setShowSuccessModal(true);
      } else {
        throw new Error(data.message || 'Failed to mark attendance');
      }
      
    } catch (err) {
      console.error('Mark attendance error:', err);
      if (!isMounted.current) return;
      
      const errorMessage = err.response?.data?.message || 
                         err.message || 
                         'Failed to mark attendance. Please try again.';
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };
  
  // Handle scan errors
  const handleError = (err) => {
    console.error('QR Scanner Error:', err);
    
    // Stop any active scanner
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current = null;
    }
    
    if (err.name === 'NotAllowedError') {
      setCameraError('Camera access was denied. Please allow camera access to scan QR codes.');
    } else if (err.name === 'NotFoundError') {
      setCameraError('No camera found. Please check your device settings.');
    } else if (err.name === 'NotReadableError') {
      setCameraError('Camera is already in use by another application.');
    } else if (err.name === 'OverconstrainedError') {
      setCameraError('Camera constraints could not be satisfied.');
    } else if (err.name === 'SecurityError') {
      setCameraError('Camera access is not allowed in this context.');
    } else {
      setCameraError('Failed to access camera. Please try again or enter the code manually.');
    }
    
    setScanning(false);
  };
  
  // Stop camera when not scanning
  const stopScanning = useCallback(() => {
    try {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current = null;
      }
    } catch (err) {
      console.warn('Error while stopping QR scanner:', err);
    } finally {
      setScanning(false);
    }
  }, []);

  // Submit attendance
  const submitAttendance = async () => {
    if (!sessionData) {
      setError('No session data available');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const payload = {
        sessionCode: sessionData.sessionCode,
        location: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          name: 'Student Location',
          accuracy: location.accuracy
        } : null
      };
      
      // In a real app, you would make an API call here
      // const response = await axios.post('/api/attendance/mark', payload);
      
      // Mock response for demo
      setTimeout(() => {
        const mockResponse = {
          success: true,
          message: 'Attendance marked successfully!',
          record: {
            id: 'mock123',
            sessionId: sessionData.sessionId,
            markedAt: new Date().toISOString(),
            status: distance <= 100 ? 'present' : 'late',
            location: payload.location
          }
        };
        
        setAttendanceRecord(mockResponse.record);
        setShowSuccessModal(true);
        setSuccess(mockResponse.message);
        setLoading(false);
      }, 1000);
      
    } catch (err) {
      console.error('Error marking attendance:', err);
      setError(err.response?.data?.message || 'Failed to mark attendance. Please try again.');
      setLoading(false);
    }
  };
  
  // Handle manual code submission
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    setShowManualEntry(false);
    
    try {
      // Get current location first
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      const { latitude, longitude, accuracy } = position.coords;
      const currentLocation = { latitude, longitude, accuracy };
      
      // Mark attendance with manual code
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      const response = await axios.post(
        '/api/attendance/mark',
        {
          sessionCode: manualCode.trim().toUpperCase(),
          location: {
            coordinates: [longitude, latitude],
            accuracy: accuracy || 0
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          }
        }
      );
      
      if (!isMounted.current) return;
      
      const { data } = response;
      
      if (data.success) {
        setAttendanceRecord(data.data.attendance);
        setSuccess(data.message || 'Attendance marked successfully!');
        setShowSuccessModal(true);
      } else {
        throw new Error(data.message || 'Failed to mark attendance');
      }
      
    } catch (err) {
      console.error('Manual attendance error:', err);
      if (!isMounted.current) return;
      
      const errorMessage = err.response?.data?.message || 
                         err.message || 
                         'Failed to mark attendance. Please try again.';
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setManualCode('');
      }
    }
  };
  
  // Handle back button
  const handleBack = () => {
    stopScanning();
    navigate(-1);
  };
  
  // Toggle manual entry mode
  const toggleManualEntry = () => {
    if (scanning) {
      stopScanning();
    }
    setShowManualEntry(prev => !prev);
    if (!showManualEntry) {
      setManualCode('');
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle modal close
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    stopScanning();
  };

  return (
    <Container className="py-4">
      <Button 
        variant="outline-secondary" 
        className="mb-3" 
        onClick={handleBack}
      >
        <FaArrowLeft className="me-1" /> Back
      </Button>
      
      <h2 className="mb-4">Mark Attendance</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      {!sessionData ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            {scanning ? (
              <>
                <h4 className="mb-4">Scan QR Code</h4>
                <p className="text-muted mb-4">Position the QR code within the frame to scan</p>
                
                <div className="position-relative" style={{ maxWidth: '400px', margin: '0 auto' }}>
                  <video
                    id="qr-video"
                    ref={videoRef}
                    style={{
                      width: '100%',
                      borderRadius: '8px',
                      border: '1px solid #dee2e6'
                    }}
                    playsInline
                  />
                  
                  {/* Scanner frame overlay */}
                  <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
                    style={{ pointerEvents: 'none' }}>
                    <div style={{
                      width: '80%',
                      height: '60%',
                      border: '3px solid rgba(13, 110, 253, 0.5)',
                      borderRadius: '10px',
                      boxShadow: '0 0 0 100vmax rgba(0, 0, 0, 0.5)'
                    }}></div>
                  </div>
                </div>
                
                {cameraError && (
                  <Alert variant="warning" className="mt-4">
                    {cameraError}
                  </Alert>
                )}
                
                <div className="mt-4">
                  <Button 
                    variant="outline-danger" 
                    className="me-2"
                    onClick={() => setScanning(false)}
                  >
                    Cancel
                  </Button>
                  
                  <Button 
                    variant="outline-primary"
                    onClick={toggleManualEntry}
                  >
                    Enter Code Manually
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-4" 
                  style={{ width: '120px', height: '120px' }}>
                  <FaQrcode size={48} className="text-primary" />
                </div>
                
                <h4 className="mb-3">Scan QR Code</h4>
                <p className="text-muted mb-4">
                  Scan the QR code provided by your teacher to mark your attendance
                </p>
                
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="mb-3"
                  onClick={startScanning}
                >
                  <FaCamera className="me-2" />
                  Scan QR Code
                </Button>
                
                <div className="mt-3">
                  <Button 
                    variant="link" 
                    onClick={toggleManualEntry}
                  >
                    Or enter code manually
                  </Button>
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <h4 className="mb-4">Confirm Attendance</h4>
            
            <Row className="mb-4">
              <Col md={6}>
                <div className="mb-3">
                  <h6 className="text-muted mb-1">Subject</h6>
                  <p className="h5">{sessionData.subject || 'N/A'}</p>
                </div>
                
                <div className="mb-3">
                  <h6 className="text-muted mb-1">Session Code</h6>
                  <p className="h5">
                    <Badge bg="primary">{sessionData.sessionCode}</Badge>
                  </p>
                </div>
                
                <div className="mb-3">
                  <h6 className="text-muted mb-1">Expires</h6>
                  <p className="mb-0">
                    {formatDate(sessionData.expiresAt)}
                  </p>
                </div>
              </Col>
              
              <Col md={6}>
                {location ? (
                  <div className="mb-3">
                    <h6 className="text-muted mb-1">
                      <FaMapMarkerAlt className="me-1 text-danger" />
                      Your Location
                    </h6>
                    <p className="mb-1">
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </p>
                    {location.accuracy && (
                      <small className="text-muted">
                        Accuracy: ±{Math.round(location.accuracy)} meters
                      </small>
                    )}
                    
                    {sessionData.location && distance !== null && (
                      <div className="mt-2">
                        <div className="d-flex align-items-center">
                          <FaMapMarkerAlt className="me-2 text-success" />
                          <span>Class Location</span>
                        </div>
                        <p className="mb-1">
                          {sessionData.location.coordinates[1].toFixed(6)}, {sessionData.location.coordinates[0].toFixed(6)}
                        </p>
                        <p className={distance <= 100 ? 'text-success' : 'text-warning'}>
                          {distance <= 100 ? (
                            <>
                              <FaCheck className="me-1" />
                              You are within range ({Math.round(distance)}m)
                            </>
                          ) : (
                            <>
                              <FaTimes className="me-1" />
                              You are {Math.round(distance)}m away (max 100m allowed)
                            </>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="alert alert-warning">
                    <FaTimes className="me-1" />
                    Could not determine your location. Attendance may not be recorded correctly.
                  </div>
                )}
                
                {locationError && (
                  <div className="alert alert-warning">
                    {locationError}
                  </div>
                )}
              </Col>
            </Row>
            
            <div className="d-flex justify-content-between pt-3 border-top">
              <Button 
                variant="outline-secondary" 
                onClick={() => {
                  setSessionData(null);
                  setLocation(null);
                  setError('');
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              
              <Button 
                variant="primary" 
                onClick={submitAttendance}
                disabled={loading}
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
                    Marking Attendance...
                  </>
                ) : (
                  'Confirm Attendance'
                )}
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}
      
      {/* Manual Entry Modal */}
      <Modal show={showManualEntry} onHide={() => setShowManualEntry(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Enter Session Code</Modal.Title>
        </Modal.Header>
        <form onSubmit={handleManualSubmit}>
          <Modal.Body>
            <p className="text-muted">
              Enter the attendance code provided by your teacher.
            </p>
            
            <Form.Group controlId="manualCode">
              <Form.Label>Session Code</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., A1B2C3D4"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                autoFocus
                required
              />
            </Form.Group>
            
            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setShowManualEntry(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={!manualCode.trim()}
            >
              Submit
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
      
      {/* Success Modal */}
      <Modal show={showSuccessModal} onHide={handleCloseSuccessModal} centered>
        <Modal.Body className="text-center p-5">
          <div className="bg-success bg-opacity-10 d-inline-flex align-items-center justify-content-center rounded-circle mb-4" 
            style={{ width: '100px', height: '100px' }}>
            <FaCheck size={48} className="text-success" />
          </div>
          
          <h4 className="mb-3">Attendance Recorded!</h4>
          
          {attendanceRecord && (
            <div className="text-start mb-4">
              <p className="mb-1"><strong>Subject:</strong> {sessionData?.subject || 'N/A'}</p>
              <p className="mb-1"><strong>Status:</strong> 
                <Badge bg={attendanceRecord.status === 'present' ? 'success' : 'warning'} className="ms-2">
                  {attendanceRecord.status === 'present' ? 'Present' : 'Late'}
                </Badge>
              </p>
              <p className="mb-0"><strong>Time:</strong> {formatDate(attendanceRecord.markedAt)}</p>
              
              {attendanceRecord.location && (
                <div className="mt-3 p-3 bg-light rounded">
                  <h6 className="mb-2">
                    <FaMapMarkerAlt className="me-2 text-primary" />
                    Location Recorded
                  </h6>
                  <p className="mb-1 small">
                    {attendanceRecord.location.latitude.toFixed(6)}, {attendanceRecord.location.longitude.toFixed(6)}
                  </p>
                  {attendanceRecord.location.accuracy && (
                    <p className="mb-0 small text-muted">
                      Accuracy: ±{Math.round(attendanceRecord.location.accuracy)} meters
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className="d-grid gap-2">
            <Button 
              variant="primary" 
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/student/history');
              }}
            >
              View Attendance History
            </Button>
            
            <Button 
              variant="outline-secondary" 
              onClick={() => {
                setShowSuccessModal(false);
                setSessionData(null);
                setLocation(null);
              }}
            >
              Mark Another Attendance
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
}
