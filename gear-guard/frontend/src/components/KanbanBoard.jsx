import React, { useState, useEffect } from 'react';
import { getMaintenanceRequests, updateRequestStatus } from '../services/api';
import MaintenanceRequestCard from './MaintenanceRequestCard';
import { getStatusColor } from '../utils/helpers';

/**
 * Kanban Board Component
 * 
 * Displays maintenance requests in a 4-column Kanban board:
 * - New
 * - In Progress
 * - Repaired
 * - Scrap
 */
const KanbanBoard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch maintenance requests on component mount
  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Note: Backend doesn't have GET /api/maintenance-requests yet
      // For now, we'll handle this gracefully
      const response = await getMaintenanceRequests();
      
      // Handle different response formats
      const requestsData = response.data || response || [];
      
      // Filter only active requests and Corrective type (as per scope)
      const filteredRequests = requestsData.filter(
        req => req.isActive !== false && req.type === 'Corrective'
      );
      
      setRequests(filteredRequests);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load maintenance requests. Please check if the backend is running.');
      setRequests([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (requestId, newStatus, duration = null) => {
    try {
      await updateRequestStatus(requestId, newStatus, duration);
      
      // Refresh the requests list
      await fetchRequests();
    } catch (err) {
      console.error('Error updating status:', err);
      alert(`Failed to update status: ${err.response?.data?.message || err.message}`);
    }
  };

  // Group requests by status
  const getRequestsByStatus = (status) => {
    return requests.filter(req => req.status === status);
  };

  const columns = [
    { id: 'New', title: 'New', color: 'bg-blue-50 border-blue-200' },
    { id: 'In Progress', title: 'In Progress', color: 'bg-yellow-50 border-yellow-200' },
    { id: 'Repaired', title: 'Repaired', color: 'bg-green-50 border-green-200' },
    { id: 'Scrap', title: 'Scrap', color: 'bg-red-50 border-red-200' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading maintenance requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800 font-semibold mb-2">Error</p>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchRequests}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">GearGuard Maintenance</h1>
        <p className="text-gray-600">Kanban Board - Corrective Maintenance Requests</p>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => {
          const columnRequests = getRequestsByStatus(column.id);
          
          return (
            <div
              key={column.id}
              className={`${column.color} rounded-lg border-2 p-4 min-h-[500px]`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {column.title}
                </h2>
                <span className="bg-white px-2 py-1 rounded text-sm font-medium text-gray-700">
                  {columnRequests.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {columnRequests.length === 0 ? (
                  <div className="text-center text-gray-400 py-8 text-sm">
                    No requests
                  </div>
                ) : (
                  columnRequests.map((request) => (
                    <MaintenanceRequestCard
                      key={request._id}
                      request={request}
                      onStatusChange={handleStatusChange}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <button
          onClick={fetchRequests}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default KanbanBoard;

