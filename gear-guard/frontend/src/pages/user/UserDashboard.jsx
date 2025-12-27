import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { createMaintenanceRequest, getMaintenanceRequests, getEquipment, getAutofillData } from '../../services/api';
import { getStatusColor } from '../../utils/helpers';

/**
 * User Dashboard
 * 
 * Redesigned to match reference UI with KPI cards and recent requests
 */
const UserDashboard = () => {
  const { user } = useAuth();
  const [equipmentList, setEquipmentList] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    equipment: '',
    equipmentName: '',
    maintenanceTeam: ''
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const equipmentRes = await getEquipment();
      setEquipmentList(equipmentRes.data || equipmentRes || []);

      const requestsRes = await getMaintenanceRequests();
      // Backend already filters to show only user's own requests
      const myRequests = requestsRes.data || requestsRes || [];
      setMyRequests(myRequests);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEquipmentChange = async (e) => {
    const equipmentId = e.target.value;
    setFormData({ ...formData, equipment: equipmentId });

    if (equipmentId) {
      try {
        const autofill = await getAutofillData(equipmentId);
        const data = autofill.data || autofill;
        
        setFormData({
          ...formData,
          equipment: equipmentId,
          equipmentName: data.equipmentName || '',
          maintenanceTeam: data.maintenanceTeam?.id || ''
        });
      } catch (error) {
        console.error('Error fetching autofill data:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await createMaintenanceRequest({
        type: 'Corrective',
        title: formData.title,
        description: formData.description,
        equipment: formData.equipment
      });

      setFormData({
        title: '',
        description: '',
        equipment: '',
        equipmentName: '',
        maintenanceTeam: ''
      });
      setShowCreateForm(false);
      await fetchData();
      alert('Maintenance request created successfully!');
    } catch (error) {
      console.error('Error creating request:', error);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // Calculate stats
  const totalRequests = myRequests.length;
  const openRequests = myRequests.filter(r => r.status !== 'Repaired' && r.status !== 'Scrap').length;
  const inProgress = myRequests.filter(r => r.status === 'In Progress').length;
  const overdue = myRequests.filter(r => {
    if (r.type === 'Preventive' && r.scheduledDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const scheduled = new Date(r.scheduledDate);
      scheduled.setHours(0, 0, 0, 0);
      return scheduled < today && r.status !== 'Repaired';
    }
    return false;
  }).length;

  if (loading) {
    return (
      <AppLayout title="Dashboard" subtitle="Overview of your maintenance operations">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard" subtitle="Overview of your maintenance operations">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalRequests}</p>
                <p className="text-xs text-gray-500 mt-1">Your maintenance requests</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Requests</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{openRequests}</p>
                <p className="text-xs text-gray-500 mt-1">Pending resolution</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{inProgress}</p>
                <p className="text-xs text-gray-500 mt-1">Currently being worked on</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{overdue}</p>
                <p className="text-xs text-gray-500 mt-1">Requires attention</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Create Request Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            {showCreateForm ? 'Cancel' : '+ New Request'}
          </button>
        </div>

        {/* Create Request Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Create Corrective Maintenance Request</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the issue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipment *</label>
                <select
                  required
                  value={formData.equipment}
                  onChange={handleEquipmentChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Equipment</option>
                  {equipmentList.filter(eq => !eq.isScrapped).map(equipment => (
                    <option key={equipment._id} value={equipment._id}>
                      {equipment.name} {equipment.category ? `(${equipment.category})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Create Request
              </button>
            </form>
          </div>
        )}

        {/* Recent Requests */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Recent Maintenance Requests</h2>
          </div>
          <div className="p-6">
            {myRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">You haven't created any maintenance requests yet.</p>
            ) : (
              <div className="space-y-3">
                {myRequests.slice(0, 5).map((request) => {
                  const statusColor = getStatusColor(request.status);
                  const equipmentName = request.equipment?.name || request.equipment || 'Unknown';
                  
                  return (
                    <div key={request._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{request.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor}`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{request.description || 'No description'}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Equipment: {equipmentName}</span>
                        {request.createdAt && (
                          <span>Created: {new Date(request.createdAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default UserDashboard;
