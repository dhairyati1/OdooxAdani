import React from 'react';
import { getStatusColor, isOverdue } from '../utils/helpers';

/**
 * Maintenance Request Card Component
 * 
 * Displays a single maintenance request in the Kanban board.
 * Shows title, equipment name, assigned technician, and status.
 */
const MaintenanceRequestCard = ({ request, onStatusChange }) => {
  const statusColor = getStatusColor(request.status);
  const overdue = isOverdue(request);
  const isScrap = request.status === 'Scrap';

  // Get equipment name (handle populated or unpopulated)
  const equipmentName = request.equipment?.name || request.equipment || 'Unknown Equipment';
  
  // Get technician name (handle populated or unpopulated)
  const technicianName = request.assignedTechnician 
    ? (request.assignedTechnician.firstName && request.assignedTechnician.lastName
        ? `${request.assignedTechnician.firstName} ${request.assignedTechnician.lastName}`
        : request.assignedTechnician)
    : 'Unassigned';

  // Determine card styling
  let cardClasses = 'bg-white rounded-lg shadow-md p-4 mb-3 border-2 transition-all hover:shadow-lg cursor-pointer';
  
  if (isScrap) {
    cardClasses += ' border-red-400 bg-red-50';
  } else if (overdue) {
    cardClasses += ' border-orange-400 bg-orange-50';
  } else {
    cardClasses += ' border-gray-200';
  }

  // Get available next statuses based on current status
  const getNextStatuses = () => {
    const transitions = {
      'New': ['In Progress'],
      'In Progress': ['Repaired', 'Scrap'],
      'Repaired': [],
      'Scrap': []
    };
    return transitions[request.status] || [];
  };

  const nextStatuses = getNextStatuses();

  const handleStatusClick = async (newStatus) => {
    if (newStatus === 'Repaired') {
      // Prompt for duration
      const durationInput = prompt('Enter duration in hours (required for Repaired status):');
      
      if (durationInput === null) {
        return; // User cancelled
      }
      
      const duration = parseFloat(durationInput);
      
      if (isNaN(duration) || duration <= 0) {
        alert('Please enter a valid duration (positive number)');
        return;
      }
      
      await onStatusChange(request._id, newStatus, duration);
    } else {
      await onStatusChange(request._id, newStatus);
    }
  };

  return (
    <div className={cardClasses}>
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-2">
        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor}`}>
          {request.status}
        </span>
        {overdue && (
          <span className="px-2 py-1 rounded text-xs font-semibold bg-orange-200 text-orange-800">
            Overdue
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
        {request.title}
      </h3>

      {/* Equipment */}
      <div className="text-sm text-gray-600 mb-1">
        <span className="font-medium">Equipment:</span> {equipmentName}
      </div>

      {/* Technician */}
      <div className="text-sm text-gray-600 mb-3">
        <span className="font-medium">Technician:</span> {technicianName}
      </div>

      {/* Action Buttons */}
      {nextStatuses.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
          {nextStatuses.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusClick(status)}
              className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                status === 'Scrap'
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : status === 'Repaired'
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Move to {status}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MaintenanceRequestCard;

