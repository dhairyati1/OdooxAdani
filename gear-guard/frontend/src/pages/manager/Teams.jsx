import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/AppLayout';
import { getMaintenanceTeams, getMaintenanceRequests, getEquipment, createMaintenanceTeam } from '../../services/api';
import { WrenchIcon } from '../../components/icons';

/**
 * Teams Management Page
 * 
 * Redesigned to match reference UI with team cards
 */
const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [teamsRes, requestsRes] = await Promise.all([
        getMaintenanceTeams(),
        getMaintenanceRequests()
      ]);

      setTeams(teamsRes.data || teamsRes || []);
      setRequests(requestsRes.data || requestsRes || []);
      
      // Mock users data - in production this would come from API
      setUsers([
        { id: '1', firstName: 'Robert', lastName: 'Taylor', team: teams[0]?._id, role: 'technician' },
        { id: '2', firstName: 'James', lastName: 'Anderson', team: teams[0]?._id, role: 'technician' },
        { id: '3', firstName: 'Kevin', lastName: 'White', team: teams[0]?._id, role: 'technician' },
        { id: '4', firstName: 'Michael', lastName: 'Brown', team: teams[1]?._id, role: 'technician' },
        { id: '5', firstName: 'Daniel', lastName: 'Harris', team: teams[1]?._id, role: 'technician' },
        { id: '6', firstName: 'Alex', lastName: 'Kim', team: teams[2]?._id, role: 'technician' },
        { id: '7', firstName: 'Ryan', lastName: 'Clark', team: teams[2]?._id, role: 'technician' },
        { id: '8', firstName: 'Jennifer', lastName: 'Lopez', team: teams[2]?._id, role: 'technician' }
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTeamMembers = (teamId) => {
    return users.filter(u => u.team?.toString() === teamId || u.team?._id?.toString() === teamId);
  };

  const getActiveRequests = (teamId) => {
    return requests.filter(req => {
      const reqTeamId = req.maintenanceTeam?._id?.toString() || req.maintenanceTeam?.toString();
      return reqTeamId === teamId && req.isActive !== false && req.status !== 'Repaired';
    }).length;
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!formData.name || !formData.name.trim()) {
      setError('Team name is required');
      setSuccess(null);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      
      console.log('Creating team with data:', formData);
      
      const response = await createMaintenanceTeam({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      });
      
      console.log('Team created successfully:', response);
      
      setSuccess('Team created successfully!');
      setFormData({ name: '', description: '' });
      setShowCreateForm(false);
      
      // Refetch teams to update the list
      await fetchData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error creating team:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create team';
      setError(errorMessage);
      setSuccess(null);
    } finally {
      setSubmitting(false);
    }
  };

  const teamColors = {
    0: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200' },
    1: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-200' },
    2: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-200' }
  };

  if (loading) {
    return (
      <AppLayout title="Teams" subtitle="Manage your maintenance teams and technicians">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AppLayout>
    );
  }

  const totalMembers = users.length;

  return (
    <AppLayout title="Teams" subtitle="Manage your maintenance teams and technicians">
      <div className="space-y-6">
        {/* Summary */}
        <div className="flex items-center space-x-4">
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
            {teams.length} Teams
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
            {totalMembers} Members
          </span>
          <div className="flex-1"></div>
          <button 
            onClick={() => {
              setShowCreateForm(true);
              setError(null);
              setSuccess(null);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + Add Team
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Create Team Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Create New Team</h2>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setError(null);
                    setFormData({ name: '', description: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., IT Support, Maintenance Team A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Optional description of the team"
                  />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded text-sm">
                    {error}
                  </div>
                )}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setError(null);
                      setFormData({ name: '', description: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submitting}
                  >
                    {submitting ? 'Creating...' : 'Create Team'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Team Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team, index) => {
            const members = getTeamMembers(team._id);
            const activeRequests = getActiveRequests(team._id);
            const color = teamColors[index % 3] || teamColors[0];
            
            return (
              <div
                key={team._id}
                className={`${color.bg} ${color.border} rounded-lg border-2 p-6`}
              >
                {/* Team Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${color.icon} flex items-center justify-center`}>
                      <WrenchIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                      <p className="text-sm text-gray-600">{members.length} members</p>
                    </div>
                  </div>
                </div>

                {/* Active Requests */}
                <div className="mb-4 flex items-center space-x-2 text-sm text-gray-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{activeRequests} active</span>
                </div>

                {/* Team Members */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Team Members</h4>
                  <div className="space-y-2">
                    {members.length === 0 ? (
                      <p className="text-sm text-gray-500">No members assigned</p>
                    ) : (
                      members.map((member) => {
                        const initials = `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
                        return (
                          <div key={member.id} className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white font-semibold">
                              {initials}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {member.firstName} {member.lastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {member.role === 'technician' ? 'Technician' : member.role}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default Teams;

