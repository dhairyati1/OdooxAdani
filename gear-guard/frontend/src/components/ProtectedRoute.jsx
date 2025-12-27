import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protected Route Component
 * 
 * Wraps routes that require authentication and specific roles.
 * Redirects to login if not authenticated.
 * Redirects to appropriate dashboard if wrong role.
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user's role is allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const routes = {
      user: '/user/dashboard',
      technician: '/technician/kanban',
      manager: '/manager/dashboard'
    };

    return <Navigate to={routes[user.role] || '/user/dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;

