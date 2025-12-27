import axios from 'axios';

/**
 * API Service Layer
 * 
 * Handles all HTTP requests to the GearGuard backend API.
 * Base URL: http://localhost:5000/api
 * Automatically attaches JWT token from localStorage to all requests
 */

const API_BASE_URL = 'http://localhost:5000/api';

// =====================================
// Axios Instance
// =====================================
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =====================================
// Request Interceptor (JWT)
// =====================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gearGuardToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =====================================
// Response Interceptor (401 handling)
// =====================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('gearGuardToken');
      localStorage.removeItem('gearGuardUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// =====================================
// AUTH APIs
// =====================================

/**
 * Login
 * POST /api/auth/login
 */
export const login = async (email, password) => {
  const response = await api.post('/auth/login', {
    email,
    password,
  });
  return response.data;
};

/**
 * Register
 * POST /api/auth/register
 */
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// =====================================
// MAINTENANCE REQUEST APIs
// =====================================

export const getMaintenanceRequests = async () => {
  const response = await api.get('/maintenance-requests');
  return response.data;
};

export const createMaintenanceRequest = async (requestData) => {
  const response = await api.post('/maintenance-requests', requestData);
  return response.data;
};

export const updateRequestStatus = async (id, status, duration = null) => {
  const payload = { status };
  if (duration !== null) payload.duration = duration;

  const response = await api.patch(
    `/maintenance-requests/${id}/status`,
    payload
  );
  return response.data;
};

export const assignTechnician = async (id, technicianId) => {
  const response = await api.patch(
    `/maintenance-requests/${id}/assign`,
    { technicianId }
  );
  return response.data;
};

export const getAutofillData = async (equipmentId) => {
  const response = await api.get(
    `/maintenance-requests/autofill/${equipmentId}`
  );
  return response.data;
};

// =====================================
// EQUIPMENT APIs
// =====================================

export const createEquipment = async (equipmentData) => {
  const response = await api.post('/equipment', equipmentData);
  return response.data;
};

export const getEquipment = async () => {
  const response = await api.get('/equipment');
  return response.data;
};

// =====================================
// MAINTENANCE TEAM APIs
// =====================================

export const getMaintenanceTeams = async () => {
  const response = await api.get('/maintenance-teams');
  return response.data;
};

export const createMaintenanceTeam = async (teamData) => {
  const response = await api.post('/maintenance-teams', teamData);
  return response.data;
};

// =====================================
// USER APIs
// =====================================

export const createUser = async (userData) => {
  const response = await api.post('/users', userData);
  return response.data;
};

// =====================================
// NOTIFICATION APIs
// =====================================

export const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};

export default api;
