import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Form, Button, Card, Container, Alert, Spinner, Modal } from 'react-bootstrap';
import { FaSignInAlt, FaUniversity, FaSpinner, FaMapMarkerAlt, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../../context/authContext';
import { toast } from 'react-toastify';

// Default coordinates for the institution (example: New Delhi)
const DEFAULT_COORDS = {
  latitude: 28.6139,
  longitude: 77.2090,
  maxDistance: 500 // Maximum allowed distance in meters
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

const FacultyLogin = () => {
  const [formData, setFormData] = useState({
    email: 'faculty@example.com',
    password: 'password123'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [location, setLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [isWithinRange, setIsWithinRange] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();

  const { email, password } = formData;

  useEffect(() => {
    if (isAuthenticated && user?.role === 'faculty') {
      navigate('/faculty/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    setLoading(true);
    setLocationError('');
    
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = new Error('Geolocation is not supported by your browser');
        setLocationError(error.message);
        setShowLocationModal(true);
        setLoading(false);
        reject(error);
        return;
      }
      
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const currentLocation = { 
            latitude, 
            longitude, 
            accuracy,
            timestamp: new Date().toISOString()
          };
          
          // Calculate distance from institution
          const distance = calculateDistance(
            latitude,
            longitude,
            DEFAULT_COORDS.latitude,
            DEFAULT_COORDS.longitude
          );
          
          const withinRange = distance <= DEFAULT_COORDS.maxDistance;
          
          setLocation(currentLocation);
          setDistance(distance);
          setIsWithinRange(withinRange);
          
          // Resolve with the location data regardless of range
          // The actual range check will be done in the onSubmit handler
          resolve(currentLocation);
          setLoading(false);
        },
        (err) => {
          let errorMessage = 'Could not get your location. ';
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location services in your browser settings to continue.';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. Please check your device settings.';
              break;
            case err.TIMEOUT:
              errorMessage = 'The request to get your location timed out. Please try again.';
              break;
            default:
              errorMessage = 'An error occurred while getting your location. Please try again.';
          }
          
          setLocationError(errorMessage);
          setShowLocationModal(true);
          setLoading(false);
          
          reject(new Error(errorMessage));
        },
        options
      );
    });
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLocationError('');
    
    try {
      // First get the user's location
      const location = await getCurrentLocation();
      
      // Create location object in GeoJSON format
      const locationData = {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
        accuracy: location.accuracy
      };
      
      // Calculate distance from institution
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        DEFAULT_COORDS.latitude,
        DEFAULT_COORDS.longitude
      );
      
      // Check if within allowed distance
      if (distance > DEFAULT_COORDS.maxDistance) {
        setLocationError(`You are ${Math.round(distance)}m away from the institution. Maximum allowed is ${DEFAULT_COORDS.maxDistance}m.`);
        setShowLocationModal(true);
        setLoading(false);
        return;
      }
      
      // Proceed with login using the location data
      try {
        const success = await login(formData.email, formData.password, true, locationData);
        if (!success) {
          setError('Invalid credentials. Please try again.');
        }
      } catch (error) {
        console.error('Login error:', error);
        
        // Handle specific error cases
        if (error.response) {
          const { status, data } = error.response;
          
          if (status === 403 && data.code === 'LOCATION_OUT_OF_RANGE') {
            setLocationError(data.message || 'You are too far from the institution to log in.');
            setShowLocationModal(true);
          } else if (status === 400 && data.code === 'LOCATION_REQUIRED') {
            setLocationError('Location data is required for faculty login.');
            setShowLocationModal(true);
          } else if (status === 401) {
            setError('Invalid credentials. Please try again.');
          } else {
            setError(data.message || 'An error occurred during login. Please try again.');
          }
        } else {
          setError('Network error. Please check your connection and try again.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      if (!err.message.includes('Location out of range') && !err.message.includes('Could not get your location')) {
        const errorMsg = err.response?.data?.message || 'An error occurred during login. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // If already logged in as faculty, redirect to dashboard
  if (isAuthenticated && user?.role === 'faculty') {
    return <Navigate to="/faculty/dashboard" />;
  }

  if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <Container className="mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <Card className="shadow">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <FaUniversity className="me-2" /> Faculty Login
              </h4>
              {location ? (
                <div className="d-flex align-items-center">
                  <FaMapMarkerAlt 
                    className={`me-2 ${isWithinRange ? 'text-success' : 'text-warning'}`} 
                  />
                  <small className={isWithinRange ? 'text-success' : 'text-warning'}>
                    {isWithinRange ? (
                      <span>Within institution ({Math.round(distance)}m)</span>
                    ) : (
                      <span>Outside institution ({Math.round(distance)}m)</span>
                    )}
                  </small>
                </div>
              ) : (
                <div className="d-flex align-items-center text-warning">
                  <FaMapMarkerAlt className="me-2" />
                  <small>Location not verified</small>
                </div>
              )}
            </Card.Header>
            <Card.Body className="bg-light">
              <p className="text-center text-muted mb-4">
                Demo Credentials:<br />
                <strong>Email:</strong> faculty@example.com<br />
                <strong>Password:</strong> password123
              </p>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={onSubmit}>
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter email"
                    name="email"
                    value={email}
                    onChange={onChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Password"
                    name="password"
                    value={password}
                    onChange={onChange}
                    required
                  />
                </Form.Group>

                <div className="d-grid">
                  <div className="d-grid gap-2">
                    <Button 
                      variant={location && isWithinRange ? 'success' : 'primary'} 
                      type="submit" 
                      className="mt-3 position-relative"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <FaSpinner className="fa-spin me-2" /> 
                          {location ? 'Verifying location...' : 'Getting location...'}
                        </>
                      ) : (
                        <>
                          <FaSignInAlt className="me-2" /> 
                          {location ? (
                            isWithinRange ? 'Login with Verified Location' : 'Login Outside Institution'
                          ) : (
                            'Login with Location'
                          )}
                        </>
                      )}
                      {location && isWithinRange && (
                        <span className="position-absolute top-0 start-100 translate-middle p-2 bg-success border border-light rounded-circle">
                          <span className="visually-hidden">Location verified</span>
                        </span>
                      )}
                    </Button>
                    
                    {locationError && (
                      <Alert variant="warning" className="mt-3 mb-0">
                        <FaExclamationTriangle className="me-2" />
                        {locationError}
                      </Alert>
                    )}
                  </div>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </div>
      </div>
      
      {/* Location Error Modal */}
      <Modal show={showLocationModal} onHide={() => setShowLocationModal(false)} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            <FaExclamationTriangle className="text-warning me-2" />
            Location Verification
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {locationError ? (
            <div>
              <p>{locationError}</p>
              {distance && (
                <p className="mb-0">
                  Distance from institution: <strong>{Math.round(distance)}m</strong>
                  <br />
                  Maximum allowed: <strong>{DEFAULT_COORDS.maxDistance}m</strong>
                </p>
              )}
            </div>
          ) : (
            <p>We couldn't verify your location. Please try again or contact support.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLocationModal(false)}>
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowLocationModal(false);
              getCurrentLocation();
            }}
          >
            Try Again
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default FacultyLogin;
