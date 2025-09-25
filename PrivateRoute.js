import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

const PrivateRoute = ({ children, role }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  if (!isAuthenticated) {
    // Redirect to login page, but save the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if the user has the required role
  if (role && user?.role !== role) {
    // Redirect to home page if role doesn't match
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;
