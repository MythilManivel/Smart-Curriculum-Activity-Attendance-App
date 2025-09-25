import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import jwtDecode from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Set auth token header and check if token exists
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  };

  // Load user
  const loadUser = async () => {
    try {
      setAuthToken(token);
      const res = await axios.get('/api/auth/profile');
      setUser(res.data);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Register user
  const register = async (formData) => {
    try {
      const res = await axios.post('/api/auth/register', formData);
      const { token } = res.data;
      setToken(token);
      setAuthToken(token);
      await loadUser();
      toast.success('Registration successful!');
      navigate('/');
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Registration failed';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Login user
  const login = async (email, password, isFaculty = false, location = null) => {
    try {
      // Ensure email is a string
      const emailStr = typeof email === 'object' ? email.email : email;
      const passwordStr = typeof password === 'object' ? password.password : password;
      
      const endpoint = isFaculty ? '/api/auth/faculty/login' : '/api/auth/login';
      const loginData = { 
        email: emailStr, 
        password: passwordStr 
      };
      
      // Add location data if provided (for faculty login)
      if (isFaculty && location) {
        loginData.location = location;
      }
      
      const res = await axios.post(endpoint, loginData);
      
      const { token, user } = res.data;
      
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);
      setAuthToken(token);
      
      // Store login location in localStorage for reference
      if (location) {
        localStorage.setItem('lastLoginLocation', JSON.stringify({
          coordinates: location.coordinates,
          timestamp: new Date().toISOString()
        }));
      }
      
      // Redirect based on user role
      if (user.role === 'faculty') {
        navigate('/faculty/dashboard');
      } else {
        navigate('/');
      }
      
      toast.success('Login successful!');
      return true;
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = err.response?.data?.message || 'Login failed';
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    }
  };

  // Logout user
  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthToken(null);
    navigate('/login');
    toast.success('Logged out successfully');
  };

  // Update user profile
  const updateProfile = async (formData) => {
    try {
      const res = await axios.put('/api/auth/profile', formData);
      setUser(res.data);
      if (res.data.token) {
        setToken(res.data.token);
        setAuthToken(res.data.token);
      }
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Update failed';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Check if token is expired
  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp < Date.now() / 1000;
    } catch (err) {
      return true;
    }
  };

  // Check for token on initial load
  useEffect(() => {
    if (token) {
      if (isTokenExpired(token)) {
        logout();
      } else {
        setAuthToken(token);
        loadUser();
      }
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        error,
        register,
        login,
        logout,
        updateProfile,
        loadUser
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;
