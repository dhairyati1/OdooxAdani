import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Auth Context
 * 
 * Manages authentication state and JWT token.
 * Stores token and user info in localStorage.
 */

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user and token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('gearGuardToken');
    const storedUser = localStorage.getItem('gearGuardUser');
    
    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('gearGuardToken');
        localStorage.removeItem('gearGuardUser');
      }
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    // Store token and user info
    localStorage.setItem('gearGuardToken', token);
    localStorage.setItem('gearGuardUser', JSON.stringify(userData));
    
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gearGuardToken');
    localStorage.removeItem('gearGuardUser');
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
