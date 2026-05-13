import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/layout/Sidebar';
import DarkModeToggle from '../../components/ui/DarkModeToggle';
import { Menu, CalendarDays, Users, Clock, ArrowRight, AlertCircle, GraduationCap, QrCode, Plus, Activity, FileText, MapPin, RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CoordinatorDashboard() {
  const { collegeId, clubId, user, academicYear, collegeName, clubName } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stats, setStats] = useState({ totalEvents: 0, totalStudents: 0, activeEvents: 0, recentEvents: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    if (!collegeId || !clubId) return;
    try {
      const eventsRef = collection(db, `colleges/${collegeId}/clubs/${clubId}/events`);
      const eventsSnap = await getDocs(eventsRef);
      let totalStudents = 0;
      let activeCount = 0;
      const recent = [];
      
      // For each event, fetch actual scan count from attendance collection
      for (const eventDoc of eventsSnap.docs) {
        const data = eventDoc.data();
        const attendanceRef = collection(db, `colleges/${collegeId}/clubs/${clubId}/events/${eventDoc.id}/attendance`);
        const attendanceSnap = await getDocs(attendanceRef);
        const actualScanCount = attendanceSnap.size;
        
        totalStudents += actualScanCount;
        if (data.isActive) activeCount++;
        
        recent.push({ 
          id: eventDoc.id, 
          ...data,
          totalScans: actualScanCount // Use actual count
        });
      }

      recent.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());

      setStats({
        totalEvents: eventsSnap.size,
        totalStudents,
        activeEvents: activeCount,
        recentEvents: recent.slice(0, 5)
      });
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [collegeId, clubId]);

  return (
    <div className="min-h-screen bg-offwhite dark:bg-navy flex">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen transition-all duration-300">
        <header className="h-16 sm:h-20 bg-white/50 dark:bg-navy/50 backdrop-blur-md border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-navy dark:text-white">
              <Menu size={24} />
            </button>
           
            <div>
              <h2 className="text-xl font-bold text-navy dark:text-white">Dashboard</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <GraduationCap size={12} className="text-teal" />
                <span className="text-xs text-gray-500">{collegeName} • {clubName}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="text-gray-500 hover:text-teal font-medium transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={refreshing ? 'animate-spin' : ''} size={16} /> 
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <DarkModeToggle />
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-navy dark:text-white">{user?.displayName || user?.name || 'Coordinator'}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-teal text-white flex items-center justify-center font-bold">
              {(user?.displayName || user?.name || 'C').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-5 md:p-8 flex-1 overflow-auto">
          {!clubId && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
              <AlertCircle className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">No Club Assigned</p>
                <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">
                  Please contact your College Admin to assign a club to your account. You cannot create events until a club is assigned.
                </p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
            <div className="card bg-gradient-to-br from-teal to-primary text-white border-0 shadow-glow-blue">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-teal-light font-medium text-sm">Total Events</p>
                  <h3 className="text-4xl font-bold mt-1">{stats.totalEvents}</h3>
                </div>
                <div className="p-3 bg-white/20 rounded-xl"><CalendarDays size={24} /></div>
              </div>
              <p className="text-sm text-teal-light">Created by you</p>
            </div>
            
            <div className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-500 font-medium text-sm">Total Scans</p>
                  <h3 className="text-4xl font-bold mt-1 text-navy dark:text-white">{stats.totalStudents}</h3>
                </div>
                <div className="p-3 bg-teal/10 text-teal rounded-xl"><Users size={24} /></div>
              </div>
              <p className="text-sm text-gray-500">Students attended</p>
            </div>

            <div className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-500 font-medium text-sm">Active Events</p>
                  <h3 className="text-4xl font-bold mt-1 text-navy dark:text-white">{stats.activeEvents}</h3>
                </div>
                <div className="p-3 bg-rust/10 text-rust rounded-xl"><Clock size={24} /></div>
              </div>
              <p className="text-sm text-gray-500">Currently running</p>
            </div>

            <div className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-500 font-medium text-sm">Academic Year</p>
                  <h3 className="text-xl font-bold mt-1 text-navy dark:text-white">{academicYear || 'N/A'}</h3>
                </div>
                <div className="p-3 bg-primary/10 text-primary rounded-xl"><GraduationCap size={24} /></div>
              </div>
              <p className="text-sm text-gray-500">Current session</p>
            </div>
          </div>

          
         

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-navy dark:text-white">Recent Events</h3>
            <Link to="/coordinator/history" className="text-sm text-teal font-medium hover:underline flex items-center gap-1">View All <ArrowRight size={16}/></Link>
          </div>
          
          <div className="card p-0 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : stats.recentEvents.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <CalendarDays size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No events yet</p>
                <p className="text-sm mt-2">Create your first event to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-white/5">
                {stats.recentEvents.map(event => (
                  <div key={event.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-navy transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center text-teal">
                        <CalendarDays size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-navy dark:text-white">{event.eventName}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{event.date}</span>
                          <span>•</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            event.gpsEnabled === true 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            GPS {event.gpsEnabled === true ? 'ON' : 'OFF'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div className="hidden sm:block text-right">
                        <p className="text-lg font-bold text-navy dark:text-white">{event.totalScans || 0}</p>
                        <p className="text-xs text-gray-500">scans</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
