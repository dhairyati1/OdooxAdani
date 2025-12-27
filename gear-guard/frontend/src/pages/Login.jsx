import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginAPI, register } from '../services/api';
import { getMaintenanceTeams } from '../services/api';

/**
 * Login Page
 * 
 * Real authentication using JWT.
 * Supports both login and registration.
 */
const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('user');
  const [team, setTeam] = useState('');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Load teams for registration
  React.useEffect(() => {
    if (!isLogin) {
      loadTeams();
    }
  }, [isLogin]);

  const loadTeams = async () => {
    try {
      const response = await getMaintenanceTeams();
      setTeams(response.data || response || []);
    } catch (error) {
      console.error('Error loading teams:', error);
      // Teams endpoint is public, so this shouldn't fail
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;
      
      if (isLogin) {
        // Login
        if (!email || !password) {
          setError('Email and password are required');
          setLoading(false);
          return;
        }

        response = await loginAPI(email, password);
      } else {
        // Register
        if (!email || !password || !firstName || !lastName || !role) {
          setError('All fields are required');
          setLoading(false);
          return;
        }

        if (role === 'technician' && !team) {
          setError('Technicians must select a maintenance team');
          setLoading(false);
          return;
        }

        response = await register({
          email,
          password,
          firstName,
          lastName,
          role,
          team: role === 'technician' ? team : undefined
        });
      }

      // Store token and user info
      const userData = {
        id: response.user.id,
        email: response.user.email,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        role: response.user.role,
        team: response.user.team || null,
        teamName: response.user.teamName || null,
        name: response.user.name || `${response.user.firstName} ${response.user.lastName}`
      };

      login(response.token, userData);

      // Redirect based on role
      const routes = {
        user: '/user/dashboard',
        technician: '/technician/kanban',
        manager: '/manager/dashboard'
      };

      navigate(routes[response.user.role] || '/user/dashboard');
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            GearGuard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Maintenance Management System
          </p>
        </div>

        {/* Toggle Login/Register */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              isLogin
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              !isLogin
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Register
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="user@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter password"
                minLength={6}
              />
            </div>

            {/* Registration fields */}
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    required
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      if (e.target.value !== 'technician') {
                        setTeam('');
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="user">User (Employee)</option>
                    <option value="technician">Technician</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>

                {role === 'technician' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maintenance Team *
                    </label>
                    <select
                      required
                      value={team}
                      onChange={(e) => setTeam(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Team</option>
                      {teams.map(teamOption => (
                        <option key={teamOption._id} value={teamOption._id}>
                          {teamOption.name}
                        </option>
                      ))}
                    </select>
                    {teams.length === 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        No teams available. Please create a team first or contact administrator.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
            </button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>Use email and password to authenticate</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
