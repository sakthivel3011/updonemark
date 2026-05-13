import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/layout/Sidebar';
import DarkModeToggle from '../../components/ui/DarkModeToggle';
import { Menu, QrCode, Calendar, Clock, MapPin, Users, Download, Loader2, Eye, Trash2, Play, RefreshCw, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function QRCodes() {
  const { user, collegeId, clubId } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [collegeId, clubId]);

  const fetchEvents = async () => {
    if (!collegeId || !clubId) {
      setLoading(false);
      return;
    }

    try {
      const eventsRef = collection(db, `colleges/${collegeId}/clubs/${clubId}/events`);
      const q = query(eventsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const eventsList = [];
      querySnapshot.forEach((doc) => {
        eventsList.push({ id: doc.id, ...doc.data() });
      });
      
      setEvents(eventsList);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleResume = (eventId) => {
    navigate(`/coordinator/event/${eventId}/qr`);
  };

  const handleViewQR = (eventId) => {
    navigate(`/coordinator/event/${eventId}/qr`);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
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
            
            <h2 className="text-xl font-bold text-navy dark:text-white flex items-center gap-2">
              <QrCode size={22} className="text-teal" /> QR Codes
            </h2>
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
            <div className="card">
              <div className="mb-6">
                <div>
                  <h3 className="text-lg font-bold text-navy dark:text-white">Event QR Codes</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage and view QR codes for your events</p>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-teal" size={32} />
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-12">
                  <QrCode size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No events found</p>
                  <button
                    onClick={() => navigate('/coordinator/event/new')}
                    className="btn-primary"
                  >
                    Create Your First Event
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.map((event) => (
                    <div key={event.id} className="bg-white dark:bg-navy-soft rounded-xl p-5 border border-gray-200 dark:border-white/5 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-navy dark:text-white mb-1">{event.eventName}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{event.eventId}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          event.isActive 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {event.isActive ? (event.isPaused ? 'Paused' : 'Active') : 'Stopped'}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar size={14} />
                          {event.date}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Clock size={14} />
                          {event.timeStart}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin size={14} />
                          {event.venue}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Users size={14} />
                          {event.totalScans || 0} scans
                        </div>
                      </div>

                      <button
                        onClick={() => event.isActive && event.isPaused ? handleResume(event.id) : handleViewQR(event.id)}
                        disabled={!event.isActive}
                        className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl font-medium transition-colors ${
                          event.isActive 
                            ? event.isPaused
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'btn-secondary'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {event.isActive ? (
                          event.isPaused ? (
                            <><Play size={16} /> Resume</>
                          ) : (
                            <><Eye size={16} /> View QR Code</>
                          )
                        ) : (
                          <><Eye size={16} /> Event Stopped</>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
