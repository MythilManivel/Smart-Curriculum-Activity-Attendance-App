import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Form, Button, Card, Alert, Row, Col } from 'react-bootstrap';
import { useAuth } from '../context/authContext';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    studentId: '',
    department: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const { 
    name, 
    email, 
    password, 
    confirmPassword, 
    role, 
    studentId, 
    department 
  } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    try {
      setError('');
      setLoading(true);
      
      const userData = {
        name,
        email,
        password,
        role,
      };
      
      // Only include studentId and department if role is student
      if (role === 'student') {
        userData.studentId = studentId;
        userData.department = department;
      }
      
      await register(userData);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to create an account');
    }
    
    setLoading(false);
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '90vh' }}>
      <div className="w-100" style={{ maxWidth: '600px' }}>
        <Card>
          <Card.Body>
            <h2 className="text-center mb-4">Create Account</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={onSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="name">
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={name}
                      onChange={onChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={email}
                      onChange={onChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="password">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={password}
                      onChange={onChange}
                      minLength="6"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="confirmPassword">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={onChange}
                      minLength="6"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-3" controlId="role">
                <Form.Label>I am a</Form.Label>
                <Form.Select 
                  name="role" 
                  value={role} 
                  onChange={onChange}
                  required
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </Form.Select>
              </Form.Group>
              
              {role === 'student' && (
                <>
                  <Form.Group className="mb-3" controlId="studentId">
                    <Form.Label>Student ID</Form.Label>
                    <Form.Control
                      type="text"
                      name="studentId"
                      value={studentId}
                      onChange={onChange}
                      required={role === 'student'}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3" controlId="department">
                    <Form.Label>Department</Form.Label>
                    <Form.Control
                      type="text"
                      name="department"
                      value={department}
                      onChange={onChange}
                      required={role === 'student'}
                    />
                  </Form.Group>
                </>
              )}
              
              <Button disabled={loading} className="w-100 mt-3" type="submit">
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
        <div className="w-100 text-center mt-2">
          Already have an account? <Link to="/login">Log In</Link>
        </div>
      </div>
    </Container>
  );
}
