import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/AppLayout';
import { getMaintenanceRequests, getEquipment, getMaintenanceTeams } from '../../services/api';

/**
 * Reports Page
 * 
 * Redesigned to match reference UI with charts and KPI cards
 */
const Reports = () => {
  const [requests, setRequests] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [requestsRes, equipmentRes, teamsRes] = await Promise.all([
        getMaintenanceRequests(),
        getEquipment(),
        getMaintenanceTeams()
      ]);

      setRequests(requestsRes.data || requestsRes || []);
      setEquipment(equipmentRes.data || equipmentRes || []);
      setTeams(teamsRes.data || teamsRes || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRequestsPerTeam = () => {
    const teamStats = {};
    
    teams.forEach(team => {
      teamStats[team._id] = {
        name: team.name,
        total: 0
      };
    });

    requests.forEach(req => {
      const teamId = req.maintenanceTeam?._id?.toString() || req.maintenanceTeam?.toString();
      if (teamId && teamStats[teamId]) {
        teamStats[teamId].total++;
      }
    });

    return Object.values(teamStats);
  };

  const getRequestsPerCategory = () => {
    const categoryStats = {};
    
    requests.forEach(req => {
      const category = req.equipment?.category || 'Other';
      if (!categoryStats[category]) {
        categoryStats[category] = 0;
      }
      categoryStats[category]++;
    });

    const total = Object.values(categoryStats).reduce((sum, val) => sum + val, 0);
    return Object.entries(categoryStats).map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  };

  if (loading) {
    return (
      <AppLayout title="Reports" subtitle="Analytics and insights for your maintenance operations">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AppLayout>
    );
  }

  const teamStats = getRequestsPerTeam();
  const categoryStats = getRequestsPerCategory();
  const totalRequests = requests.filter(r => r.isActive !== false).length;
  const avgResolutionTime = '4.2h'; // Mock data
  const completionRate = '87%'; // Mock data
  const equipmentUptime = '96.5%'; // Mock data

  return (
    <AppLayout title="Reports" subtitle="Analytics and insights for your maintenance operations">
      <div className="space-y-6">
        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Requests per Team Bar Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Requests per Team</h3>
            <div className="h-64 flex items-end justify-center space-x-8">
              {teamStats.slice(0, 3).map((stat, index) => {
                const colors = ['bg-blue-500', 'bg-orange-500', 'bg-green-500'];
                const maxHeight = Math.max(...teamStats.map(s => s.total), 12);
                const height = (stat.total / maxHeight) * 100;
                
                return (
                  <div key={stat.name} className="flex flex-col items-center">
                    <div
                      className={`w-16 ${colors[index]} rounded-t transition-all`}
                      style={{ height: `${height}%`, minHeight: '20px' }}
                    ></div>
                    <span className="mt-2 text-sm text-gray-600">{stat.name}</span>
                    <span className="text-xs text-gray-500">{stat.total}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Requests per Equipment Category Donut Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Requests per Equipment Category</h3>
            <div className="flex items-center justify-center h-64">
              <div className="relative w-48 h-48">
                {/* Simple donut chart representation */}
                <div className="absolute inset-0 rounded-full border-8 border-blue-500"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">100%</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {categoryStats.map((stat, index) => {
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500'];
                return (
                  <div key={stat.category} className="flex items-center space-x-2">
                    <div className={`w-4 h-4 ${colors[index % colors.length]} rounded`}></div>
                    <span className="text-sm text-gray-600">{stat.category}</span>
                    <span className="text-sm font-medium text-gray-900 ml-auto">{stat.percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Total Requests This Month</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalRequests}</p>
            <p className="text-xs text-green-600 mt-1">+12% from last month</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Avg. Resolution Time</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{avgResolutionTime}</p>
            <p className="text-xs text-green-600 mt-1">-8% from last month</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Completion Rate</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{completionRate}</p>
            <p className="text-xs text-green-600 mt-1">+5% from last month</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Equipment Uptime</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{equipmentUptime}</p>
            <p className="text-xs text-green-600 mt-1">+2% from last month</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Reports;
