import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, onSnapshot } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import { generateQRUrl } from '../../utils/qrGenerator';
import { logAction } from '../../utils/activityLogger';
import Sidebar from '../../components/layout/Sidebar';
import DarkModeToggle from '../../components/ui/DarkModeToggle';
import { Users, StopCircle, Share2, Play, Pause, MapPin, ArrowLeft, Menu, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function QRDisplay() {
  const { eventId } = useParams();
  const { collegeId, clubId, user } = useAuth();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [liveCount, setLiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const qrVersion = 1;
  const qrUrl = generateQRUrl(window.location.host, eventId, collegeId, clubId, qrVersion);
  const isPaused = eventData?.isPaused || false;

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId || !collegeId || !clubId) return;
      try {
        const docRef = doc(db, `colleges/${collegeId}/clubs/${clubId}/events/${eventId}`);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setEventData(data);
          setIsCreator(user && data.createdBy === user.uid);
        } else {
          toast.error("Event not found");
          navigate('/coordinator/dashboard');
        }
      } catch (err) {
        console.error("Failed to load event", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId, collegeId, clubId, navigate, user]);

  useEffect(() => {
    if (!eventId || !collegeId || !clubId) return;
    const attRef = collection(db, `colleges/${collegeId}/clubs/${clubId}/events/${eventId}/attendance`);
    const unsub = onSnapshot(attRef, (snap) => {
      setLiveCount(snap.size);
    });
    return () => unsub();
  }, [eventId, collegeId, clubId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // When countdown reaches 0, redirect back to dashboard
          navigate('/coordinator/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  const handleStopEvent = async () => {
    try {
      const eventRef = doc(db, `colleges/${collegeId}/clubs/${clubId}/events/${eventId}`);
      await updateDoc(eventRef, { isActive: false, isPaused: false });
      setEventData(prev => ({...prev, isActive: false, isPaused: false}));
      await logAction(user.uid, collegeId, "STOP_EVENT", { eventId });
      toast.success("Event stopped successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to stop event");
    }
  };

  const handlePauseToggle = async () => {
    try {
      const eventRef = doc(db, `colleges/${collegeId}/clubs/${clubId}/events/${eventId}`);
      const newPaused = !isPaused;
      await updateDoc(eventRef, { isPaused: newPaused });
      toast.success(newPaused ? "Attendance collection paused" : "Attendance collection resumed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle pause state");
    }
  };

  const handleShareWhatsApp = () => {
    const shareUrl = `${window.location.origin}/qr/${eventId}?college=${collegeId}&club=${clubId}`;
    const text = encodeURIComponent(`Scan this QR Code for ${eventData?.eventName}:\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };


  if (loading) return (
    <div className="min-h-screen bg-offwhite dark:bg-navy flex items-center justify-center">
      <Loader2 className="animate-spin text-teal" size={40} />
    </div>
  );

  if (!isCreator) {
    return (
      <div className="min-h-screen bg-offwhite dark:bg-navy flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md mb-6 text-center">
          <h1 className="text-xl font-bold text-navy dark:text-white mb-2">{eventData?.eventName}</h1>
          <p className="text-sm text-gray-500">{eventData?.date} • {eventData?.venue}</p>
          {!eventData?.isActive ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-rust/10 text-rust rounded-full text-xs font-bold mt-2">
              <StopCircle size={12} /> Event Ended
            </span>
          ) : isPaused ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold mt-2">
              <Pause size={12} /> Paused
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold mt-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live
            </span>
          )}
        </div>
        <div className="bg-white dark:bg-navy-soft rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-white/10">
          <div className="text-center mb-4">
            <p className="text-gray-400 font-bold tracking-widest uppercase text-xs">Scan to Mark Attendance</p>
          </div>
          <div className="text-center mb-2">
            <span className={`text-sm font-bold ${eventData?.gpsEnabled ? 'text-teal' : 'text-rust'}`}>
              {eventData?.gpsEnabled ? 'GPS ON' : 'GPS OFF'}
            </span>
          </div>
          <div className={`relative inline-block transition-opacity duration-300 ${!eventData?.isActive || isPaused ? 'opacity-50' : 'opacity-100'}`}>
            <div className="bg-white dark:bg-navy p-4 rounded-2xl shadow-inner border border-gray-50 dark:border-white/5 inline-block">
              <QRCodeSVG value={qrUrl} size={280} level="H" includeMargin={false} fgColor="#040F16" />
            </div>
            {(!eventData?.isActive || isPaused) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-navy/90 text-white px-6 py-3 rounded-xl font-bold text-center">
                  <div className="text-2xl mb-1">{!eventData?.isActive ? '🔒' : '⏸️'}</div>
                  <div className="text-sm">{!eventData?.isActive ? 'Event Stopped' : 'Paused'}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-offwhite dark:bg-navy flex">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        <header className="h-16 sm:h-20 bg-white/50 dark:bg-navy/50 backdrop-blur-md border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-navy dark:text-white">
              <Menu size={24} />
            </button>
            <button onClick={() => navigate('/coordinator/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-teal font-medium transition-colors text-sm">
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
          </div>
          <div className="flex items-center gap-3">
            {eventData?.isActive ? (
              isPaused ? (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center gap-2">
                  <Pause size={12} /> Paused
                </span>
              ) : (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live
                </span>
              )
            ) : (
              <span className="px-3 py-1 bg-rust/10 text-rust rounded-full text-xs font-bold flex items-center gap-2">
                <StopCircle size={12} /> Ended
              </span>
            )}
            <DarkModeToggle />
          </div>
        </header>

        <div className="p-3 sm:p-5 md:p-8 flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-navy dark:text-white mb-4">{eventData?.eventName}</h1>
                <div className="space-y-3 text-gray-500">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal/10 text-teal flex items-center justify-center">
                      <Play size={18} />
                    </div>
                    <span>{eventData?.date} • {eventData?.timeStart || 'All Day'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <MapPin size={18} />
                    </div>
                    <span>{eventData?.venue}</span>
                  </div>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-teal to-primary text-white border-0 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                    <Users size={32} />
                  </div>
                  <div>
                    <p className="text-teal-light text-sm font-medium">Total Checked In</p>
                    <p className="text-4xl font-bold">{liveCount}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button onClick={handleShareWhatsApp} className="w-full card flex items-center justify-center gap-2 py-3 hover:shadow-lg transition-all">
                  <Share2 size={18} /> Share WhatsApp
                </button>
                <div className="grid grid-cols-2 gap-3">
                  {eventData?.isActive ? (
                    isPaused ? (
                      <button onClick={handlePauseToggle} className="card flex items-center justify-center gap-2 py-3 hover:shadow-lg transition-all bg-green-100 text-green-700">
                        <Play size={18} /> Resume
                      </button>
                    ) : (
                      <button onClick={handlePauseToggle} className="card flex items-center justify-center gap-2 py-3 hover:shadow-lg transition-all bg-amber-100 text-amber-700">
                        <Pause size={18} /> Pause
                      </button>
                    )
                  ) : (
                    <button disabled className="card flex items-center justify-center gap-2 py-3 opacity-50 cursor-not-allowed">
                      <StopCircle size={18} /> Stopped
                    </button>
                  )}
                  <button onClick={handleStopEvent} disabled={!eventData?.isActive} className="bg-rust/10 text-rust border border-rust/20 hover:bg-rust hover:text-white flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors disabled:opacity-50">
                    <StopCircle size={18} /> Stop Event
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="bg-white dark:bg-navy-soft rounded-3xl p-5 sm:p-8 shadow-xl border border-gray-100 dark:border-white/10 w-full max-w-sm">
                {!eventData?.isActive && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center z-10">
                    <StopCircle size={64} className="text-rust mb-4" />
                    <h2 className="text-2xl font-bold text-navy dark:text-white mb-2">Event Closed</h2>
                    <p className="text-gray-500">Attendance is no longer active.</p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-gray-400 font-bold tracking-widest uppercase text-xs mb-4">Scan to Mark Attendance</p>
                  <div className="text-center mb-2">
                    <span className={`text-sm font-bold ${eventData?.gpsEnabled ? 'text-teal' : 'text-rust'}`}>
                      {eventData?.gpsEnabled ? 'GPS ON' : 'GPS OFF'}
                    </span>
                  </div>
                  <div className={`relative inline-block transition-opacity duration-300 ${!eventData?.isActive || isPaused ? 'opacity-50' : 'opacity-100'}`}>
                    <div className="bg-white dark:bg-navy p-3 sm:p-4 rounded-2xl shadow-inner border border-gray-50 dark:border-white/5 inline-block">
                      <QRCodeSVG value={qrUrl} size={Math.min(220, window.innerWidth - 120)} level="H" includeMargin={false} fgColor="#040F16" />
                    </div>
                    {(!eventData?.isActive || isPaused) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-navy/90 text-white px-6 py-3 rounded-xl font-bold text-center">
                          <div className="text-2xl mb-1">{!eventData?.isActive ? '' : '⏸'}</div>
                          <div className="text-sm">{!eventData?.isActive ? 'Event Stopped' : 'Event is Paused'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400 font-mono bg-gray-50 dark:bg-navy/50 py-2 rounded-lg">
                    <span className="font-bold text-gray-500">v{qrVersion}</span>
                    <span>•</span>
                    <span className="truncate">{eventId}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
