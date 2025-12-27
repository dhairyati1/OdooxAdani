import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/AppLayout';
import { getMaintenanceRequests, createMaintenanceRequest, getEquipment } from '../../services/api';
import { isOverdue } from '../../utils/helpers';

/**
 * Calendar View for Preventive Maintenance
 * 
 * Redesigned to match reference UI with month calendar view
 */
const CalendarView = () => {
  const [preventiveRequests, setPreventiveRequests] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    equipment: '',
    scheduledDate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [requestsRes, equipmentRes] = await Promise.all([
        getMaintenanceRequests(),
        getEquipment()
      ]);

      const allRequests = requestsRes.data || requestsRes || [];
      const preventive = allRequests.filter(
        req => req.type === 'Preventive' && req.isActive !== false
      );
      
      setPreventiveRequests(preventive);
      setEquipmentList(equipmentRes.data || equipmentRes || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await createMaintenanceRequest({
        type: 'Preventive',
        title: formData.title,
        description: formData.description,
        equipment: formData.equipment,
        scheduledDate: formData.scheduledDate
      });

      setFormData({
        title: '',
        description: '',
        equipment: '',
        scheduledDate: ''
      });
      setShowCreateForm(false);
      await fetchData();
      alert('Preventive maintenance request created successfully!');
    } catch (error) {
      console.error('Error creating request:', error);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // Get requests for a specific date
  const getRequestsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return preventiveRequests.filter(req => {
      if (!req.scheduledDate) return false;
      const reqDate = new Date(req.scheduledDate).toISOString().split('T')[0];
      return reqDate === dateStr;
    });
  };

  // Calendar generation
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  if (loading) {
    return (
      <AppLayout title="Calendar" subtitle="Schedule and view preventive maintenance">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Calendar" subtitle="Schedule and view preventive maintenance">
      <div className="space-y-6">
        {/* Calendar Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + Schedule Maintenance
          </button>
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Schedule Preventive Maintenance</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Equipment *</label>
                  <select
                    required
                    value={formData.equipment}
                    onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Equipment</option>
                    {equipmentList.filter(eq => !eq.isScrapped).map(equipment => (
                      <option key={equipment._id} value={equipment._id}>
                        {equipment.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Schedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200">
            {dayNames.map(day => (
              <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700 bg-gray-50">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {getCalendarDays().map((date, index) => {
              if (!date) {
                return <div key={index} className="min-h-[100px] border-r border-b border-gray-200"></div>;
              }
              
              const requests = getRequestsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
              
              return (
                <div
                  key={index}
                  className={`min-h-[100px] border-r border-b border-gray-200 p-2 ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {requests.slice(0, 2).map((req, i) => {
                      const overdue = isOverdue(req);
                      const statusColors = {
                        'New': 'bg-gray-100 text-gray-800',
                        'In Progress': 'bg-orange-100 text-orange-800',
                        'Repaired': 'bg-green-100 text-green-800'
                      };
                      
                      return (
                        <div
                          key={req._id}
                          className={`text-xs p-1 rounded truncate ${
                            overdue 
                              ? 'bg-red-100 text-red-800' 
                              : statusColors[req.status] || 'bg-gray-100 text-gray-800'
                          }`}
                          title={req.title}
                        >
                          {req.title}
                        </div>
                      );
                    })}
                    {requests.length > 2 && (
                      <div className="text-xs text-gray-500">+{requests.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CalendarView;
