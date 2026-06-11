import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hook up Authorization headers and verify token on startup
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('zippli_token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const res = await axios.get('/api/auth/me');
          setCurrentUser(res.data);
        } catch (err) {
          console.error('Session expired or invalid token');
          localStorage.removeItem('zippli_token');
          delete axios.defaults.headers.common['Authorization'];
          setCurrentUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { token, user } = res.data;
      
      localStorage.setItem('zippli_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setCurrentUser(user);
      toast.success(`Welcome back, ${user.name}!`);
      return user;
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Try again.';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const register = async (name, email, phone, password, role, restaurantId) => {
    try {
      const res = await axios.post('/api/auth/register', { name, email, phone, password, role, restaurantId });
      const { token, user } = res.data;
      
      localStorage.setItem('zippli_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setCurrentUser(user);
      toast.success(`Account created! Welcome, ${user.name}!`);
      return user;
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed.';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('zippli_token');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    toast.success('Logged out successfully.');
  };

  const addAddress = async (addressData) => {
    try {
      const res = await axios.put('/api/auth/addresses', addressData);
      setCurrentUser(res.data);
      toast.success('Address added successfully!');
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to add address.';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const deleteAddress = async (addressId) => {
    try {
      const res = await axios.delete(`/api/auth/addresses/${addressId}`);
      setCurrentUser(res.data);
      toast.success('Address deleted successfully!');
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to delete address.';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    addAddress,
    deleteAddress,
    setCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
