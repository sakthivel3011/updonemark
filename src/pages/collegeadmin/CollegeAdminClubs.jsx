import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/layout/Sidebar';
import DarkModeToggle from '../../components/ui/DarkModeToggle';
import { Menu, ShieldCheck, Plus, Trash2, Users, Calendar, Activity, CheckCircle2, XCircle, Building2, Download, UserCheck, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function CollegeAdminClubs() {
  const { collegeId, collegeName } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddClub, setShowAddClub] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [saving, setSaving] = useState(false);
  const [clubStats, setClubStats] = useState({});
  const [showClubEvents, setShowClubEvents] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => {
    fetchClubs();
    fetchClubStats();
    fetchAllEvents();
  }, [collegeId]);

  const fetchAllEvents = async () => {
    if (!collegeId) return;
    setEventsLoading(true);
    try {
      const events = [];
      
      // Get all clubs
      const clubsSnap = await getDocs(collection(db, `colleges/${collegeId}/clubs`));
      
      // Get events for each club
      for (const clubDoc of clubsSnap.docs) {
        const clubId = clubDoc.id;
        const clubData = clubDoc.data();
        
        // Get events for this club
        const eventsSnap = await getDocs(collection(db, `colleges/${collegeId}/clubs/${clubId}/events`));
        const clubEvents = eventsSnap.docs.map(d => ({ 
          id: d.id, 
          clubId,
          clubName: clubData.name,
          ...d.data() 
        }));
        
        // Get scan counts for each event
        for (let i = 0; i < clubEvents.length; i++) {
          const event = clubEvents[i];
          const attendanceSnap = await getDocs(collection(db, `colleges/${collegeId}/clubs/${clubId}/events/${event.id}/attendance`));
          event.totalScans = attendanceSnap.docs.length;
        }
        
        events.push(...clubEvents);
      }
      
      setAllEvents(events);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load events");
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchClubs = async () => {
    if (!collegeId) return;
    try {
      const snap = await getDocs(collection(db, `colleges/${collegeId}/clubs`));
      setClubs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load clubs");
    } finally {
      setLoading(false);
    }
  };

  const fetchClubStats = async () => {
    if (!collegeId) return;
    try {
      const stats = {};
      
      // Get all clubs for this college
      const clubsSnap = await getDocs(collection(db, `colleges/${collegeId}/clubs`));
      
      // Get all coordinators for this college
      const coordinatorsSnap = await getDocs(
        query(collection(db, 'users'), 
        where('role', '==', 'coordinator'), 
        where('collegeId', '==', collegeId),
        where('status', '==', 'approved')
        )
      );
      
      // For each club, find coordinator and count events
      for (const clubDoc of clubsSnap.docs) {
        const clubId = clubDoc.id;
        const clubData = clubDoc.data();
        
        // Find coordinator for this club
        const coordinator = coordinatorsSnap.docs.find(doc => 
          doc.data().clubId === clubId
        );
        
        let eventCount = 0;
        let events = [];
        
        if (coordinator) {
          // Get events for this club
          const eventsSnap = await getDocs(collection(db, `colleges/${collegeId}/clubs/${clubId}/events`));
          events = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          eventCount = events.length;
          
          // Get scan counts for each event
          for (let i = 0; i < events.length; i++) {
            const event = events[i];
            const attendanceSnap = await getDocs(collection(db, `colleges/${collegeId}/clubs/${clubId}/events/${event.id}/attendance`));
            event.totalScans = attendanceSnap.docs.length;
          }
        }
        
        stats[clubId] = {
          clubName: clubData.name,
          coordinator: coordinator ? coordinator.data() : null,
          eventCount,
          events,
          createdAt: clubData.createdAt
        };
      }
      
      setClubStats(stats);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load club statistics");
    }
  };

  const handleAddClub = async (e) => {
    e.preventDefault();
    if (!newClubName.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, `colleges/${collegeId}/clubs`), {
        name: newClubName,
        createdAt: new Date()
      });
      toast.success("Club added successfully!");
      setShowAddClub(false);
      setNewClubName('');
      fetchClubs();
      fetchClubStats();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add club");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClub = async (id) => {
    if (!window.confirm("Are you sure you want to delete this club?")) return;
    try {
      await deleteDoc(doc(db, `colleges/${collegeId}/clubs`, id));
      toast.success("Club deleted successfully");
      fetchClubs();
      fetchClubStats();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete club");
    }
  };

  const downloadClubEvents = async (clubId, clubName) => {
    try {
      const stats = clubStats[clubId];
      if (!stats || !stats.events || stats.events.length === 0) {
        toast.error("No events to download for this club");
        return;
      }

      // Create CSV content
      const headers = [
        'Event Name',
        'Event Date', 
        'Event Time',
        'Venue',
        'Status',
        'Total Scans',
        'Created Date',
        'Coordinator'
      ];

      const csvContent = [
        headers.join(','),
        ...stats.events.map(event => [
          `"${event.eventName || 'Untitled Event'}"`,
          event.eventDate ? `"${event.eventDate.toDate().toLocaleDateString()}"` : '""',
          `"${event.eventTime || 'Not specified'}"`,
          `"${event.venue || 'Not specified'}"`,
          `"${event.isActive ? 'Active' : event.isCompleted ? 'Completed' : 'Upcoming'}"`,
          `"${event.totalScans || 0}"`,
          event.createdAt ? `"${event.createdAt.toDate().toLocaleDateString()}"` : '""',
          `"${stats.coordinator?.displayName || stats.coordinator?.name || 'Not assigned'}"`
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${clubName.replace(/[^a-z0-9]/gi, '_')}_events_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Events downloaded for ${clubName}!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to download events");
    }
  };

  const handleClubClick = (club) => {
    setSelectedClub(club);
    setShowClubEvents(true);
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
              <Building2 className="text-teal" /> Club Management
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchClubs();
                fetchClubStats();
                fetchAllEvents();
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
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-navy dark:text-white">Clubs & Departments</h1>
              <p className="text-gray-500">Create and manage clubs for {collegeName}. Examples: IEEE, NSS, CSE Association, Robotics Club, Rotaract.</p>
            </div>
            <button onClick={() => setShowAddClub(true)} className="btn-primary flex items-center gap-2">
              <Plus size={20} /> Add New Club
            </button>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal mx-auto mb-3"></div>
                  Loading clubs...
                </div>
              ) : clubs.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <ShieldCheck size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No clubs created yet</p>
                  <p className="text-sm mt-2">Click "Add New Club" to create your first club</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-navy/50 border-b border-gray-200 dark:border-white/5 text-gray-500 text-sm">
                      <th className="p-4 text-left font-medium">Club Details</th>
                      <th className="p-4 text-left font-medium">Coordinator</th>
                      <th className="p-4 text-left font-medium">Events</th>
                      <th className="p-4 text-left font-medium">Performance</th>
                      <th className="p-4 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {clubs.map(club => {
                      const stats = clubStats[club.id] || {};
                      const coordinator = stats.coordinator;
                      const eventCount = stats.eventCount || 0;
                      
                      return (
                        <tr key={club.id} className="hover:bg-gray-50 dark:hover:bg-navy/20 transition-colors cursor-pointer" onClick={() => handleClubClick(club)}>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-teal/10 text-teal flex items-center justify-center">
                                <ShieldCheck size={24} />
                              </div>
                              <div>
                                <p className="font-semibold text-navy dark:text-white text-lg">{club.name}</p>
                                <p className="text-xs text-gray-500">ID: {club.id}</p>
                                <p className="text-xs text-gray-500">Created {club.createdAt ? new Date(club.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}</p>
                                <p className="text-xs text-blue-500 mt-1"> Click to view events</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {coordinator ? (
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                  <UserCheck size={16} className="text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                  <p className="font-medium text-navy dark:text-white text-sm">
                                    {coordinator.displayName || coordinator.name || 'Unknown'}
                                  </p>
                                  <p className="text-xs text-gray-500">{coordinator.email}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                  <XCircle size={16} className="text-gray-500" />
                                </div>
                                <span className="text-sm text-gray-500">No coordinator assigned</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                eventCount > 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-800'
                              }`}>
                                <Calendar size={16} className={eventCount > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'} />
                              </div>
                              <div>
                                <p className="font-bold text-navy dark:text-white text-lg">{eventCount}</p>
                                <p className="text-xs text-gray-500">Total events</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                eventCount > 5 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
                              }`}>
                                <Activity size={16} className={eventCount > 5 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'} />
                              </div>
                              <div>
                                <p className={`font-medium text-sm ${
                                  eventCount > 5 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                                }`}>
                                  {eventCount > 5 ? 'Active' : eventCount > 0 ? 'Moderate' : 'Inactive'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {eventCount > 0 ? `${eventCount} events created` : 'No events yet'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                             
                              <button 
                                onClick={() => handleDeleteClub(club.id)}
                                className="p-2 text-rust hover:bg-rust/10 rounded-lg transition-colors"
                                title="Delete Club"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          
        </div>
      </main>

      {/* Add Club Modal */}
      {showAddClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => setShowAddClub(false)}></div>
          <div className="bg-white dark:bg-navy-soft rounded-2xl shadow-2xl w-full max-w-sm relative z-10 p-6">
            <h3 className="text-xl font-bold text-navy dark:text-white mb-6">Create New Club</h3>
            <form onSubmit={handleAddClub} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Club/Department Name</label>
                <input 
                  type="text" 
                  value={newClubName} 
                  onChange={e => setNewClubName(e.target.value)} 
                  required 
                  className="input-field" 
                  placeholder="e.g. IEEE, NSS, Robotics Club" 
                />
                <p className="text-xs text-gray-400 mt-2">Examples: IEEE, NSS, CSE Association, Robotics Club, Rotaract</p>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowAddClub(false)} className="flex-1 btn-secondary !py-3">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary !py-3">{saving ? 'Creating...' : 'Create Club'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Club Events Modal */}
      {showClubEvents && selectedClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => setShowClubEvents(false)}></div>
          <div className="bg-white dark:bg-navy-soft rounded-2xl shadow-2xl w-full max-w-6xl relative z-10 p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-navy dark:text-white">
                  {selectedClub.name} - Events
                </h3>
                <p className="text-gray-500 text-sm">
                  {clubStats[selectedClub.id]?.coordinator?.displayName || clubStats[selectedClub.id]?.coordinator?.name || 'No coordinator'} • 
                  {clubStats[selectedClub.id]?.eventCount || 0} events
                </p>
              </div>
              <button 
                onClick={() => setShowClubEvents(false)} 
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <XCircle size={24} />
              </button>
            </div>

            {clubStats[selectedClub.id]?.events && clubStats[selectedClub.id].events.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-navy/50 border-b border-gray-200 dark:border-white/5 text-gray-500 text-sm">
                      <th className="p-3 text-left font-medium">Event</th>
                      <th className="p-3 text-left font-medium">Date & Time</th>
                      <th className="p-3 text-left font-medium">Venue</th>
                      <th className="p-3 text-center font-medium">Total Scans</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {clubStats[selectedClub.id].events.map(event => (
                      <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-navy/20 transition-colors">
                        <td className="p-3">
                          <div>
                            <p className="font-semibold text-navy dark:text-white">{event.eventName || 'Untitled Event'}</p>
                            <p className="text-xs text-gray-500">ID: {event.id}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <p className="text-navy dark:text-white">
                              {event.eventDate ? new Date(event.eventDate.seconds * 1000).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              }) : event.createdAt ? new Date(event.createdAt.seconds * 1000).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              }) : 'Date not set'}
                            </p>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {event.venue || 'Not specified'}
                          </p>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-bold text-navy dark:text-white">{event.totalScans || 0}</p>
                              <p className="text-xs text-gray-500">scans</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-500">No events created yet</p>
                <p className="text-sm text-gray-400 mt-2">Events created by the coordinator will appear here</p>
              </div>
            )}

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-white/5">
              <div className="text-sm text-gray-500">
                Showing {clubStats[selectedClub.id]?.events?.length || 0} events
              </div>
              <div className="flex gap-3">
              
                <button 
                  onClick={() => setShowClubEvents(false)} 
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
