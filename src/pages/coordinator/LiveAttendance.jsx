import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/layout/Sidebar';
import DarkModeToggle from '../../components/ui/DarkModeToggle';
import { Menu, ArrowLeft, Users, Activity, Clock, MapPin, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function LiveAttendance() {
  const { collegeId, clubId, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = async () => {
    try {
      const eventsRef = collection(db, `colleges/${collegeId}/clubs/${clubId}/events`);
      const q = query(eventsRef, where('isActive', '==', true));
      const snap = await getDocs(q);
      const eventsList = [];
      snap.forEach((doc) => {
        eventsList.push({ id: doc.id, ...doc.data() });
      });
      setEvents(eventsList);
      if (eventsList.length > 0 && !selectedEvent) {
        setSelectedEvent(eventsList[0]);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  useEffect(() => {
    if (!collegeId || !clubId) return;
    fetchEvents();
  }, [collegeId, clubId]);

  useEffect(() => {
    if (!selectedEvent) return;

    const attendanceRef = collection(db, `colleges/${collegeId}/clubs/${clubId}/events/${selectedEvent.id}/attendance`);
    const q = query(attendanceRef, orderBy('timestamp', 'desc'));
    
    const unsub = onSnapshot(q, (snap) => {
      const attendanceList = [];
      snap.forEach((doc) => {
        attendanceList.push({ id: doc.id, ...doc.data() });
      });
      setAttendance(attendanceList);
    }, (err) => {
      console.error('Failed to listen to attendance:', err);
    });

    return () => unsub();
  }, [selectedEvent, collegeId, clubId]);


  return (
    <div className="min-h-screen bg-offwhite dark:bg-navy flex">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        <header className="h-20 bg-white/50 dark:bg-navy/50 backdrop-blur-md border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-navy dark:text-white">
              <Menu size={24} />
            </button>
           
            <h2 className="text-xl font-bold text-navy dark:text-white">Live Attendance</h2>
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
          </div>
        </header>

        <div className="p-6 md:p-8 flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-navy dark:text-white mb-2 flex items-center gap-3">
                <Activity className="text-teal" size={32} /> Live Attendance
              </h1>
              <p className="text-gray-500 dark:text-gray-400">Real-time attendance tracking for active events</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-teal" size={40} />
              </div>
            ) : events.length === 0 ? (
              <div className="card p-12 text-center">
                <Activity size={64} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-bold text-navy dark:text-white mb-2">No Active Events</h3>
                <p className="text-gray-500 mb-6">Create an event to start tracking attendance</p>
                <button onClick={() => navigate('/coordinator/event/new')} className="btn-primary">
                  Create New Event
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-navy dark:text-white mb-2">Select Active Event</label>
                  <select
                    value={selectedEvent?.id || ''}
                    onChange={(e) => {
                      const event = events.find(ev => ev.id === e.target.value);
                      setSelectedEvent(event);
                    }}
                    className="w-full px-4 py-3 bg-white dark:bg-navy-soft border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal text-navy dark:text-white"
                  >
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.eventName} - {event.date} • {event.venue}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="card bg-gradient-to-br from-teal to-primary text-white border-0">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                        <Users size={24} />
                      </div>
                      <div>
                        <p className="text-teal-light text-sm">Total Attendance</p>
                        <p className="text-3xl font-bold">{attendance.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-teal/10 text-teal flex items-center justify-center">
                        <Clock size={24} />
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Event Time</p>
                        <p className="text-xl font-bold text-navy dark:text-white">{selectedEvent?.timeStart || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Radius</p>
                        <p className="text-xl font-bold text-navy dark:text-white">{selectedEvent?.radiusMeters || 100}m</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-navy dark:text-white">Recent Check-ins</h2>
                    <span className="text-sm text-gray-500">{attendance.length} students</span>
                  </div>

                  {attendance.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Users size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No check-ins yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-white/10">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll No</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Year</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">GPS Accuracy</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Distance</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                          {attendance.map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-navy/50 transition-colors">
                              <td className="py-3 px-4">
                                <p className="font-medium text-navy dark:text-white">{record.studentName}</p>
                              </td>
                              <td className="py-3 px-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">{record.rollNumber}</p>
                              </td>
                              <td className="py-3 px-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">{record.department}</p>
                              </td>
                              <td className="py-3 px-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">{record.year}</p>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  record.gpsAccuracy <= 50 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {record.gpsAccuracy?.toFixed(0)}m
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  record.status === 'present' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {record.distanceFromEvent}m
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {record.timestamp?.toDate?.() 
                                    ? new Date(record.timestamp.toDate()).toLocaleTimeString() 
                                    : 'Just now'}
                                </p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
