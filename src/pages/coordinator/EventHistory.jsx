import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import { exportAttendanceToExcel } from '../../utils/excelExport';

import { shouldAutoStop, canResumeEvent, canRestartStoppedEvent } from '../../utils/eventStatus';
import Sidebar from '../../components/layout/Sidebar';
import DarkModeToggle from '../../components/ui/DarkModeToggle';
import { Menu, Search, Download, ExternalLink, CalendarDays, AlertTriangle, Play, Pause, Users, MapPin, RefreshCw, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function EventHistory() {
  const { collegeId, collegeName, clubId, user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [attLoading, setAttLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Auto-stop events that have exceeded 3 hours
  useEffect(() => {
    if (!collegeId || !clubId) return;

    const checkAndAutoStop = async () => {
      events.forEach(async (evt) => {
        if (shouldAutoStop(evt)) {
          try {
            const eventRef = doc(db, `colleges/${collegeId}/clubs/${clubId}/events/${evt.id}`);
            await updateDoc(eventRef, { isActive: false, autoStopped: true, stoppedAt: new Date() });
            toast.info(`Event "${evt.eventName}" auto-stopped (exceeded 3 hours)`);
          } catch (err) {
            console.error("Auto-stop failed", err);
          }
        }
      });
    };

    // Check every minute
    const interval = setInterval(checkAndAutoStop, 60000);
    checkAndAutoStop(); // Initial check

    return () => clearInterval(interval);
  }, [collegeId, clubId, events]);

  useEffect(() => {
    if (!collegeId || !clubId) return;

    const eventsRef = collection(db, `colleges/${collegeId}/clubs/${clubId}/events`);
    const unsubscribe = onSnapshot(eventsRef, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setEvents(data);
      setLoading(false);
    }, (err) => {
      console.error("Failed to fetch events", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collegeId, clubId]);

  const handleViewDetails = async (evt) => {
    setSelectedEvent(evt);
    setAttLoading(true);
    try {
      // Check if user has proper authentication
      if (!user || !collegeId || !clubId) {
        console.error('Missing authentication data:', { user: !!user, collegeId, clubId });
        toast.error("Authentication required to view attendance");
        return;
      }

      const attRef = collection(db, `colleges/${collegeId}/clubs/${clubId}/events/${evt.id}/attendance`);
      console.log('Fetching attendance from:', `colleges/${collegeId}/clubs/${clubId}/events/${evt.id}/attendance`);
      
      const snap = await getDocs(attRef);
      const attData = snap.docs.map(docSnap => ({ recordId: docSnap.id, ...docSnap.data() }));
      
      console.log('Attendance data fetched:', attData.length, 'records');
      
      // Update total scans for the event
      try {
        const eventRef = doc(db, `colleges/${collegeId}/clubs/${clubId}/events/${evt.id}`);
        await updateDoc(eventRef, { totalScans: attData.length });
      } catch (updateErr) {
        console.warn('Failed to update total scans:', updateErr);
        // Don't fail the whole operation if just the update fails
      }
      
      attData.sort((a, b) => {
        const aMs = a.timestamp?.toMillis?.() ?? a.scannedAt?.toMillis?.() ?? 0;
        const bMs = b.timestamp?.toMillis?.() ?? b.scannedAt?.toMillis?.() ?? 0;
        return bMs - aMs;
      });
      setAttendance(attData);



      if (attData.length === 0) {
        toast.info("No attendance records found for this event");
      } else {
        toast.success(`Loaded ${attData.length} attendance records`);
      }

    } catch (err) {
      console.error('Error loading attendance details:', err);
      
      // Provide more specific error messages
      if (err.code === 'permission-denied') {
        toast.error("Permission denied. You may not have access to view this event's attendance.");
      } else if (err.code === 'not-found') {
        toast.error("Event not found or no attendance data available.");
      } else {
        toast.error("Failed to load attendance details. Please try again.");
      }
    } finally {
      setAttLoading(false);
    }
  };

  const handleExport = () => {
    if (!selectedEvent || attendance.length === 0) return;
    exportAttendanceToExcel(attendance, selectedEvent.eventName, selectedEvent.date);
    toast.success("Download started");
  };

  const handleResumeEvent = async (eventId) => {
    try {
      const eventRef = doc(db, `colleges/${collegeId}/clubs/${clubId}/events/${eventId}`);
      const evt = events.find(e => e.id === eventId);
      
      // If event was stopped (not just paused), also reactivate it
      const updates = { isPaused: false };
      if (!evt.isActive) {
        updates.isActive = true;
        updates.restartedAt = new Date();
      }
      
      await updateDoc(eventRef, updates);
      
      // Update local state
      setEvents(events.map(e => 
        e.id === eventId ? { ...e, isPaused: false, ...updates } : e
      ));
      
      toast.success(evt?.isActive ? "Event resumed!" : "Event restarted! Redirecting to QR page...");
      
      // Navigate to QR page
      setTimeout(() => {
        navigate(`/coordinator/event/${eventId}/qr`);
      }, 800);
    } catch (err) {
      console.error(err);
      toast.error("Failed to resume event");
    }
  };

  const formatAttemptType = (value) => {
    if (!value) return 'N/A';
    if (value === 'retry_success') return 'Retry Success';
    if (value === 'outside') return 'Outside';
    if (value === 'success') return 'Success';
    return value;
  };

  const filteredEvents = events.filter(e => e.eventName.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleRefresh = async () => {
    setRefreshing(true);
    // Events are already being fetched with onSnapshot, so just trigger a re-render
    setRefreshing(false);
  };

  const handleDownload = () => {
    if (attendance.length === 0) {
      toast.error('No records to download');
      return;
    }
    exportAttendanceToExcel(attendance, 'Attendance Records', new Date().toISOString().split('T')[0]);
    toast.success('Download started');
  };

  const stats = {
    total: attendance.length,
    present: attendance.filter(r => r.status === 'present').length,
    absent: attendance.filter(r => r.status === 'absent' || r.status === 'late').length
  };

  return (
    <div className="min-h-screen bg-offwhite dark:bg-navy flex">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        <header className="h-20 bg-white/50 dark:bg-navy/50 backdrop-blur-md border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-navy dark:text-white">
              <Menu size={24} />
            </button>
            
            <h2 className="text-xl font-bold text-navy dark:text-white">Event History</h2>
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

        <div className="p-3 sm:p-5 md:p-8 flex-1 overflow-auto">
         
          <div className="card p-0 overflow-hidden" data-aos="fade-up">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-navy-soft border-b border-gray-200 dark:border-white/5 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-3">Event</th>
                    <th className="p-3 hidden sm:table-cell">Date</th>
                    <th className="p-3 text-center">GPS</th>
                    <th className="p-3 text-center">Scans</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {loading ? (
                    <tr><td colSpan="6" className="p-6 text-center text-gray-500 text-sm">Loading events...</td></tr>
                  ) : filteredEvents.length === 0 ? (
                    <tr><td colSpan="6" className="p-6 text-center text-gray-500 text-sm">No events found.</td></tr>
                  ) : (
                    filteredEvents.map((evt) => (
                      <tr key={evt.id} className="hover:bg-gray-50 dark:hover:bg-navy transition-colors text-navy dark:text-gray-300">
                        <td className="p-3">
                          <div className="font-semibold text-sm leading-tight">{evt.eventName}</div>
                          <div className="text-xs text-gray-500 sm:hidden">{evt.date}</div>
                        </td>
                        <td className="p-3 text-xs hidden sm:table-cell">{evt.date} <br/><span className="text-gray-500">{evt.timeStart}</span></td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            evt.gpsEnabled === true 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {evt.gpsEnabled === true ? 'ON' : 'OFF'}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-sm">{evt.totalScans || 0}</td>
                        <td className="p-3 text-center">
                          {!evt.isActive ? (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full text-xs font-bold">Ended</span>
                          ) : evt.isPaused ? (
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center justify-center gap-1">
                              <Pause size={10} /> <span className="hidden sm:inline">Paused</span>
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Active</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1 sm:gap-2">
                            {canResumeEvent(evt) && (
                              <button 
                                onClick={() => handleResumeEvent(evt.id)}
                                className="bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors"
                              >
                                <Play size={10} /> <span className="hidden sm:inline">Resume</span>
                              </button>
                            )}
                            {canRestartStoppedEvent(evt) && (
                              <button 
                                onClick={() => handleResumeEvent(evt.id)}
                                className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors"
                              >
                                <Play size={10} /> <span className="hidden sm:inline">Restart</span>
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                setSelectedEvent(evt);
                                setAttendance([]);
                                setAttLoading(true);
                                const attRef = collection(db, `colleges/${collegeId}/clubs/${clubId}/events/${evt.id}/attendance`);
                                getDocs(attRef).then(snap => {
                                  const attData = snap.docs.map(docSnap => ({ recordId: docSnap.id, ...docSnap.data() }));
                                  setAttendance(attData);
                                  setAttLoading(false);
                                  exportAttendanceToExcel(attData, evt.eventName, evt.date);
                                  toast.success("Download started");
                                }).catch(err => {
                                  console.error(err);
                                  toast.error("Failed to export data");
                                  setAttLoading(false);
                                });
                              }}
                              className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors"
                            >
                              <Download size={10} /> <span className="hidden sm:inline">Download</span>
                            </button>
                            <button onClick={() => handleViewDetails(evt)} className="text-teal hover:text-teal-deep font-medium text-xs">View</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modal for Event Details */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}></div>
          <div className="bg-white dark:bg-navy-soft rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col relative z-10 animate-fade-up">
            <header className="h-20 bg-white/50 dark:bg-navy/50 backdrop-blur-md border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-6 sticky top-0 z-30">
              <div className="flex items-center gap-4">
                <button onClick={() => setMobileOpen(true)} className="lg:hidden text-navy dark:text-white">
                  <Menu size={24} />
                </button>
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-500 hover:text-teal font-medium transition-colors text-sm flex items-center gap-2"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <h2 className="text-xl font-bold text-navy dark:text-white flex items-center gap-2">
                  <CalendarDays size={22} className="text-teal" /> Event History
                </h2>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button 
                  onClick={handleRefresh} 
                  disabled={refreshing}
                  className="text-gray-500 hover:text-teal font-medium transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  <RefreshCw className={refreshing ? 'animate-spin' : ''} size={16} /> 
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                <button onClick={handleExport} disabled={attendance.length === 0} className="btn-primary !py-2 !px-3 sm:!px-4 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm disabled:opacity-50 flex-1 sm:flex-none justify-center">
                  <Download size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Export Excel</span><span className="sm:hidden">Export</span>
                </button>
                <button onClick={() => setSelectedEvent(null)} className="p-2 text-gray-400 hover:text-navy dark:hover:text-white bg-gray-100 dark:bg-gray-800 rounded-lg shrink-0">✕</button>
              </div>
            </header>
            

            <div className="p-4 sm:p-6 bg-gray-50 dark:bg-navy flex-1 overflow-auto">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
                <div className="bg-white dark:bg-navy-soft p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">Total Attempts</p>
                  <p className="text-2xl sm:text-3xl font-bold text-navy dark:text-white">{attendance.length}</p>
                </div>
                <div className="bg-white dark:bg-navy-soft p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">GPS Status</p>
                  <p className="text-base sm:text-lg font-semibold text-navy dark:text-white">
                    {selectedEvent.gpsEnabled === true ? (
                      <span className="text-green-600 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> GPS ON
                      </span>
                    ) : (
                      <span className="text-gray-600 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span> GPS OFF
                      </span>
                    )}
                  </p>
                </div>
                <div className="bg-white dark:bg-navy-soft p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">GPS Rule</p>
                  <p className="text-base sm:text-lg font-semibold text-navy dark:text-white">Within {selectedEvent.eventRadius || selectedEvent.radiusMeters || 100}m</p>
                </div>
                <div className="bg-white dark:bg-navy-soft p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">Rejected Attempts</p>
                  <p className="text-lg sm:text-xl font-bold text-rust flex items-center gap-2">
                    {attendance.filter(a => a.status === 'rejected').length} <AlertTriangle size={14} className="sm:w-4 sm:h-4"/>
                  </p>
                </div>
              </div>

              {/* Attendance Tabs */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setActiveTab('present')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === 'present' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Users size={16} />
                  Present ({attendance.filter(a => a.status === 'present').length})
                </button>
                <button
                  onClick={() => setActiveTab('rejected')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === 'rejected' 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <MapPin size={16} />
                  Rejected ({attendance.filter(a => a.status === 'rejected').length})
                </button>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    activeTab === 'all' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All ({attendance.length})
                </button>
              </div>

              <div className="bg-white dark:bg-navy-soft rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg font-bold text-navy dark:text-white mb-4">Attendance Details</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-navy-soft border-b border-gray-200 dark:border-white/5 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                          <th className="p-2">S.No</th>
                          <th className="p-2">Roll Number</th>
                          <th className="p-2">Student Name</th>
                          <th className="p-2 hidden sm:table-cell">Department</th>
                          <th className="p-2 hidden md:table-cell">Year</th>
                          <th className="p-2 text-gray-500 hidden lg:table-cell">Timestamp</th>
                          <th className="p-2 text-center">Status</th>
                          <th className="p-2 hidden sm:table-cell">Attempt Type</th>
                          <th className="p-2 text-center">Distance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {attLoading ? (
                          <tr><td colSpan="9" className="p-6 text-center text-gray-500 text-sm">Loading attendance data...</td></tr>
                        ) : attendance.length === 0 ? (
                          <tr><td colSpan="9" className="p-6 text-center text-gray-500 text-sm">No attendance records found.</td></tr>
                        ) : (
                          (() => {
                            const filteredAttendance = activeTab === 'present'
                              ? attendance.filter(a => a.status === 'present')
                              : activeTab === 'rejected'
                              ? attendance.filter(a => a.status === 'rejected')
                              : attendance;

                            if (filteredAttendance.length === 0) {
                              return (
                                <tr><td colSpan="9" className="p-6 text-center text-gray-500 text-sm">
                                  No {activeTab === 'all' ? '' : activeTab} students found.
                                </td></tr>
                              );
                            }

                            return filteredAttendance.map((att, idx) => (
                              <tr key={att.recordId} className={`hover:bg-gray-50 dark:hover:bg-navy transition-colors text-navy dark:text-gray-300 ${att.status === 'rejected' ? 'bg-amber-50' : ''}`}>
                                <td className="p-2">{idx + 1}</td>
                                <td className="p-2 font-semibold">{att.rollNumber || att.rollNo || '-'}</td>
                                <td className="p-2">
                                  <div className="font-medium">{att.studentName || att.name || '-'}</div>
                                  <div className="text-gray-500 sm:hidden text-[10px]">{att.department || '-'} • {att.year || '-'}</div>
                                </td>
                                <td className="p-2 hidden sm:table-cell">{att.department || '-'}</td>
                                <td className="p-2 hidden md:table-cell">{att.year || '-'}</td>
                                <td className="p-2 text-gray-500 hidden lg:table-cell">
                                  {att.timestamp?.seconds
                                    ? new Date(att.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : att.scannedAt?.seconds
                                    ? new Date(att.scannedAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : 'N/A'}
                                </td>
                                <td className="p-2 text-center">
                                  {att.status === 'present' ? (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Present</span>
                                  ) : att.status === 'rejected' ? (
                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center justify-center gap-1">
                                      <MapPin size={10}/> <span className="hidden sm:inline">Rejected</span>
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">Unknown</span>
                                  )}
                                </td>
                                <td className="p-2 hidden sm:table-cell text-gray-600">{formatAttemptType(att.attemptType)}</td>
                                <td className="p-2 text-center font-semibold">
                                  {typeof att.distanceFromEvent === 'number' ? `${att.distanceFromEvent}m` : 'N/A'}
                                </td>
                              </tr>
                            ));
                          })()
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

