import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, collectionGroup, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/layout/Sidebar';
import DarkModeToggle from '../../components/ui/DarkModeToggle';
import { Menu, ShieldCheck, Plus, Building2, GraduationCap, Calendar, Users, Activity, Clock, BarChart3, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function CollegeAdminDashboard() {
  const { collegeId, collegeName } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalEvents: 0,
    totalCoordinators: 0,
    totalAttendance: 0,
    totalRejected: 0,
    liveEvents: 0,
    clubWiseAttendance: []
  });
  const [pendingCoordinators, setPendingCoordinators] = useState([]);

  useEffect(() => {
    fetchClubs();
    fetchAnalytics();
    fetchPendingCoordinators();
  }, [collegeId]);

  const fetchClubs = async () => {
    if (!collegeId) return;
    try {
      const snap = await getDocs(collection(db, `colleges/${collegeId}/clubs`));
      setClubs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async () => {
    if (!collegeId) return;
    try {
      // Get all events for this college
      const eventsSnap = await getDocs(collection(db, `colleges/${collegeId}/clubs`));
      let totalEvents = 0;
      let liveEvents = 0;
      const clubWiseData = [];

      for (const clubDoc of eventsSnap.docs) {
        const clubData = clubDoc.data();
        const eventsRef = collection(db, `colleges/${collegeId}/clubs/${clubDoc.id}/events`);
        const clubEventsSnap = await getDocs(eventsRef);
        
        let clubAttendance = 0;
        let clubRejected = 0;

        for (const eventDoc of clubEventsSnap.docs) {
          totalEvents++;
          if (eventDoc.data().isActive) {
            liveEvents++;
          }
          
          // Get attendance for this event
          const attendanceRef = collection(db, `colleges/${collegeId}/clubs/${clubDoc.id}/events/${eventDoc.id}/attendance`);
          const attendanceSnap = await getDocs(attendanceRef);
          
          attendanceSnap.forEach(attDoc => {
            if (attDoc.data().status === 'present') {
              clubAttendance++;
            } else if (attDoc.data().status === 'rejected') {
              clubRejected++;
            }
          });
        }

        clubWiseData.push({
          clubName: clubData.name,
          attendance: clubAttendance,
          rejected: clubRejected
        });
      }

      // Get all coordinators for this college
      const coordinatorsQuery = query(
        collection(db, 'users'),
        where('collegeId', '==', collegeId),
        where('role', '==', 'coordinator')
      );
      const coordinatorsSnap = await getDocs(coordinatorsQuery);
      const totalCoordinators = coordinatorsSnap.size;

      // Calculate totals
      const totalAttendance = clubWiseData.reduce((sum, club) => sum + club.attendance, 0);
      const totalRejected = clubWiseData.reduce((sum, club) => sum + club.rejected, 0);

      setAnalytics({
        totalEvents,
        totalCoordinators,
        totalAttendance,
        totalRejected,
        liveEvents,
        clubWiseAttendance: clubWiseData
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCoordinators = async () => {
    if (!collegeId) return;
    try {
      const pendingQuery = query(
        collection(db, 'users'),
        where('collegeId', '==', collegeId),
        where('role', '==', 'coordinator'),
        where('status', '==', 'pending')
      );
      const snap = await getDocs(pendingQuery);
      setPendingCoordinators(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveCoordinator = async (coordinatorId, coordinatorData) => {
    try {
      const userRef = doc(db, 'users', coordinatorId);
      await updateDoc(userRef, { status: 'approved' });
      toast.success('Coordinator approved successfully');
      fetchPendingCoordinators();
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      toast.error('Failed to approve coordinator');
    }
  };

  const handleRejectCoordinator = async (coordinatorId) => {
    try {
      const userRef = doc(db, 'users', coordinatorId);
      await updateDoc(userRef, { status: 'rejected' });
      toast.success('Coordinator rejected');
      fetchPendingCoordinators();
    } catch (err) {
      console.error(err);
      toast.error('Failed to reject coordinator');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchClubs(),
        fetchAnalytics(),
        fetchPendingCoordinators()
      ]);
      toast.success('Dashboard refreshed');
    } catch (err) {
      console.error(err);
      toast.error('Failed to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
  };

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
              <Building2 className="text-teal" /> College Dashboard
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg bg-gray-100 dark:bg-navy-soft text-navy dark:text-white hover:bg-gray-200 dark:hover:bg-navy transition-colors disabled:opacity-50"
              title="Refresh Dashboard"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <DarkModeToggle />
          </div>
        </header>

        <div className="p-4 sm:p-6 md:p-8 flex-1">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-navy dark:text-white">{collegeName}</h1>
            <p className="text-gray-500 text-sm sm:text-base">Manage clubs, coordinators, and view attendance analytics.</p>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="card border-l-4 border-l-primary p-4">
              <p className="text-gray-500 font-medium text-xs">Total Events</p>
              <h3 className="text-2xl font-bold mt-2 text-navy dark:text-white">{analytics.totalEvents}</h3>
            </div>
            <div className="card border-l-4 border-l-teal p-4">
              <p className="text-gray-500 font-medium text-xs">Coordinators</p>
              <h3 className="text-2xl font-bold mt-2 text-navy dark:text-white">{analytics.totalCoordinators}</h3>
            </div>
            <div className="card border-l-4 border-l-green-500 p-4">
              <p className="text-gray-500 font-medium text-xs">Attendance</p>
              <h3 className="text-2xl font-bold mt-2 text-navy dark:text-white">{analytics.totalAttendance}</h3>
            </div>
            <div className="card border-l-4 border-l-rust p-4">
              <p className="text-gray-500 font-medium text-xs">Rejected</p>
              <h3 className="text-2xl font-bold mt-2 text-navy dark:text-white">{analytics.totalRejected}</h3>
            </div>
            <div className="card border-l-4 border-l-purple-500 p-4">
              <p className="text-gray-500 font-medium text-xs">Live Events</p>
              <h3 className="text-2xl font-bold mt-2 text-navy dark:text-white">{analytics.liveEvents}</h3>
            </div>
            <div className="card border-l-4 border-l-blue-500 p-4">
              <p className="text-gray-500 font-medium text-xs">Clubs</p>
              <h3 className="text-2xl font-bold mt-2 text-navy dark:text-white">{clubs.length}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Coordinator Requests */}
            <div className="card p-0 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
                <h3 className="text-base sm:text-lg font-bold text-navy dark:text-white flex items-center gap-2">
                  <Users size={18} className="text-teal" /> Pending Requests
                </h3>
                {pendingCoordinators.length > 0 && (
                  <span className="bg-rust text-white text-xs font-bold px-2 py-1 rounded-full">
                    {pendingCoordinators.length}
                  </span>
                )}
              </div>
              <div className="p-4 sm:p-6">
                {pendingCoordinators.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No pending coordinator requests</p>
                ) : (
                  <div className="space-y-3">
                    {pendingCoordinators.slice(0, 3).map(coord => (
                      <div key={coord.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-navy/50 rounded-lg">
                        <div>
                          <p className="font-semibold text-navy dark:text-white text-sm">{coord.name || coord.displayName}</p>
                          <p className="text-xs text-gray-500">{coord.email}</p>
                          <p className="text-xs text-teal">{coord.department || 'No department'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveCoordinator(coord.id, coord)}
                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button
                            onClick={() => handleRejectCoordinator(coord.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="Reject"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {pendingCoordinators.length > 3 && (
                      <Link to="/collegeadmin/coordinators" className="block text-center text-sm text-teal hover:underline mt-2">
                        View all {pendingCoordinators.length} requests
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Club-wise Attendance Breakdown */}
            <div className="card p-0 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-white/10">
                <h3 className="text-base sm:text-lg font-bold text-navy dark:text-white flex items-center gap-2">
                  <BarChart3 size={18} className="text-teal" /> Club-wise Attendance
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                {analytics.clubWiseAttendance.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No attendance data yet</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.clubWiseAttendance.map((club, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-navy/50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold text-navy dark:text-white text-sm">{club.clubName}</p>
                          <div className="flex gap-4 mt-1">
                            <span className="text-xs text-green-600">{club.attendance} present</span>
                            <span className="text-xs text-red-600">{club.rejected} rejected</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

      
        </div>
      </main>
    </div>
  );
}
