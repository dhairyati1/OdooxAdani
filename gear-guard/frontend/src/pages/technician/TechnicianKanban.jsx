import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { getMaintenanceRequests, updateRequestStatus, assignTechnician } from '../../services/api';
import MaintenanceRequestCard from '../../components/MaintenanceRequestCard';
import { getStatusColor, isOverdue } from '../../utils/helpers';

/**
 * Technician Kanban Board
 * 
 * Redesigned to match reference UI with clean Kanban columns
 */
const TechnicianKanban = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getMaintenanceRequests();
      const requestsData = response.data || response || [];
      
      // Backend already filters by team, but filter for Corrective only on frontend
      const correctiveRequests = requestsData.filter(req => req.type === 'Corrective');
      
      setRequests(correctiveRequests);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load maintenance requests.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId, newStatus, duration = null) => {
    try {
      await updateRequestStatus(requestId, newStatus, duration);
      await fetchRequests();
    } catch (err) {
      console.error('Error updating status:', err);
      alert(`Failed to update status: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleAssignSelf = async (requestId) => {
    try {
      await assignTechnician(requestId, user.id);
      await fetchRequests();
      alert('Assigned to yourself successfully!');
    } catch (err) {
      console.error('Error assigning self:', err);
      alert(`Failed to assign: ${err.response?.data?.message || err.message}`);
    }
  };

  const getRequestsByStatus = (status) => {
    return requests.filter(req => req.status === status);
  };

  const totalRequests = requests.length;
  const overdueCount = requests.filter(req => isOverdue(req)).length;

  if (loading) {
    return (
      <AppLayout title="Maintenance Requests" subtitle="Track and manage all maintenance work orders">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="Maintenance Requests" subtitle="Track and manage all maintenance work orders">
        <div className="flex items-center justify-center h-64">
          <div className="text-center bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <p className="text-red-800 font-semibold mb-2">Error</p>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchRequests}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Maintenance Requests" subtitle="Track and manage all maintenance work orders">
      <div className="space-y-6">
        {/* Summary Bar */}
        <div className="flex items-center space-x-4">
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium">
            {totalRequests} Total Requests
          </button>
          {overdueCount > 0 && (
            <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{overdueCount} Overdue</span>
            </button>
          )}
          <div className="flex-1"></div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {['New', 'In Progress', 'Repaired', 'Scrap'].map((status) => {
            const columnRequests = getRequestsByStatus(status);
            const statusConfig = {
              'New': { color: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' },
              'In Progress': { color: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-500' },
              'Repaired': { color: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500' },
              'Scrap': { color: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' }
            };
            const config = statusConfig[status] || statusConfig['New'];
            
            return (
              <div key={status} className={`${config.color} ${config.border} rounded-lg border-2 p-4`}>
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
                    <h3 className="font-semibold text-gray-900">{status}</h3>
                  </div>
                  <span className="bg-white px-2 py-1 rounded text-sm font-medium text-gray-700">
                    {columnRequests.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-3 min-h-[400px]">
                  {columnRequests.length === 0 ? (
                    <div className="text-center text-gray-400 py-8 text-sm">
                      No requests
                    </div>
                  ) : (
                    columnRequests.map((request) => {
                      const equipmentName = request.equipment?.name || 'Unknown';
                      const technician = request.assignedTechnician;
                      const technicianInitials = technician?.firstName && technician?.lastName
                        ? `${technician.firstName[0]}${technician.lastName[0]}`.toUpperCase()
                        : 'U';
                      const dueDate = request.scheduledDate 
                        ? new Date(request.scheduledDate).toISOString().split('T')[0]
                        : null;
                      const overdue = isOverdue(request);
                      
                      return (
                        <div key={request._id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
                          {/* Status and Overdue Badge */}
                          <div className="flex items-center justify-between mb-3">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(request.status)}`}>
                              {request.status}
                            </span>
                            {overdue && (
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">
                                Overdue
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h4 className="font-semibold text-gray-900 mb-2">{request.title}</h4>

                          {/* Equipment */}
                          <p className="text-sm text-gray-600 mb-2">{equipmentName}</p>

                          {/* Date and Assigned */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                            {dueDate && (
                              <span className="text-xs text-gray-500">{dueDate}</span>
                            )}
                            {technician && (
                              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white font-semibold">
                                {technicianInitials}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {request.status === 'New' && !request.assignedTechnician && (
                            <button
                              onClick={() => handleAssignSelf(request._id)}
                              className="w-full mt-3 px-3 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                            >
                              Assign to Me
                            </button>
                          )}

                          {/* Status Transition Buttons */}
                          {request.status === 'New' && (
                            <button
                              onClick={() => handleStatusChange(request._id, 'In Progress')}
                              className="w-full mt-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            >
                              Move to In Progress
                            </button>
                          )}
                          {request.status === 'In Progress' && (
                            <div className="flex space-x-2 mt-2">
                              <button
                                onClick={async () => {
                                  const duration = prompt('Enter duration in hours:');
                                  if (duration && !isNaN(duration) && parseFloat(duration) > 0) {
                                    await handleStatusChange(request._id, 'Repaired', parseFloat(duration));
                                  }
                                }}
                                className="flex-1 px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
                              >
                                Mark Repaired
                              </button>
                              <button
                                onClick={() => handleStatusChange(request._id, 'Scrap')}
                                className="flex-1 px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                              >
                                Scrap
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default TechnicianKanban;
