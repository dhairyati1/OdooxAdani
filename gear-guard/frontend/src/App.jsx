import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import UserDashboard from './pages/user/UserDashboard';
import TechnicianKanban from './pages/technician/TechnicianKanban';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import EquipmentManagement from './pages/manager/EquipmentManagement';
import CalendarView from './pages/manager/CalendarView';
import Teams from './pages/manager/Teams';
import Reports from './pages/manager/Reports';
import Settings from './pages/manager/Settings';

/**
 * Main App Component
 * 
 * Sets up routing and authentication context.
 * All routes are protected based on user role.
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* User Routes */}
          <Route
            path="/user/dashboard"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          {/* Technician Routes */}
          <Route
            path="/technician/kanban"
            element={
              <ProtectedRoute allowedRoles={['technician']}>
                <TechnicianKanban />
              </ProtectedRoute>
            }
          />

          {/* Manager Routes */}
          <Route
            path="/manager/dashboard"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/equipment"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <EquipmentManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/calendar"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <CalendarView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/teams"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <Teams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/reports"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/settings"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
