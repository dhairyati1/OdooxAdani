import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import {
  DashboardIcon,
  EquipmentIcon,
  RequestsIcon,
  CalendarIcon,
  TeamsIcon,
  ReportsIcon,
  SettingsIcon,
  SearchIcon,
  ShieldIcon
} from './icons';

/**
 * Main App Layout
 * 
 * Persistent sidebar navigation + top header bar
 * Matches reference design with dark sidebar and light content area
 */
const AppLayout = ({ children, title, subtitle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get user initials
  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.role?.[0].toUpperCase() || 'U';
  };

  // Get role display name
  const getRoleName = () => {
    const roles = {
      user: 'Employee',
      technician: 'Technician',
      manager: 'Administrator'
    };
    return roles[user?.role] || 'User';
  };

  // Navigation items based on role
  const getNavItems = () => {
    const allItems = [
      { path: '/user/dashboard', label: 'Dashboard', icon: DashboardIcon, roles: ['user'] },
      { path: '/manager/dashboard', label: 'Dashboard', icon: DashboardIcon, roles: ['manager'] },
      { path: '/manager/equipment', label: 'Equipment', icon: EquipmentIcon, roles: ['manager'] },
      { path: '/technician/kanban', label: 'Maintenance Requests', icon: RequestsIcon, roles: ['technician'] },
      { path: '/manager/calendar', label: 'Calendar', icon: CalendarIcon, roles: ['manager'] },
      { path: '/manager/teams', label: 'Teams', icon: TeamsIcon, roles: ['manager'] },
      { path: '/manager/reports', label: 'Reports', icon: ReportsIcon, roles: ['manager'] },
      { path: '/manager/settings', label: 'Settings', icon: SettingsIcon, roles: ['manager'] }
    ];

    // For user role, show dashboard only
    if (user?.role === 'user') {
      return allItems.filter(item => item.path === '/user/dashboard');
    }

    // For technician, show requests only (no dashboard)
    if (user?.role === 'technician') {
      return allItems.filter(item => item.path === '/technician/kanban');
    }

    // For manager, show all manager routes
    return allItems.filter(item => item.roles.includes('manager'));
  };

  const navItems = getNavItems();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-64 bg-gray-800 text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="text-blue-400">
              <ShieldIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="font-bold text-lg">GearGuard</div>
              <div className="text-xs text-gray-400">Maintenance Tracker</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold">
              {getUserInitials()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {user?.name || 'User'}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {getRoleName()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Page Title */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{title || 'Dashboard'}</h1>
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search equipment, requests..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>

              {/* Notifications */}
              <NotificationBell />

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold text-white">
                    {getUserInitials()}
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.name || 'User'}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

