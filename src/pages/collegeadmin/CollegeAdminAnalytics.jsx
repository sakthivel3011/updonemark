import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/layout/Sidebar';
import DarkModeToggle from '../../components/ui/DarkModeToggle';
import { Menu, BarChart3, Users, ShieldCheck, CalendarDays, ScanLine, ArrowUpRight, TrendingUp, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';

export default function CollegeAdminAnalytics() {
  const { collegeId, collegeName } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalClubs: 0,
    totalCoordinators: 0,
    totalEvents: 0,
    totalScans: 0
  });

  const [clubStats, setClubStats] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, [collegeId]);

  const fetchAnalytics = async () => {
    if (!collegeId) return;
    setLoading(true);
    try {
      // 1. Fetch Clubs
      const clubsSnap = await getDocs(collection(db, `colleges/${collegeId}/clubs`));
      const clubsData = clubsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // 2. Fetch Coordinators
      const coordQ = query(
        collection(db, 'users'),
        where('role', '==', 'coordinator'),
        where('collegeId', '==', collegeId)
      );
      const coordSnap = await getDocs(coordQ);
      
      // 3. Fetch Events & Scans per club
      let totalEvents = 0;
      let totalScans = 0;
      const clubAnalytics = [];

      for (const club of clubsData) {
        const eventsSnap = await getDocs(collection(db, `colleges/${collegeId}/clubs/${club.id}/events`));
        const events = eventsSnap.docs.map(d => d.data());
        
        const clubEventsCount = events.length;
        const clubScansCount = events.reduce((sum, e) => sum + (e.totalScans || 0), 0);
        
        totalEvents += clubEventsCount;
        totalScans += clubScansCount;

        clubAnalytics.push({
          id: club.id,
          name: club.name,
          eventsCount: clubEventsCount,
          scansCount: clubScansCount
        });
      }

      // Sort club analytics by scans desc
      clubAnalytics.sort((a, b) => b.scansCount - a.scansCount);

      setStats({
        totalClubs: clubsData.length,
        totalCoordinators: coordSnap.size,
        totalEvents,
        totalScans
      });
      setClubStats(clubAnalytics);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon, label, value, color }) => (
    <div className="bg-white dark:bg-navy-soft p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${color} shadow-lg`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-navy dark:text-white">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-offwhite dark:bg-navy flex">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        <header className="h-20 bg-white/50 dark:bg-navy/50 backdrop-blur-md border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-navy dark:text-white mr-4">
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold text-navy dark:text-white flex items-center gap-2">
              <BarChart3 className="text-teal" /> Analytics
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchAnalytics();
                toast.success("Data refreshed successfully!");
              }}
              className="p-2 rounded-lg bg-teal text-white hover:bg-teal-dark transition-colors"
              title="Refresh Data"
              disabled={loading}
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <DarkModeToggle />
          </div>
        </header>

        <div className="p-6 md:p-8 flex-1">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-navy dark:text-white">Institution Analytics</h1>
            <p className="text-gray-500">Overview of activities across all clubs in {collegeName}.</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500 text-lg">Calculating analytics...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                  icon={<ShieldCheck size={28} />} 
                  label="Total Clubs" 
                  value={stats.totalClubs} 
                  color="from-teal to-teal-deep" 
                />
                <StatCard 
                  icon={<Users size={28} />} 
                  label="Coordinators" 
                  value={stats.totalCoordinators} 
                  color="from-blue-400 to-blue-600" 
                />
                <StatCard 
                  icon={<CalendarDays size={28} />} 
                  label="Total Events" 
                  value={stats.totalEvents} 
                  color="from-purple-400 to-purple-600" 
                />
                <StatCard 
                  icon={<ScanLine size={28} />} 
                  label="Total Scans" 
                  value={stats.totalScans} 
                  color="from-primary to-rust" 
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Club Performance Bar Chart */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-navy dark:text-white flex items-center gap-2">
                      <BarChart3 size={20} className="text-teal"/> Club Performance
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-teal">
                      <TrendingUp size={16} />
                      <span>Top Performers</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={clubStats.slice(0, 6)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={100}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                      />
                      <YAxis tick={{ fill: '#6b7280' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: 'none', 
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Bar 
                        dataKey="scansCount" 
                        fill="url(#colorGradient)" 
                        radius={[8, 8, 0, 0]}
                        name="Total Scans"
                      />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#14b8a6" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#0d9488" stopOpacity={1}/>
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Events vs Scans Area Chart */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-navy dark:text-white flex items-center gap-2">
                      <CalendarDays size={20} className="text-purple-500"/> Events & Attendance
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-purple-500">
                      <TrendingUp size={16} />
                      <span>Engagement Metrics</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={clubStats.slice(0, 6)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={100}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                      />
                      <YAxis tick={{ fill: '#6b7280' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: 'none', 
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="eventsCount" 
                        stackId="1"
                        stroke="#8b5cf6" 
                        fill="#8b5cf6" 
                        fillOpacity={0.6}
                        name="Events"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="scansCount" 
                        stackId="2"
                        stroke="#06b6d4" 
                        fill="#06b6d4" 
                        fillOpacity={0.6}
                        name="Scans"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Top Clubs Table */}
                <div className="lg:col-span-2 card p-0 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-white/10">
                    <h3 className="text-lg font-bold text-navy dark:text-white flex items-center gap-2">
                      <ArrowUpRight size={20} className="text-teal"/> Performance Rankings
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-navy/50 border-b border-gray-200 dark:border-white/5 text-gray-500 text-sm">
                          <th className="p-4 font-medium">Club / Department</th>
                          <th className="p-4 font-medium text-center">Events</th>
                          <th className="p-4 font-medium text-center">Attendance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {clubStats.length === 0 ? (
                          <tr>
                            <td colSpan="3" className="p-8 text-center text-gray-500">No data available.</td>
                          </tr>
                        ) : (
                          clubStats.map((club, index) => (
                            <tr key={club.id} className="hover:bg-gray-50/50 dark:hover:bg-navy/20 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  <span className="font-semibold text-navy dark:text-white">{club.name}</span>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full text-sm font-medium">
                                  {club.eventsCount}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <span className="inline-flex items-center px-2 py-1 bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 rounded-full text-sm font-bold">
                                  {club.scansCount}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Analytics Summary Card */}
                <div className="card bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700 text-black border-none relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-20">
                   
                  </div>
                  <div className="relative z-10 p-6">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <TrendingUp size={24} />
                      Analytics Summary
                    </h3>
                    
                    <div className="space-y-6">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-black/80 text-sm font-medium">Avg Attendance/Event</span>
                          <span className="font-bold text-lg">{stats.totalEvents > 0 ? Math.round(stats.totalScans / stats.totalEvents) : 0}</span>
                        </div>
                        <div className="w-full bg-black/10 rounded-full h-2">
                          <div className="bg-black h-2 rounded-full transition-all duration-500" style={{width: '75%'}}></div>
                        </div>
                      </div>
                      
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-black/80 text-sm font-medium">Active Clubs</span>
                          <span className="font-bold text-lg">{clubStats.filter(c => c.eventsCount > 0).length} / {stats.totalClubs}</span>
                        </div>
                        <div className="w-full bg-black/10 rounded-full h-2">
                          <div className="bg-black h-2 rounded-full transition-all duration-500" style={{width: stats.totalClubs > 0 ? `${(clubStats.filter(c => c.eventsCount > 0).length / stats.totalClubs) * 100}%` : '0%'}}></div>
                        </div>
                      </div>

                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-black/80 text-sm font-medium">Total Engagement</span>
                          <span className="font-bold text-lg">{stats.totalScans}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
