import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/AppLayout';
import { getMaintenanceRequests, getEquipment, getMaintenanceTeams } from '../../services/api';
import { Link } from 'react-router-dom';

/**
 * Manager Dashboard
 * 
 * Redesigned to match reference UI with KPI cards and charts
 */
const ManagerDashboard = () => {
  const [stats, setStats] = useState({
    totalEquipment: 0,
    openRequests: 0,
    inProgress: 0,
    overdue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [equipmentRes, requestsRes] = await Promise.all([
        getEquipment(),
        getMaintenanceRequests()
      ]);

      const equipment = equipmentRes.data || equipmentRes || [];
      const requests = requestsRes.data || requestsRes || [];
      const activeRequests = requests.filter(r => r.isActive !== false);

      setStats({
        totalEquipment: equipment.filter(e => !e.isScrapped).length,
        openRequests: activeRequests.filter(r => r.status !== 'Repaired' && r.status !== 'Scrap').length,
        inProgress: activeRequests.filter(r => r.status === 'In Progress').length,
        overdue: activeRequests.filter(r => {
          if (r.type === 'Preventive' && r.scheduledDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const scheduled = new Date(r.scheduledDate);
            scheduled.setHours(0, 0, 0, 0);
            return scheduled < today && r.status !== 'Repaired';
          }
          return false;
        }).length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

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
                <p className="text-sm font-medium text-gray-600">Total Equipment</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalEquipment}</p>
                <p className="text-xs text-green-600 mt-1">+12 from last week</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Requests</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.openRequests}</p>
                <p className="text-xs text-green-600 mt-1">-3 from last week</p>
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
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.inProgress}</p>
                <p className="text-xs text-green-600 mt-1">+5 from last week</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.overdue}</p>
                <p className="text-xs text-red-600 mt-1">+2 from last week</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Recent Requests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Requests per Team Chart (Mock) */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Requests per Team</h3>
            <div className="h-64 flex items-end justify-center space-x-8">
              <div className="flex flex-col items-center">
                <div className="w-16 bg-blue-500 rounded-t" style={{ height: '80%' }}></div>
                <span className="mt-2 text-sm text-gray-600">Mechanics</span>
                <span className="text-xs text-gray-500">12</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 bg-orange-500 rounded-t" style={{ height: '53%' }}></div>
                <span className="mt-2 text-sm text-gray-600">Electricians</span>
                <span className="text-xs text-gray-500">8</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 bg-green-500 rounded-t" style={{ height: '27%' }}></div>
                <span className="mt-2 text-sm text-gray-600">IT Support</span>
                <span className="text-xs text-gray-500">4</span>
              </div>
            </div>
          </div>

          {/* Recent Requests */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Recent Maintenance Requests</h3>
            </div>
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">Sample Request {i}</h4>
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">New</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Equipment: Sample Equipment</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Assigned to: Sample User</span>
                    <span>2024-12-{31 - i}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ManagerDashboard;
