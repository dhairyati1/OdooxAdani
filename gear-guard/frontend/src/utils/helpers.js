/**
 * Helper utility functions
 */

/**
 * Check if a maintenance request is overdue
 * Overdue = scheduledDate < today AND status != Repaired
 * 
 * @param {Object} request - Maintenance request object
 * @returns {boolean} - True if request is overdue
 */
export const isOverdue = (request) => {
  if (request.type !== 'Preventive' || !request.scheduledDate) {
    return false;
  }
  
  if (request.status === 'Repaired') {
    return false;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const scheduled = new Date(request.scheduledDate);
  scheduled.setHours(0, 0, 0, 0);
  
  return scheduled < today;
};

/**
 * Format date for display
 * 
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Get status color for styling
 * 
 * @param {string} status - Request status
 * @returns {string} - Tailwind color class
 */
export const getStatusColor = (status) => {
  const colors = {
    'New': 'bg-blue-100 text-blue-800 border-blue-300',
    'In Progress': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Repaired': 'bg-green-100 text-green-800 border-green-300',
    'Scrap': 'bg-red-100 text-red-800 border-red-300'
  };
  
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
};

