import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BSNavbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { FaUserGraduate, FaChalkboardTeacher, FaQrcode, FaHistory, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../../context/authContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  const authLinks = (
    <>
      {user?.role === 'faculty' && (
        <>
          <Nav.Link as={Link} to="/faculty/dashboard">
            <FaChalkboardTeacher className="me-1" /> Faculty Dashboard
          </Nav.Link>
        </>
      )}
      
      {user?.role === 'teacher' && (
        <>
          <Nav.Link as={Link} to="/teacher">
            <FaChalkboardTeacher className="me-1" /> Dashboard
          </Nav.Link>
          <Nav.Link as={Link} to="/teacher/session/new">
            <FaQrcode className="me-1" /> New Session
          </Nav.Link>
        </>
      )}
      
      {user?.role === 'student' && (
        <>
          <Nav.Link as={Link} to="/student">
            <FaUserGraduate className="me-1" /> Dashboard
          </Nav.Link>
          <Nav.Link as={Link} to="/student/mark-attendance">
            <FaQrcode className="me-1" /> Mark Attendance
          </Nav.Link>
          <Nav.Link as={Link} to="/student/history">
            <FaHistory className="me-1" /> My History
          </Nav.Link>
        </>
      )}
      
      <NavDropdown title={user?.name || 'Profile'} id="user-dropdown" align="end">
        <NavDropdown.Item as={Link} to="/profile">Profile</NavDropdown.Item>
        <NavDropdown.Divider />
        <NavDropdown.Item onClick={onLogout}>
          <FaSignOutAlt className="me-1" /> Logout
        </NavDropdown.Item>
      </NavDropdown>
    </>
  );

  const guestLinks = (
    <>
      <Nav.Link as={Link} to="/login">Student/Teacher Login</Nav.Link>
      <Nav.Link as={Link} to="/faculty/login">Faculty Login</Nav.Link>
      <Nav.Link as={Link} to="/register">Register</Nav.Link>
    </>
  );

  return (
    <BSNavbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <BSNavbar.Brand as={Link} to="/">
          QR Attendance System
        </BSNavbar.Brand>
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {isAuthenticated ? authLinks : guestLinks}
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;
